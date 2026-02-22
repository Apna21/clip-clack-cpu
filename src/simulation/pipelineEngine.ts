import {
  CPUState,
  ControlSignals,
  DecodedInstruction,
  EXMEMRegister,
  ForwardingInfo,
  ForwardSource,
  HazardEvent,
  HazardInfo,
  IDEXRegister,
  IFIDRegister,
  MEMWBRegister,
  PipelineRegisters,
  PipelineSnapshot,
  PipelineStageName,
  PipelineStats,
  SimulationOptions,
  StageView,
  EngineState,
} from "./types";
import { ParseResult, parseAssembly } from "./programParser";
import { MEMORY_SIZE, NUM_REGISTERS } from "./types";

type RequiredOptions = Required<SimulationOptions>;

interface ExecuteResult {
  nextExMem: EXMEMRegister;
  branchTaken: boolean;
  branchTarget?: number;
  forwardsApplied: number;
  forwarding: ForwardingInfo;
}

interface DecodeResult {
  nextIdEx: IDEXRegister;
  stalled: boolean;
}

interface FetchResult {
  nextIfId: IFIDRegister;
  nextPc: number;
}

/**
 * Hazard Detection Unit (HDU) responsibilities:
 * - Handles data hazards (RAW) with load-use stalling and ALU result forwarding.
 * - Provides simple control hazard management for BEQ using predict-not-taken policy and EX-stage resolution.
 * - Structural hazards and WAR/WAW hazards are not modelled; the pipeline is single-issue with dedicated resources.
 * - Supported ISA subset: ADD, SUB, AND, OR, LW, SW, BEQ, plus injected NOP bubbles when stalling.
 */
export class PipelineEngine {
  private program: DecodedInstruction[] = [];
  private cpu: CPUState;
  private pipeline: PipelineRegisters;
  private options: RequiredOptions;
  private stageHazards: Partial<Record<PipelineStageName, HazardInfo>> = {};
  private currentFetchInstruction: DecodedInstruction | null = null;
  private stalledThisCycle = false;
  private flushedThisCycle = false;
  private forwardingThisCycle: ForwardingInfo = {};
  private hazardEventsThisCycle: HazardEvent[] = [];

  constructor(options: SimulationOptions = {}) {
    this.options = {
      memorySize: options.memorySize ?? MEMORY_SIZE,
      registerCount: options.registerCount ?? NUM_REGISTERS,
    };

    this.cpu = createInitialCpuState(this.options);
    this.pipeline = createInitialPipeline();
  }

  loadProgram(instructions: DecodedInstruction[]): void {
    this.program = instructions.map((instr) => ({ ...instr }));
    this.reset(false);
  }

  loadProgramFromSource(source: string): ParseResult {
    const result = parseAssembly(source);
    if (result.errors.length === 0) {
      this.loadProgram(result.instructions);
    }
    return result;
  }

  reset(clearProgram = false): void {
    if (clearProgram) {
      this.program = [];
    }
    this.cpu = createInitialCpuState(this.options);
    this.pipeline = createInitialPipeline();
    this.stageHazards = {};
    this.currentFetchInstruction = null;
    this.cpu.halted = this.program.length === 0;
  }

  getSnapshot(): PipelineSnapshot {
    return this.buildSnapshot();
  }

  exportState(): EngineState {
    return {
      cpu: cloneCpuState(this.cpu),
      pipeline: deepCopyPipeline(this.pipeline),
      currentFetchInstruction: this.currentFetchInstruction,
    };
  }

  restoreState(state: EngineState): void {
    this.cpu = cloneCpuState(state.cpu);
    this.pipeline = deepCopyPipeline(state.pipeline);
    this.currentFetchInstruction = state.currentFetchInstruction;
    this.stageHazards = {};
    this.stalledThisCycle = false;
    this.flushedThisCycle = false;
    this.forwardingThisCycle = {};
    this.hazardEventsThisCycle = [];
  }

  step(): PipelineSnapshot {
    if (this.cpu.halted) {
      return this.buildSnapshot();
    }

    this.stageHazards = {};
    this.stalledThisCycle = false;
    this.flushedThisCycle = false;
    this.forwardingThisCycle = {};
    this.hazardEventsThisCycle = [];
    const previousPipeline = deepCopyPipeline(this.pipeline);

    // 1. Write Back stage (uses previous MEM/WB register)
    this.handleWriteBack(previousPipeline.memWb);

    // 2. Memory stage (produces next MEM/WB register)
    const nextMemWb = this.handleMemory(previousPipeline.exMem);

    // 3. Execute stage (produces next EX/MEM register)
    const executeResult = this.handleExecute(previousPipeline.idEx, previousPipeline.exMem, previousPipeline.memWb);

    // 4. Decode stage (consumes IF/ID register, may stall)
    const decodeResult = this.handleDecode(previousPipeline.ifId, previousPipeline.idEx);

    // 5. Fetch stage (may be suppressed by stall or branch)
    const fetchResult = this.handleFetch(decodeResult.stalled);

    // Assemble new pipeline registers
    const nextPipeline: PipelineRegisters = {
      ifId: fetchResult.nextIfId,
      idEx: decodeResult.nextIdEx,
      exMem: executeResult.nextExMem,
      memWb: nextMemWb,
    };

    // Handle branch flush if a branch was taken in EX stage
    if (executeResult.branchTaken) {
      nextPipeline.ifId = createIFIDBubble();
      nextPipeline.idEx = createIDEXBubble();
      this.currentFetchInstruction = null;
      this.recordFlush("branch-taken");
      this.stageHazards.IF = {
        type: "stall",
        description: "Flushed due to taken branch",
      };
      this.cpu.pc = executeResult.branchTarget ?? this.cpu.pc;
    } else {
      this.cpu.pc = fetchResult.nextPc;
    }

    this.pipeline = nextPipeline;

    // Update stats
    this.cpu.stats.cycleCount += 1;
    if (executeResult.forwardsApplied > 0) {
      this.cpu.stats.forwardCount += executeResult.forwardsApplied;
      const forwardSummary = [
        executeResult.forwarding.aFrom && `A←${executeResult.forwarding.aFrom}`,
        executeResult.forwarding.bFrom && `B←${executeResult.forwarding.bFrom}`,
      ]
        .filter(Boolean)
        .join(", ");
      this.stageHazards.EX = {
        type: "forward",
        description:
          forwardSummary.length > 0
            ? `Forwarding applied (${forwardSummary})`
            : `${executeResult.forwardsApplied} forwarding path${executeResult.forwardsApplied > 1 ? "s" : ""} used`,
      };
    }
    this.forwardingThisCycle = executeResult.forwarding;

    // Stall accounting handled inside decode

    // Halt condition: program exhausted and pipeline drained
    if (this.isPipelineDrained() && this.cpu.pc / 4 >= this.program.length) {
      this.cpu.halted = true;
      this.currentFetchInstruction = null;
    }

    return this.buildSnapshot();
  }

  private handleWriteBack(memWb: MEMWBRegister): void {
    if (!memWb.instruction || memWb.control.isNop) {
      return;
    }
    this.cpu.stats.instructionsCompleted += 1;
    if (!memWb.control.regWrite) {
      return;
    }
    const dest = memWb.destReg ?? null;
    if (dest === null || dest === 0) {
      return;
    }
    // Clone-on-write to avoid mutating the Int32Array reference that React relies on.
    const registersCopy = new Int32Array(this.cpu.registers);
    registersCopy[dest] = memWb.writeData;
    this.cpu.registers = registersCopy;
  }

  private handleMemory(exMem: EXMEMRegister): MEMWBRegister {
    if (!exMem.instruction || exMem.control.isNop) {
      return createMEMWBBubble();
    }

    let memoryData = 0;
    const address = exMem.aluResult;

    if (exMem.control.memRead) {
      memoryData = this.safeReadMemory(address);
    }

    if (exMem.control.memWrite) {
      this.safeWriteMemory(address, exMem.writeData);
    }

    return {
      instruction: exMem.instruction,
      pc: exMem.pc,
      destReg: exMem.destReg,
      control: { ...exMem.control },
      writeData: exMem.control.memToReg ? memoryData : exMem.aluResult,
    };
  }

  private handleExecute(
    idEx: IDEXRegister,
    exMem: EXMEMRegister,
    memWb: MEMWBRegister
  ): ExecuteResult {
    if (!idEx.instruction || idEx.control.isNop) {
      return {
        nextExMem: createEXMEMBubble(),
        branchTaken: false,
        forwardsApplied: 0,
        forwarding: {},
      };
    }

    const forwarding = this.resolveForwarding(idEx, exMem, memWb);
    let operandA = forwarding.rsValue;
    let operandB = idEx.control.useImmediate ? idEx.immediate ?? 0 : forwarding.rtValue;

    const storeData = forwarding.rtValue;
    let aluResult = 0;
    let branchTaken = false;

    switch (idEx.instruction.opcode) {
      case "ADD":
        aluResult = operandA + operandB;
        break;
      case "SUB":
        aluResult = operandA - operandB;
        break;
      case "AND":
        aluResult = operandA & operandB;
        break;
      case "OR":
        aluResult = operandA | operandB;
        break;
      case "LW":
      case "SW":
        aluResult = operandA + (idEx.immediate ?? 0);
        break;
      case "BEQ":
        branchTaken = operandA === operandB;
        aluResult = operandA - operandB;
        break;
      case "NOP":
      default:
        break;
    }

    if (idEx.instruction.opcode === "BEQ") {
      this.cpu.stats.branchCount += 1;
      if (branchTaken) {
        this.cpu.stats.branchMispredictions += 1;
      }
    }

    return {
      nextExMem: {
        instruction: idEx.instruction,
        pc: idEx.pc,
        aluResult,
        writeData: storeData,
        destReg: idEx.destReg,
        control: { ...idEx.control },
        branchTaken,
        branchTarget: idEx.branchTarget,
      },
      branchTaken,
      branchTarget: idEx.branchTarget,
      forwardsApplied: forwarding.forwardCount,
      forwarding: forwarding.sources,
    };
  }

  private handleDecode(
    ifId: IFIDRegister,
    idEx: IDEXRegister
  ): DecodeResult {
    if (!ifId.instruction || ifId.instruction.opcode === "NOP") {
      return {
        nextIdEx: createIDEXBubble(),
        stalled: false,
      };
    }

    const loadUseHazard = detectLoadUseHazard(ifId.instruction, idEx);
    if (loadUseHazard) {
      this.cpu.stats.stallCount += 1;
      this.stageHazards.ID = {
        type: "stall",
        description: `Load-use hazard on ${this.formatRegister(idEx.destReg) ?? "register"}`,
      };
      this.recordStall("load-use", idEx.destReg);
      return {
        nextIdEx: createIDEXBubble(),
        stalled: true,
      };
    }

    const control = deriveControlSignals(ifId.instruction);
    const rsValue = ifId.instruction.rs !== undefined ? this.cpu.registers[ifId.instruction.rs] : 0;
    const rtValue = ifId.instruction.rt !== undefined ? this.cpu.registers[ifId.instruction.rt] : 0;

    return {
      nextIdEx: {
        instruction: ifId.instruction,
        pc: ifId.pc,
        rsValue,
        rtValue,
        destReg: ifId.instruction.destReg,
        immediate: ifId.instruction.immediate,
        branchTarget: ifId.instruction.branchTarget,
        control,
      },
      stalled: false,
    };
  }

  private handleFetch(stalled: boolean): FetchResult {
    if (stalled) {
      return {
        nextIfId: deepCopyIFID(this.pipeline.ifId),
        nextPc: this.cpu.pc,
      };
    }

    const fetchPc = this.cpu.pc;

    const instruction = this.fetchInstruction(fetchPc);
    this.currentFetchInstruction = instruction;
    const ifId: IFIDRegister = {
      instruction,
      pc: fetchPc,
    };

    return {
      nextIfId: ifId,
      nextPc: fetchPc + 4,
    };
  }

  private fetchInstruction(pc: number): DecodedInstruction | null {
    const index = pc / 4;
    if (!Number.isInteger(index) || index < 0 || index >= this.program.length) {
      return null;
    }
    return this.program[index];
  }

  private resolveForwarding(
    idEx: IDEXRegister,
    exMem: EXMEMRegister,
    memWb: MEMWBRegister
  ): ForwardingResult {
    const result: ForwardingResult = {
      rsValue: idEx.rsValue,
      rtValue: idEx.rtValue,
      forwardCount: 0,
      sources: {},
    };

    if (!idEx.instruction || idEx.control.isNop) {
      return result;
    }

    const applyForwarding = (
      targetReg: number | undefined,
      currentValue: number,
      operand: "A" | "B"
    ): number => {
      if (!isRegisterNumber(targetReg) || targetReg === 0) {
        return currentValue;
      }

      let forwardedValue = currentValue;
      let forwarded = false;

      if (
        exMem.instruction &&
        !exMem.control.isNop &&
        exMem.control.regWrite &&
        exMem.destReg === targetReg &&
        !exMem.control.memToReg
      ) {
        forwardedValue = exMem.aluResult;
        forwarded = true;
        result.sources = {
          ...result.sources,
          ...(operand === "A" ? { aFrom: "EX/MEM" as ForwardSource } : { bFrom: "EX/MEM" as ForwardSource }),
        };
        this.recordForward(operand, "EX/MEM", targetReg);
      } else if (
        memWb.instruction &&
        !memWb.control.isNop &&
        memWb.control.regWrite &&
        memWb.destReg === targetReg
      ) {
        forwardedValue = memWb.writeData;
        forwarded = true;
        result.sources = {
          ...result.sources,
          ...(operand === "A" ? { aFrom: "MEM/WB" as ForwardSource } : { bFrom: "MEM/WB" as ForwardSource }),
        };
        this.recordForward(operand, "MEM/WB", targetReg);
      }

      if (forwarded) {
        result.forwardCount += 1;
      }
      return forwardedValue;
    };

    const rs = idEx.instruction.rs;
    const rt = idEx.instruction.rt;

    result.rsValue = applyForwarding(rs, result.rsValue, "A");
    result.rtValue = applyForwarding(rt, result.rtValue, "B");

    return result;
  }

  private recordStall(reason: string, reg?: number): void {
    this.stalledThisCycle = true;
    this.hazardEventsThisCycle.push({
      type: "STALL",
      reason,
      reg: this.formatRegister(reg),
      cycle: this.getEventCycle(),
    });
  }

  private recordForward(operand: "A" | "B", source: ForwardSource, reg?: number): void {
    this.hazardEventsThisCycle.push({
      type: "FORWARD",
      reason: operand === "A" ? "operand-A" : "operand-B",
      from: source,
      to: "EX",
      reg: this.formatRegister(reg),
      cycle: this.getEventCycle(),
    });
  }

  private recordFlush(reason: string): void {
    this.flushedThisCycle = true;
    this.hazardEventsThisCycle.push({
      type: "FLUSH",
      reason,
      cycle: this.getEventCycle(),
    });
  }

  private getEventCycle(): number {
    return this.cpu.stats.cycleCount + 1;
  }

  private formatRegister(reg?: number): string | undefined {
    if (reg === undefined || reg === null) {
      return undefined;
    }
    return `R${reg}`;
  }

  private safeReadMemory(address: number): number {
    const index = address >>> 2;
    if (index < 0 || index >= this.cpu.memory.length) {
      return 0;
    }
    return this.cpu.memory[index];
  }

  private safeWriteMemory(address: number, value: number): void {
    const index = address >>> 2;
    if (index < 0 || index >= this.cpu.memory.length) {
      return;
    }
    const memoryCopy = new Int32Array(this.cpu.memory);
    memoryCopy[index] = value;
    this.cpu.memory = memoryCopy;
  }

  private isPipelineDrained(): boolean {
    return (
      isBubble(this.pipeline.ifId.instruction) &&
      isBubble(this.pipeline.idEx.instruction) &&
      isBubble(this.pipeline.exMem.instruction) &&
      isBubble(this.pipeline.memWb.instruction)
    );
  }

  private buildSnapshot(): PipelineSnapshot {
    const stages: Record<PipelineStageName, StageView> = {
      IF: createStageView("IF", this.currentFetchInstruction, this.stageHazards.IF),
      ID: createStageView("ID", this.pipeline.ifId.instruction, this.stageHazards.ID),
      EX: createStageView("EX", this.pipeline.idEx.instruction, this.stageHazards.EX),
      MEM: createStageView("MEM", this.pipeline.exMem.instruction, this.stageHazards.MEM),
      WB: createStageView("WB", this.pipeline.memWb.instruction, this.stageHazards.WB),
    };

    const stats = this.computeDerivedStats(this.cpu.stats);

    return {
      cycle: this.cpu.stats.cycleCount,
      halted: this.cpu.halted,
      stages,
      registers: Array.from(this.cpu.registers),
      memory: Array.from(this.cpu.memory),
      stats,
      stalledThisCycle: this.stalledThisCycle,
      flushedThisCycle: this.flushedThisCycle,
      forwarding: { ...this.forwardingThisCycle },
      hazardEvents: [...this.hazardEventsThisCycle],
    };
  }

  private computeDerivedStats(stats: PipelineStats): PipelineStats & { cpi: number; branchAccuracy: number } {
    const { cycleCount, instructionsCompleted, branchCount, branchMispredictions } = stats;
    const cpi =
      instructionsCompleted > 0 ? cycleCount / instructionsCompleted : cycleCount > 0 ? cycleCount : 0;
    const branchAccuracy =
      branchCount > 0
        ? ((branchCount - branchMispredictions) / branchCount) * 100
        : 100;

    return {
      ...stats,
      cpi,
      branchAccuracy,
    };
  }
}

function cloneCpuState(cpu: CPUState): CPUState {
  return {
    pc: cpu.pc,
    registers: new Int32Array(cpu.registers),
    memory: new Int32Array(cpu.memory),
    halted: cpu.halted,
    stats: { ...cpu.stats },
  };
}

function createInitialCpuState(options: RequiredOptions): CPUState {
  return {
    pc: 0,
    registers: new Int32Array(options.registerCount),
    memory: new Int32Array(options.memorySize),
    halted: false,
    stats: {
      cycleCount: 0,
      instructionsCompleted: 0,
      stallCount: 0,
      forwardCount: 0,
      branchCount: 0,
      branchMispredictions: 0,
    },
  };
}

function createInitialPipeline(): PipelineRegisters {
  return {
    ifId: createIFIDBubble(),
    idEx: createIDEXBubble(),
    exMem: createEXMEMBubble(),
    memWb: createMEMWBBubble(),
  };
}

function createIFIDBubble(): IFIDRegister {
  return { instruction: null, pc: 0 };
}

function createIDEXBubble(): IDEXRegister {
  return {
    instruction: null,
    pc: 0,
    rsValue: 0,
    rtValue: 0,
    control: createNopControl(),
  };
}

function createEXMEMBubble(): EXMEMRegister {
  return {
    instruction: null,
    pc: 0,
    aluResult: 0,
    writeData: 0,
    control: createNopControl(),
    branchTaken: false,
  };
}

function createMEMWBBubble(): MEMWBRegister {
  return {
    instruction: null,
    pc: 0,
    writeData: 0,
    control: createNopControl(),
  };
}

function createNopControl(): ControlSignals {
  return {
    regWrite: false,
    memRead: false,
    memWrite: false,
    memToReg: false,
    branch: false,
    aluOp: "ADD",
    useImmediate: false,
    isNop: true,
  };
}

function deepCopyPipeline(pipeline: PipelineRegisters): PipelineRegisters {
  return {
    ifId: deepCopyIFID(pipeline.ifId),
    idEx: deepCopyIDEX(pipeline.idEx),
    exMem: deepCopyEXMEM(pipeline.exMem),
    memWb: deepCopyMEMWB(pipeline.memWb),
  };
}

function deepCopyIFID(register: IFIDRegister): IFIDRegister {
  return {
    instruction: register.instruction,
    pc: register.pc,
  };
}

function deepCopyIDEX(register: IDEXRegister): IDEXRegister {
  return {
    instruction: register.instruction,
    pc: register.pc,
    rsValue: register.rsValue,
    rtValue: register.rtValue,
    destReg: register.destReg,
    immediate: register.immediate,
    branchTarget: register.branchTarget,
    control: { ...register.control },
  };
}

function deepCopyEXMEM(register: EXMEMRegister): EXMEMRegister {
  return {
    instruction: register.instruction,
    pc: register.pc,
    aluResult: register.aluResult,
    writeData: register.writeData,
    destReg: register.destReg,
    control: { ...register.control },
    branchTaken: register.branchTaken,
    branchTarget: register.branchTarget,
  };
}

function deepCopyMEMWB(register: MEMWBRegister): MEMWBRegister {
  return {
    instruction: register.instruction,
    pc: register.pc,
    writeData: register.writeData,
    destReg: register.destReg,
    control: { ...register.control },
  };
}

function isBubble(instruction: DecodedInstruction | null | undefined): boolean {
  return !instruction || instruction.opcode === "NOP" || instruction.isBubble === true;
}

function createStageView(
  stage: PipelineStageName,
  instruction: DecodedInstruction | null | undefined,
  hazard?: HazardInfo
): StageView {
  return {
    stage,
    instruction: isBubble(instruction) ? null : instruction?.raw ?? null,
    hazard,
  };
}

function deriveControlSignals(instruction: DecodedInstruction): ControlSignals {
  switch (instruction.opcode) {
    case "ADD":
    case "SUB":
    case "AND":
    case "OR":
      return {
        regWrite: true,
        memRead: false,
        memWrite: false,
        memToReg: false,
        branch: false,
        aluOp: instruction.opcode,
        useImmediate: false,
      };
    case "LW":
      return {
        regWrite: true,
        memRead: true,
        memWrite: false,
        memToReg: true,
        branch: false,
        aluOp: "ADD",
        useImmediate: true,
      };
    case "SW":
      return {
        regWrite: false,
        memRead: false,
        memWrite: true,
        memToReg: false,
        branch: false,
        aluOp: "ADD",
        useImmediate: true,
      };
    case "BEQ":
      return {
        regWrite: false,
        memRead: false,
        memWrite: false,
        memToReg: false,
        branch: true,
        aluOp: "SUB",
        useImmediate: false,
      };
    case "NOP":
    default:
      return createNopControl();
  }
}

function detectLoadUseHazard(
  current: DecodedInstruction,
  idEx: IDEXRegister
): boolean {
  if (!idEx.instruction || !idEx.control.memRead || idEx.destReg === undefined) {
    return false;
  }
  if (idEx.destReg === 0) {
    return false;
  }
  const sources = getSourceRegisters(current);
  return sources.includes(idEx.destReg);
}

function getSourceRegisters(instruction: DecodedInstruction): number[] {
  switch (instruction.opcode) {
    case "ADD":
    case "SUB":
    case "AND":
    case "OR":
      return [instruction.rs, instruction.rt].filter(isRegisterNumber);
    case "LW":
      return [instruction.rs].filter(isRegisterNumber);
    case "SW":
      return [instruction.rs, instruction.rt].filter(isRegisterNumber);
    case "BEQ":
      return [instruction.rs, instruction.rt].filter(isRegisterNumber);
    default:
      return [];
  }
}

function isRegisterNumber(value: number | undefined): value is number {
  return value !== undefined && value !== null;
}

interface ForwardingResult {
  rsValue: number;
  rtValue: number;
  forwardCount: number;
  sources: ForwardingInfo;
}


