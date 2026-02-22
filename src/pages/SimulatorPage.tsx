import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PipelineStage } from "@/components/PipelineStage";
import { PipelineFlow } from "@/components/PipelineFlow";
import { ControlPanel } from "@/components/ControlPanel";
import { InstructionEditor } from "@/components/InstructionEditor";
import { RegisterMemoryView } from "@/components/RegisterMemoryView";
import { MetricsPanel } from "@/components/MetricsPanel";
import { HelpDialog } from "@/components/HelpDialog";
import { AboutDialog } from "@/components/AboutDialog";
import { useToast } from "@/hooks/use-toast";
import { useSimulationController } from "@/hooks/useSimulationController";
import { speedLabel } from "@/utils/simulation";
import { DEFAULT_PROGRAM_SOURCE } from "@/simulation/sampleProgram";
import { PipelineSnapshot, PipelineStageName } from "@/simulation/types";

type StageBadge = {
  label: string;
  variant?: "neutral" | "hazard" | "info" | "success";
};

const STAGE_METADATA: Array<{
  key: PipelineStageName;
  name: string;
  label: string;
  color: string;
  description: string;
}> = [
  {
    key: "IF",
    name: "Instruction Fetch",
    label: "IF",
    color: "fetch",
    description: "Fetches the next instruction from memory using the program counter",
  },
  {
    key: "ID",
    name: "Instruction Decode",
    label: "ID",
    color: "decode",
    description: "Decodes the instruction and reads register operands",
  },
  {
    key: "EX",
    name: "Execute",
    label: "EX",
    color: "execute",
    description: "Performs arithmetic/logical operations or calculates memory addresses",
  },
  {
    key: "MEM",
    name: "Memory Access",
    label: "MEM",
    color: "memory",
    description: "Accesses data memory for load and store instructions",
  },
  {
    key: "WB",
    name: "Write Back",
    label: "WB",
    color: "writeback",
    description: "Writes the result back to the register file",
  },
];

function formatWord(value: number) {
  return `0x${(value >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
}

function formatAddress(index: number) {
  return `0x${(index * 4).toString(16).padStart(4, "0").toUpperCase()}`;
}

const DEFAULT_REGISTERS = Array.from({ length: 32 }, (_, index) => ({
  name: `R${index}`,
  value: "0x00000000",
  decimal: 0,
  isHighlighted: false,
}));

const DEFAULT_MEMORY = Array.from({ length: 32 }, (_, index) => ({
  address: formatAddress(index),
  value: "0x00000000",
  decimal: 0,
  isHighlighted: false,
}));

const getInstructionBadge = (instruction?: string | null): StageBadge | null => {
  if (!instruction) return null;
  const opcode = instruction.split(/\s+/)[0]?.toUpperCase();
  if (!opcode) return null;
  if (["ADD", "SUB", "AND", "OR"].includes(opcode)) {
    return { label: "ALU", variant: "info" };
  }
  if (["LW", "SW"].includes(opcode)) {
    return { label: "MEM", variant: "info" };
  }
  if (opcode === "BEQ") {
    return { label: "BRANCH", variant: "info" };
  }
  return null;
};

const SimulatorPage = () => {
  const { toast } = useToast();
  const {
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
  } = useSimulationController();

  const [code, setCode] = useState(DEFAULT_PROGRAM_SOURCE.trim());
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const latestSnapshotRef = useRef<PipelineSnapshot | null>(snapshot ?? null);

  useEffect(() => {
    latestSnapshotRef.current = snapshot ?? null;
  }, [snapshot]);

  const handlePlayPause = useCallback(() => {
    if (!snapshot) {
      return;
    }

    if (isPlaying) {
      togglePlay();
      toast({
        title: "Simulation Paused",
        description: `Paused at cycle ${snapshot.stats.cycleCount}.`,
      });
      return;
    }

    if (snapshot.halted) {
      toast({
        title: "Program already halted",
        description: "Reset or load a new program to run the simulation again.",
      });
      return;
    }

    togglePlay();
    toast({
      title: "Simulation Started",
      description: `Running at ${speedLabel(speed)} speed.`,
    });
  }, [isPlaying, snapshot, speed, togglePlay, toast]);

  const handleStep = useCallback(() => {
    const currentSnapshot = latestSnapshotRef.current;
    if (!currentSnapshot || currentSnapshot.halted) {
      toast({
        title: "No more instructions",
        description: "Reset or load a new program to continue.",
      });
      return;
    }

    pause();
    const previousCycle = currentSnapshot.stats.cycleCount;
    step();

    setTimeout(() => {
      const updated = latestSnapshotRef.current;
      if (!updated) return;
      if (updated.halted) {
        toast({
          title: "Program completed",
          description: `Pipeline drained after ${updated.stats.cycleCount} cycles.`,
        });
      } else if (updated.stats.cycleCount !== previousCycle) {
        toast({
          title: "Step Executed",
          description: `Advanced to cycle ${updated.stats.cycleCount}.`,
        });
      }
    }, 0);
  }, [pause, step, toast]);

  const handleBack = useCallback(() => {
    if (!canStepBack) {
      toast({
        title: "Nothing to rewind",
        description: "Execute at least one step before going back.",
      });
      return;
    }
    pause();
    stepBack();
    setTimeout(() => {
      const updated = latestSnapshotRef.current;
      if (!updated) return;
      toast({
        title: "Rewound",
        description: `Returned to cycle ${updated.stats.cycleCount}.`,
      });
    }, 0);
  }, [canStepBack, pause, stepBack, toast]);

  const handleReset = useCallback(() => {
    pause();
    reset();
    setTimeout(() => {
      const updated = latestSnapshotRef.current;
      toast({
        title: "Simulator Reset",
        description: updated
          ? `Back to cycle ${updated.stats.cycleCount}.`
          : "Pipeline and CPU state cleared.",
      });
    }, 0);
  }, [pause, reset, toast]);

  const handleLoadProgram = useCallback(() => {
    pause();
    const result = loadProgramFromSource(code);
    if (result.errors.length > 0) {
      const errorMessages = result.errors
        .slice(0, 3)
        .map((err) => `Line ${err.line}: ${err.message}`)
        .join("\n");
      toast({
        title: "Program Load Failed",
        description: errorMessages,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Program Loaded",
      description: `Loaded ${result.instructions.length} instructions.`,
    });
  }, [code, loadProgramFromSource, pause, toast]);

  const handleSpeedChange = useCallback(
    (value: number[]) => {
      const nextSpeed = value[0] ?? 0;
      setSpeed(nextSpeed);
    },
    [setSpeed]
  );

  const stageViews = snapshot?.stages ?? null;
  const stats = snapshot?.stats;
  const cycleCount = stats?.cycleCount ?? 0;
  const cpi = stats?.cpi ?? 0;

  const prevRegistersRef = useRef<number[] | null>(null);
  const prevMemoryRef = useRef<number[] | null>(null);

  const registers = useMemo(() => {
    if (!snapshot) {
      return DEFAULT_REGISTERS;
    }
    const prev = prevRegistersRef.current;
    return snapshot.registers.map((value, index) => ({
      name: `R${index}`,
      value: formatWord(value),
      decimal: value,
      isHighlighted: prev ? prev[index] !== value : false,
    }));
  }, [snapshot]);

  const memory = useMemo(() => {
    if (!snapshot) {
      return DEFAULT_MEMORY;
    }
    const prev = prevMemoryRef.current;
    return snapshot.memory.slice(0, 32).map((value, index) => ({
      address: formatAddress(index),
      value: formatWord(value),
      decimal: value,
      isHighlighted: prev ? prev[index] !== value : false,
    }));
  }, [snapshot]);

  useEffect(() => {
    if (snapshot) {
      prevRegistersRef.current = snapshot.registers.slice();
      prevMemoryRef.current = snapshot.memory.slice();
    }
  }, [snapshot]);

  const stageBadges = useMemo(() => {
    const badges: Record<PipelineStageName, StageBadge[]> = {
      IF: [],
      ID: [],
      EX: [],
      MEM: [],
      WB: [],
    };

    STAGE_METADATA.forEach(({ key }) => {
      const stageView = stageViews?.[key];
      const instructionBadge = getInstructionBadge(stageView?.instruction);
      if (instructionBadge) {
        badges[key].push(instructionBadge);
      }
    });

    if (snapshot?.stalledThisCycle) {
      badges.ID.push({ label: "STALL", variant: "hazard" });
    }
    if (snapshot?.flushedThisCycle) {
      badges.IF.push({ label: "FLUSH", variant: "hazard" });
    }
    if (snapshot?.forwarding?.aFrom) {
      badges.EX.push({ label: `A←${snapshot.forwarding.aFrom}`, variant: "success" });
    }
    if (snapshot?.forwarding?.bFrom) {
      badges.EX.push({ label: `B←${snapshot.forwarding.bFrom}`, variant: "success" });
    }

    STAGE_METADATA.forEach(({ key }) => {
      const hazardType = stageViews?.[key]?.hazard?.type;
      if (hazardType === "stall") {
        badges[key].push({ label: "STALL", variant: "hazard" });
      }
      if (hazardType === "forward") {
        badges[key].push({ label: "FWD", variant: "success" });
      }
    });

    return badges;
  }, [snapshot, stageViews]);

  const debugInfo = snapshot?.debug;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-6 md:py-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Interactive Pipeline Simulator
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Step through instructions, analyse hazards, and inspect performance metrics cycle by cycle.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setHelpOpen(true)}>
              View Help
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAboutOpen(true)}>
              About
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>

        <section className="bg-card rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-card-foreground">
            Pipeline Stages
          </h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {STAGE_METADATA.map((stage, idx) => {
              const stageView = stageViews ? stageViews[stage.key] : undefined;
              return (
                <div key={stage.label} className="flex items-center flex-shrink-0">
                  <PipelineStage
                    name={stage.name}
                    label={stage.label}
                    color={stage.color}
                    description={stage.description}
                    instruction={stageView?.instruction ?? null}
                    hasHazard={Boolean(stageView?.hazard)}
                    hazardType={stageView?.hazard?.type}
                    badges={stageBadges[stage.key]}
                  />
                  {idx < STAGE_METADATA.length - 1 && <PipelineFlow />}
                </div>
              );
            })}
          </div>
        </section>

        <ControlPanel
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onStep={handleStep}
          onBack={handleBack}
          onReset={handleReset}
          speed={speed}
          onSpeedChange={handleSpeedChange}
          clockCycles={cycleCount}
          cpi={cpi}
          isHalted={isHalted}
          canStepBack={canStepBack}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <InstructionEditor
              code={code}
              onCodeChange={setCode}
              onLoadProgram={handleLoadProgram}
            />
          </div>
          <div className="xl:col-span-1">
            <RegisterMemoryView registers={registers} memory={memory} />
          </div>
          <div className="xl:col-span-1">
            <MetricsPanel
              cycleCount={cycleCount}
              instructionsCompleted={stats?.instructionsCompleted ?? 0}
              cpi={cpi}
              stallCount={stats?.stallCount ?? 0}
              forwardCount={stats?.forwardCount ?? 0}
              branchCount={stats?.branchCount ?? 0}
              branchMispredictions={stats?.branchMispredictions ?? 0}
              branchAccuracy={stats?.branchAccuracy ?? 100}
            />
          </div>
        </div>

      </main>

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
};

export default SimulatorPage;


