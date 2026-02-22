# Section 3.2 — Hazard Detection Unit (HDU)

## Supported Hazards
- **RAW (Read After Write)**  
  - Forwarding paths: `EX/MEM → EX` and `MEM/WB → EX` for both operands.  
  - Load-use hazards fall back to stalling because data is unavailable until MEM stage.
- **Load-Use Stall**  
  - Inserts a bubble into `ID/EX`, freezes `PC` and `IF/ID` for one cycle, and increments `stallCount`.
- **Control Hazards (BEQ)**  
  - Predict-not-taken policy with EX-stage resolution.  
  - Taken branches flush `IF/ID` and `ID/EX`, redirect the PC, and count a misprediction.

## Assumptions & Simplifications
- Instruction subset: `ADD`, `SUB`, `AND`, `OR`, `LW`, `SW`, `BEQ` plus injected `NOP`.
- No structural hazards, WAR, or WAW hazards are modelled; the pipeline is single-issue with dedicated resources.
- Register `R0` remains zero—writes to it are ignored.
- Memory is word-addressed (1 KB default) without cache effects.

## Snapshot Telemetry
Each `PipelineSnapshot` now includes:
- `stalledThisCycle` / `flushedThisCycle`
- `forwarding` sources for operands A/B
- Per-cycle `hazardEvents` (STALL, FORWARD, FLUSH) for debugging/visualisation
- Updated metrics (`stallCount`, `forwardCount`, `branchCount`, `branchMispredictions`)

## Validation Programs
Use these snippets to verify HDU behaviour (`npm run test` covers the same cases):

```asm
# A) RAW hazard resolved via forwarding
ADD R1, R2, R3
SUB R4, R1, R5

# B) Load-use hazard requiring a stall
LW  R1, 0(R2)
ADD R3, R1, R4

# C) Branch taken, flushing wrong-path instruction
BEQ R1, R2, +2
ADD R3, R3, R3   # flushed when branch is taken
ADD R4, R4, R4
```

Expected metrics:
- (A) `stallCount = 0`, `forwardCount > 0`
- (B) `stallCount ≥ 1`, stall event logged (`reason = "load-use"`)
- (C) `branchCount = 1`, `branchMispredictions = 1`, flush event logged



