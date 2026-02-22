# Core Pipeline Engine Overview

## Architecture
- **Pipeline stages** follow the classic five-stage MIPS flow: `IF → ID → EX → MEM → WB`. Each stage is represented in `PipelineStage.tsx` while the engine manages the actual state transitions.
- **Pipeline registers** (`IF/ID`, `ID/EX`, `EX/MEM`, `MEM/WB`) capture per-cycle snapshots of instructions, operands, control signals, and intermediate results. They live in `src/simulation/types.ts`.
- **CPU state** tracks the program counter, 32 integer registers, word-addressed memory (1 KB by default), and performance counters (cycles, completed instructions, stalls, forwards, branch stats).
- **Snapshot API** (`PipelineEngine.getSnapshot()` and `step()`) returns immutable data consumed by React. Each `PipelineStage` component receives the current instruction string plus hazard metadata for visualization.

## Step Algorithm
1. **Write Back** – commits register writes and increments `instructionsCompleted` once an instruction reaches WB.
2. **Memory** – reads/writes memory for LW/SW instructions and passes results to MEM/WB.
3. **Execute** – performs ALU ops, evaluates branches, and prepares values for MEM. Forwarding from `EX/MEM` and `MEM/WB` is applied here.
4. **Decode** – reads register operands, generates control signals, and performs load-use hazard detection. RAW hazards on a pending load trigger a one-cycle stall (bubble).
5. **Fetch** – fetches the next instruction unless stalled. Branches use predict-not-taken; once resolved, taken branches flush younger instructions and redirect the PC.
6. **Bookkeeping** – updates pipeline registers, recomputes metrics (CPI, branch accuracy), and halts once the program is exhausted and the pipeline drains.

## Hazard Handling
- **RAW hazards**: load-use conflicts insert a single bubble by stalling decode. General RAW hazards are mitigated by forwarding:
  - `EX/MEM → ID/EX` for ALU results (except pending memory reads).
  - `MEM/WB → ID/EX` for values that have reached WB.
- **Control hazards**: BEQ resolves in EX. A taken branch flushes `IF/ID` and `ID/EX`, increments `branchCount`, and records a misprediction because we optimistically fetched the fall-through.
- **Structural hazards** are out of scope; the engine assumes a single-issue pipeline with dedicated resources.

## Assumptions & Simplifications
- Register `R0` is hard-wired to zero—writes to it are ignored.
- Memory is byte-addressed but accessed as 32-bit words; out-of-range accesses are treated as zero/no-op writes.
- Instruction set supports a focused subset: `ADD`, `SUB`, `AND`, `OR`, `LW`, `SW`, `BEQ`, and implicit `NOP`.
- No caches, branch delay slots, or exception handling are modeled.

## React Integration
- `src/pages/Index.tsx` owns a single `PipelineEngine` instance. UI controls call `step()`, `reset()`, or `loadProgramFromSource()` and store the resulting `PipelineSnapshot`.
- `PipelineStage`, `RegisterMemoryView`, and `MetricsPanel` render directly from the snapshot, keeping components presentational.
- Play mode uses a timer (speed-controlled) to call `step()` repeatedly until the engine reports `halted`.

## Testing
- Vitest configuration (`vite.config.ts`) enables `npm run test`.
- `src/simulation/__tests__/pipelineEngine.test.ts` covers:
  - Straight-line execution reaching halt with the correct instruction count.
  - Load-use hazard detection incrementing stall metrics.
  - Taken branch flushing with a recorded misprediction.
- Install test tooling before running:
  ```bash
  npm install
  npm install --save-dev vitest
  npm run test
  ```


