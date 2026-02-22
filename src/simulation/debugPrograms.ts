export interface DebugProgram {
  name: string;
  description: string;
  source: string;
  registers?: Array<{ register: number; value: number }>;
  memory?: Array<{ address: number; value: number }>;
}

export const DEBUG_PROGRAMS: DebugProgram[] = [
  {
    name: "Program A – Register Write Demo",
    description: "Demonstrates forwarding and register write-back with two ADD instructions.",
    source: `# Program A – Register Write Demo
ADD R1, R2, R3
ADD R4, R1, R5
NOP
`,
    registers: [
      { register: 1, value: 0 },
      { register: 2, value: 5 },
      { register: 3, value: 8 },
      { register: 4, value: 0 },
      { register: 5, value: 2 },
    ],
    memory: [],
  },
  {
    name: "Program B – Memory Write & Read",
    description: "Stores R1 to memory and immediately loads it back into R3.",
    source: `# Program B – Memory Write & Read
SW R1, 0(R2)
LW R3, 0(R2)
NOP
`,
    registers: [
      { register: 1, value: 11 },
      { register: 2, value: 100 },
      { register: 3, value: 0 },
      { register: 4, value: 0 },
      { register: 5, value: 1 },
    ],
    memory: [
      { address: 100, value: 0 },
    ],
  },
];

