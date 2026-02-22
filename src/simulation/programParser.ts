import { DecodedInstruction, Opcode } from "./types";

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  instructions: DecodedInstruction[];
  errors: ParseError[];
}

interface ParsedLine {
  lineNumber: number;
  raw: string;
  label?: string;
  opcode?: string;
  operands: string[];
  instructionIndex: number;
}

const OPCODES: Record<string, Opcode> = {
  ADD: "ADD",
  SUB: "SUB",
  AND: "AND",
  OR: "OR",
  LW: "LW",
  SW: "SW",
  BEQ: "BEQ",
  NOP: "NOP",
};

const REGISTER_PATTERN = /^R(\d{1,2})$/i;
const OFFSET_PATTERN = /^(-?(?:0x)?[0-9a-f]+)\((R\d{1,2})\)$/i;

export function parseAssembly(source: string): ParseResult {
  const lines = source.split(/\r?\n/);
  const parsedLines: ParsedLine[] = [];
  const labelTable = new Map<string, number>();
  const errors: ParseError[] = [];

  let instructionIndex = 0;

  lines.forEach((line, idx) => {
    const lineNumber = idx + 1;
    const commentless = line.split("#")[0].trim();
    if (commentless.length === 0) {
      return;
    }

    let remainder = commentless;
    let label: string | undefined;

    // Handle label declaration
    const labelSeparatorIndex = remainder.indexOf(":");
    if (labelSeparatorIndex !== -1) {
      label = remainder.substring(0, labelSeparatorIndex).trim();
      if (!isValidLabel(label)) {
        errors.push({
          line: lineNumber,
          message: `Invalid label "${label}". Labels must start with a letter and contain only alphanumeric characters or underscores.`,
        });
      } else if (labelTable.has(label)) {
        errors.push({
          line: lineNumber,
          message: `Duplicate label "${label}".`,
        });
      } else {
        labelTable.set(label, instructionIndex * 4);
      }
      remainder = remainder.substring(labelSeparatorIndex + 1).trim();
      if (remainder.length === 0) {
        // Label-only line
        return;
      }
    }

    const [opcodeToken, ...restTokens] = remainder.split(/\s+/);
    const opcode = opcodeToken.toUpperCase();
    const operandsString = restTokens.join(" ");
    const operands =
      operandsString.length > 0
        ? operandsString.split(",").map((operand) => operand.trim()).filter(Boolean)
        : [];

    parsedLines.push({
      lineNumber,
      raw: commentless,
      label,
      opcode,
      operands,
      instructionIndex,
    });

    instructionIndex += 1;
  });

  const instructions: DecodedInstruction[] = [];

  parsedLines.forEach((lineInfo) => {
    const { opcode, operands, lineNumber, instructionIndex, raw } = lineInfo;
    if (!opcode) {
      return;
    }

    if (!(opcode in OPCODES)) {
      errors.push({
        line: lineNumber,
        message: `Unknown opcode "${opcode}".`,
      });
      return;
    }

    const parsed = parseOperands(
      OPCODES[opcode],
      operands,
      lineNumber,
      labelTable,
      instructionIndex
    );

    if ("error" in parsed) {
      errors.push(parsed.error);
      return;
    }

    const instruction: DecodedInstruction = {
      opcode: parsed.opcode,
      rd: parsed.rd,
      rs: parsed.rs,
      rt: parsed.rt,
      immediate: parsed.immediate,
      branchTarget: parsed.branchTarget,
      destReg: parsed.destReg,
      address: parsed.address,
      raw,
      pc: instructionIndex * 4,
    };

    instructions.push(instruction);
  });

  return { instructions, errors };
}

function parseOperands(
  opcode: Opcode,
  operands: string[],
  lineNumber: number,
  labelTable: Map<string, number>,
  instructionIndex: number
):
  | {
      opcode: Opcode;
      rd?: number;
      rs?: number;
      rt?: number;
      immediate?: number;
      branchTarget?: number;
      destReg?: number;
      address?: number;
    }
  | { error: ParseError } {
  const pc = instructionIndex * 4;
  const pcNext = pc + 4;

  const failure = (message: string): { error: ParseError } => ({
    error: { line: lineNumber, message },
  });

  const parseRegisterOrFail = (token: string, position: number) => {
    const reg = parseRegister(token);
    if (reg === undefined) {
      throw failure(
        `Operand ${position} "${token}" is not a valid register. Expected format R0-R31.`
      );
    }
    return reg;
  };

  try {
    switch (opcode) {
      case "ADD":
      case "SUB":
      case "AND":
      case "OR": {
        if (operands.length !== 3) {
          return failure(`${opcode} expects 3 operands (rd, rs, rt).`);
        }
        const rd = parseRegisterOrFail(operands[0], 1);
        const rs = parseRegisterOrFail(operands[1], 2);
        const rt = parseRegisterOrFail(operands[2], 3);
        return {
          opcode,
          rd,
          rs,
          rt,
          destReg: rd,
        };
      }
      case "LW": {
        if (operands.length !== 2) {
          return failure("LW expects 2 operands (rt, offset(base)).");
        }
        const rt = parseRegisterOrFail(operands[0], 1);
        const offsetInfo = parseOffsetAddress(operands[1]);
        if (!offsetInfo) {
          return failure(
            `Invalid address operand "${operands[1]}". Expected format offset(Rx).`
          );
        }
        const { offset, baseRegister } = offsetInfo;
        return {
          opcode,
          rt,
          rs: baseRegister,
          immediate: offset,
          destReg: rt,
          address: offset,
        };
      }
      case "SW": {
        if (operands.length !== 2) {
          return failure("SW expects 2 operands (rt, offset(base)).");
        }
        const rt = parseRegisterOrFail(operands[0], 1);
        const offsetInfo = parseOffsetAddress(operands[1]);
        if (!offsetInfo) {
          return failure(
            `Invalid address operand "${operands[1]}". Expected format offset(Rx).`
          );
        }
        const { offset, baseRegister } = offsetInfo;
        return {
          opcode,
          rt,
          rs: baseRegister,
          immediate: offset,
          address: offset,
        };
      }
      case "BEQ": {
        if (operands.length !== 3) {
          return failure("BEQ expects 3 operands (rs, rt, label|offset).");
        }
        const rs = parseRegisterOrFail(operands[0], 1);
        const rt = parseRegisterOrFail(operands[1], 2);
        const targetOperand = operands[2];
        let branchTarget: number | undefined;
        let immediate: number | undefined;
        if (isLabel(targetOperand)) {
          const resolved = labelTable.get(targetOperand.toUpperCase());
          const resolvedPc = resolved ?? labelTable.get(targetOperand);
          if (resolvedPc === undefined) {
            return failure(`Unknown branch target label "${targetOperand}".`);
          }
          branchTarget = resolvedPc;
          immediate = (branchTarget - pcNext) / 4;
        } else {
          const parsedImmediate = parseNumber(targetOperand);
          if (parsedImmediate === undefined) {
            return failure(
              `Invalid branch target "${targetOperand}". Expected label or immediate offset.`
            );
          }
          immediate = parsedImmediate;
          branchTarget = pcNext + immediate * 4;
        }
        return {
          opcode,
          rs,
          rt,
          immediate,
          branchTarget,
        };
      }
      case "NOP": {
        if (operands.length !== 0) {
          return failure("NOP does not accept operands.");
        }
        return {
          opcode,
        };
      }
      default:
        return failure(`Opcode ${opcode} not supported.`);
    }
  } catch (result) {
    return result as { error: ParseError };
  }
}

function parseRegister(token: string): number | undefined {
  const match = token.trim().match(REGISTER_PATTERN);
  if (!match) {
    return undefined;
  }
  const value = Number.parseInt(match[1], 10);
  if (Number.isNaN(value) || value < 0 || value >= 32) {
    return undefined;
  }
  return value;
}

function parseOffsetAddress(token: string):
  | { offset: number; baseRegister: number }
  | undefined {
  const match = token.trim().match(OFFSET_PATTERN);
  if (!match) {
    return undefined;
  }
  const offset = parseNumber(match[1]);
  if (offset === undefined) {
    return undefined;
  }
  const baseRegister = parseRegister(match[2]);
  if (baseRegister === undefined) {
    return undefined;
  }
  return { offset, baseRegister };
}

function parseNumber(token: string): number | undefined {
  const cleaned = token.trim();
  if (/^0x[0-9a-f]+$/i.test(cleaned)) {
    return Number.parseInt(cleaned, 16);
  }
  if (/^-?\d+$/.test(cleaned)) {
    return Number.parseInt(cleaned, 10);
  }
  return undefined;
}

function isLabel(token: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(token);
}

function isValidLabel(label: string): boolean {
  return isLabel(label);
}

