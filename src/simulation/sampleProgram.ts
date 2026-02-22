import { DecodedInstruction } from "./types";
import { parseAssembly } from "./programParser";

export const DEFAULT_PROGRAM_SOURCE = `# Sample pipeline program
ADD R1, R0, R0
ADD R2, R1, R1
LW R3, 0(R2)
ADD R4, R1, R3
SW R4, 4(R2)
BEQ R1, R4, END
ADD R5, R5, R5
END: SUB R6, R4, R1
`;

export function createDefaultProgram(): DecodedInstruction[] {
  const { instructions, errors } = parseAssembly(DEFAULT_PROGRAM_SOURCE);
  if (errors.length > 0) {
    const message = errors
      .map((error) => `Line ${error.line}: ${error.message}`)
      .join("\n");
    throw new Error(`Failed to parse default program:\n${message}`);
  }
  return instructions;
}


