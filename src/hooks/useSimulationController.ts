import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PipelineEngine } from "@/simulation/pipelineEngine";
import {
  EngineState,
  PipelineSnapshot,
} from "@/simulation/types";
import { DEFAULT_PROGRAM_SOURCE } from "@/simulation/sampleProgram";
import { ParseResult } from "@/simulation/programParser";
import { speedToDelay } from "@/utils/simulation";

type HistoryEntry = {
  snapshot: PipelineSnapshot;
  state: EngineState;
};

const DEFAULT_SPEED = 50;

export const useSimulationController = () => {
  const engineRef = useRef<PipelineEngine | null>(null);
  const snapshotRef = useRef<PipelineSnapshot | null>(null);
  const historyRef = useRef<HistoryEntry[]>([]);
  const playTimerRef = useRef<number | null>(null);
  const demoSeededRef = useRef(false);

  if (engineRef.current === null) {
    engineRef.current = new PipelineEngine();
  }

  const [snapshot, setSnapshot] = useState<PipelineSnapshot | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [historyDepth, setHistoryDepth] = useState(0);

  const clearTimer = useCallback(() => {
    if (playTimerRef.current !== null) {
      window.clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
  }, []);

  const updateSnapshot = useCallback((next: PipelineSnapshot) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const pushHistory = useCallback(() => {
    const engine = engineRef.current;
    const currentSnapshot = snapshotRef.current;
    if (!engine || !currentSnapshot) return;
    const entry: HistoryEntry = {
      snapshot: currentSnapshot,
      state: engine.exportState(),
    };
    historyRef.current.push(entry);
    setHistoryDepth(historyRef.current.length);
  }, []);

  const popHistory = useCallback((): HistoryEntry | undefined => {
    const entry = historyRef.current.pop();
    if (entry) {
      setHistoryDepth(historyRef.current.length);
    }
    return entry;
  }, []);

  const step = useCallback(() => {
    const engine = engineRef.current;
    const currentSnapshot = snapshotRef.current;
    if (!engine || !currentSnapshot || currentSnapshot.halted) {
      return;
    }

    pushHistory();

    const nextSnapshot = engine.step();
    updateSnapshot(nextSnapshot);

    if (nextSnapshot.halted) {
      setIsPlaying(false);
      clearTimer();
    }
  }, [clearTimer, pushHistory, updateSnapshot]);

  const stepBack = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const entry = popHistory();
    if (!entry) return;

    clearTimer();
    setIsPlaying(false);

    engine.restoreState(entry.state);
    updateSnapshot(entry.snapshot);
  }, [clearTimer, popHistory, updateSnapshot]);

  const reset = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    clearTimer();
    setIsPlaying(false);
    historyRef.current = [];
    setHistoryDepth(0);

    engine.reset();
    const freshSnapshot = engine.getSnapshot();
    updateSnapshot(freshSnapshot);
  }, [clearTimer, updateSnapshot]);

  const loadProgramFromSource = useCallback(
    (source: string): ParseResult => {
      const engine = engineRef.current;
      if (!engine) {
        return { instructions: [], errors: [{ line: 0, message: "Engine unavailable" }] };
      }

      clearTimer();
      setIsPlaying(false);
      historyRef.current = [];
      setHistoryDepth(0);

      const result = engine.loadProgramFromSource(source);
      if (result.errors.length === 0) {
        const freshSnapshot = engine.getSnapshot();
        updateSnapshot(freshSnapshot);
      }
      return result;
    },
    [clearTimer, updateSnapshot]
  );

  const togglePlay = useCallback(() => {
    const currentSnapshot = snapshotRef.current;
    if (currentSnapshot?.halted) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying((prev) => {
      if (prev) {
        clearTimer();
        return false;
      }
      return true;
    });
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
  }, [clearTimer]);

  // Initial load
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      const { instructions, errors } = engine.loadProgramFromSource(DEFAULT_PROGRAM_SOURCE);
      if (errors.length > 0 || instructions.length === 0) {
        const emptySnapshot = engine.getSnapshot();
        updateSnapshot(emptySnapshot);
        return;
      }
      if (!demoSeededRef.current) {
        const state = engine.exportState();
        const registers = new Int32Array(state.cpu.registers);
        if (registers.length >= 6) {
          registers[1] = 5;
          registers[2] = 100;
          registers[3] = 8;
          registers[4] = 0;
          registers[5] = 2;
        }
        state.cpu.registers = registers;
        const memory = new Int32Array(state.cpu.memory);
        if (memory.length > (100 >>> 2)) {
          memory[100 >>> 2] = 0;
        }
        state.cpu.memory = memory;
        engine.restoreState(state);
        demoSeededRef.current = true;
      }
      const seededSnapshot = engine.getSnapshot();
      updateSnapshot(seededSnapshot);
    } catch (error) {
      const emptySnapshot = engine.getSnapshot();
      updateSnapshot(emptySnapshot);
      console.error("Failed to load default program:", error);
    }
    // Cleanup on unmount
    return () => {
      clearTimer();
    };
  }, [clearTimer, updateSnapshot]);

  // Sync snapshot ref whenever snapshot state changes
  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  // Manage autoplay interval
  useEffect(() => {
    if (!isPlaying) {
      clearTimer();
      return;
    }
    const delay = speedToDelay(speed);
    clearTimer();
    playTimerRef.current = window.setInterval(() => {
      step();
    }, delay);
    return () => {
      clearTimer();
    };
  }, [clearTimer, isPlaying, speed, step]);

  const isHalted = snapshot?.halted ?? false;
  const canStepBack = historyDepth > 0;

  return {
    snapshot,
    isPlaying,
    isHalted,
    speed,
    setSpeed,
    togglePlay,
    pause,
    step,
    stepBack,
    canStepBack,
    reset,
    loadProgramFromSource,
    historyDepth,
  };
};
