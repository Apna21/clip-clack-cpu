export const NUM_REGISTERS = 32;
export const MEMORY_SIZE = 1024;

export type Opcode = "ADD" | "SUB" | "AND" | "OR" | "LW" | "SW" | "BEQ" | "NOP";

export type PipelineStageName = "IF" | "ID" | "EX" | "MEM" | "WB";

export interface Instruction {
  opcode: Opcode;
  rd?: number;
  rs?: number;
  rt?: number;
  immediate?: number;
  address?: number;
  label?: string;
  raw: string;
}

export interface DecodedInstruction extends Instruction {
  pc: number;
  destReg?: number;
  branchTarget?: number;
  isBubble?: boolean;
}

export interface Program {
  instructions: DecodedInstruction[];
}

export interface IFIDRegister {
  instruction: DecodedInstruction | null;
  pc: number;
}

export interface IDEXRegister {
  instruction: DecodedInstruction | null;
  pc: number;
  rsValue: number;
  rtValue: number;
  destReg?: number;
  immediate?: number;
  branchTarget?: number;
  control: ControlSignals;
}

export interface EXMEMRegister {
  instruction: DecodedInstruction | null;
  pc: number;
  aluResult: number;
  writeData: number;
  destReg?: number;
  control: ControlSignals;
  branchTaken: boolean;
  branchTarget?: number;
}

export interface MEMWBRegister {
  instruction: DecodedInstruction | null;
  pc: number;
  writeData: number;
  destReg?: number;
  control: ControlSignals;
}

export interface ControlSignals {
  regWrite: boolean;
  memRead: boolean;
  memWrite: boolean;
  memToReg: boolean;
  branch: boolean;
  aluOp: "ADD" | "SUB" | "AND" | "OR" | "PASS_RT";
  useImmediate?: boolean;
  isNop?: boolean;
}

export interface PipelineRegisters {
  ifId: IFIDRegister;
  idEx: IDEXRegister;
  exMem: EXMEMRegister;
  memWb: MEMWBRegister;
}

export interface PipelineStats {
  cycleCount: number;
  instructionsCompleted: number;
  stallCount: number;
  forwardCount: number;
  branchCount: number;
  branchMispredictions: number;
}

export interface CPUState {
  pc: number;
  registers: Int32Array;
  memory: Int32Array;
  halted: boolean;
  stats: PipelineStats;
}

export type HazardType = "stall" | "forward";

export interface HazardInfo {
  type: HazardType;
  description?: string;
}

export type ForwardSource = "EX/MEM" | "MEM/WB";

export interface ForwardingInfo {
  aFrom?: ForwardSource;
  bFrom?: ForwardSource;
}

export type HazardEventType = "STALL" | "FORWARD" | "FLUSH";

export interface HazardEvent {
  type: HazardEventType;
  reason?: string;
  reg?: string;
  from?: ForwardSource;
  to?: PipelineStageName;
  cycle: number;
}

export interface StageView {
  stage: PipelineStageName;
  instruction: string | null;
  hazard?: HazardInfo;
}

export interface PipelineSnapshot {
  cycle: number;
  halted: boolean;
  stages: Record<PipelineStageName, StageView>;
  registers: number[];
  memory: number[];
  stats: PipelineStats & { cpi: number; branchAccuracy: number };
  stalledThisCycle: boolean;
  flushedThisCycle: boolean;
  forwarding: ForwardingInfo;
  hazardEvents: HazardEvent[];
}

export interface SimulationOptions {
  memorySize?: number;
  registerCount?: number;
}

export interface EngineState {
  cpu: CPUState;
  pipeline: PipelineRegisters;
  currentFetchInstruction: DecodedInstruction | null;
}


