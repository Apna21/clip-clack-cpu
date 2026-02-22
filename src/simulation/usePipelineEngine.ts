import { useCallback, useMemo, useRef, useState } from "react";
import { PipelineEngine } from "./pipelineEngine";
import { PipelineSnapshot, SimulationOptions } from "./types";
import { ParseResult } from "./programParser";

interface UsePipelineEngineOptions extends SimulationOptions {}

interface UsePipelineEngineResult {
  snapshot: PipelineSnapshot;
  loadProgram: (source: string) => ParseResult;
  step: () => PipelineSnapshot;
  reset: (clearProgram?: boolean) => PipelineSnapshot;
  engine: PipelineEngine;
}

export function usePipelineEngine(
  options: UsePipelineEngineOptions = {}
): UsePipelineEngineResult {
  const engineRef = useRef<PipelineEngine>();

  if (!engineRef.current) {
    engineRef.current = new PipelineEngine(options);
  }

  const engine = engineRef.current;

  const [snapshot, setSnapshot] = useState<PipelineSnapshot>(() =>
    engine.getSnapshot()
  );

  const loadProgram = useCallback(
    (source: string): ParseResult => {
      const result = engine.loadProgramFromSource(source);
      if (result.errors.length === 0) {
        setSnapshot(engine.getSnapshot());
      }
      return result;
    },
    [engine]
  );

  const step = useCallback((): PipelineSnapshot => {
    const nextSnapshot = engine.step();
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }, [engine]);

  const reset = useCallback(
    (clearProgram = false): PipelineSnapshot => {
      engine.reset(clearProgram);
      const nextSnapshot = engine.getSnapshot();
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    },
    [engine]
  );

  return useMemo(
    () => ({
      snapshot,
      loadProgram,
      step,
      reset,
      engine,
    }),
    [snapshot, loadProgram, step, reset, engine]
  );
}


