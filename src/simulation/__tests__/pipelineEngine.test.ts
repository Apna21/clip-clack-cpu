/// <reference types="vitest" />

import { describe, it, expect, beforeEach } from "vitest";
import { PipelineEngine } from "../pipelineEngine";
import { HazardEvent, PipelineSnapshot } from "../types";

function loadProgramOrThrow(engine: PipelineEngine, source: string): number {
  const result = engine.loadProgramFromSource(source);
  if (result.errors.length > 0) {
    const messages = result.errors.map((err) => `Line ${err.line}: ${err.message}`).join("\n");
    throw new Error(messages);
  }
  return result.instructions.length;
}

function executeProgram(
  engine: PipelineEngine,
  source: string,
  maxCycles = 200
): { snapshots: PipelineSnapshot[]; events: HazardEvent[] } {
  loadProgramOrThrow(engine, source);
  const snapshots: PipelineSnapshot[] = [];
  const events: HazardEvent[] = [];

  let snapshot = engine.getSnapshot();
  let cycles = 0;

  while (!snapshot.halted && cycles < maxCycles) {
    snapshot = engine.step();
    snapshots.push(snapshot);
    events.push(...snapshot.hazardEvents);
    cycles += 1;
  }

  return { snapshots, events };
}

describe("Hazard Detection Unit", () => {
  let engine: PipelineEngine;

  beforeEach(() => {
    engine = new PipelineEngine();
  });

  it("forwards values to resolve RAW hazards without stalling", () => {
    const source = `
      ADD R1, R2, R3
      SUB R4, R1, R5
    `;

    const { snapshots, events } = executeProgram(engine, source);
    const finalSnapshot = snapshots.at(-1);
    expect(finalSnapshot?.halted).toBe(true);
    expect(finalSnapshot?.stats.stallCount).toBe(0);
    expect(finalSnapshot?.stats.forwardCount).toBeGreaterThan(0);
    expect(events.some((event) => event.type === "FORWARD")).toBe(true);
  });

  it("stalls on load-use hazards", () => {
    const source = `
      LW R1, 0(R2)
      ADD R3, R1, R4
    `;

    const { snapshots, events } = executeProgram(engine, source);
    const finalSnapshot = snapshots.at(-1);
    expect(finalSnapshot?.halted).toBe(true);
    expect(finalSnapshot?.stats.stallCount).toBeGreaterThan(0);
    expect(events.some((event) => event.type === "STALL" && event.reason === "load-use")).toBe(true);
  });

  it("flushes wrong-path instructions on taken branches", () => {
    const source = `
      BEQ R1, R2, +2
      ADD R3, R3, R3
      ADD R4, R4, R4
    `;

    const { snapshots, events } = executeProgram(engine, source);
    const finalSnapshot = snapshots.at(-1);
    expect(finalSnapshot?.halted).toBe(true);
    expect(finalSnapshot?.stats.branchCount).toBe(1);
    expect(finalSnapshot?.stats.branchMispredictions).toBe(1);
    expect(events.some((event) => event.type === "FLUSH")).toBe(true);
  });
});



