import { useState } from "react";
import { Header } from "@/components/Header";
import { PipelineStage } from "@/components/PipelineStage";
import { PipelineFlow } from "@/components/PipelineFlow";
import { ControlPanel } from "@/components/ControlPanel";
import { InstructionEditor } from "@/components/InstructionEditor";
import { RegisterMemoryView } from "@/components/RegisterMemoryView";
import { MetricsPanel } from "@/components/MetricsPanel";
import { HelpDialog } from "@/components/HelpDialog";
import { AboutDialog } from "@/components/AboutDialog";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [clockCycles, setClockCycles] = useState(0);
  const [code, setCode] = useState("# Enter your instructions here\nADD R1, R2, R3\nSUB R4, R1, R2\nLW R5, 0(R1)\nSW R5, 4(R1)");
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Sample data for demonstration
  const pipelineStages = [
    { 
      name: "Instruction Fetch", 
      label: "IF", 
      color: "fetch",
      description: "Fetches the next instruction from memory using the program counter"
    },
    { 
      name: "Instruction Decode", 
      label: "ID", 
      color: "decode",
      description: "Decodes the instruction and reads register operands"
    },
    { 
      name: "Execute", 
      label: "EX", 
      color: "execute",
      description: "Performs arithmetic/logical operations or calculates memory addresses"
    },
    { 
      name: "Memory Access", 
      label: "MEM", 
      color: "memory",
      description: "Accesses data memory for load and store instructions"
    },
    { 
      name: "Write Back", 
      label: "WB", 
      color: "writeback",
      description: "Writes the result back to the register file"
    },
  ];

  const registers = [
    { name: "R0", value: "0x00000000" },
    { name: "R1", value: "0x00000001" },
    { name: "R2", value: "0x00000002" },
    { name: "R3", value: "0x00000003" },
    { name: "R4", value: "0x00000000" },
    { name: "R5", value: "0x00000000" },
    { name: "R6", value: "0x00000000" },
    { name: "R7", value: "0x00000000" },
  ];

  const memory = [
    { address: "0x1000", value: "0x00000000" },
    { address: "0x1004", value: "0x00000000" },
    { address: "0x1008", value: "0x00000000" },
    { address: "0x100C", value: "0x00000000" },
    { address: "0x1010", value: "0x00000000" },
  ];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    toast({
      title: isPlaying ? "Simulation Paused" : "Simulation Started",
      description: isPlaying ? "Execution has been paused" : "Executing instructions...",
    });
  };

  const handleStep = () => {
    setClockCycles(prev => prev + 1);
    toast({
      title: "Step Executed",
      description: `Advanced to cycle ${clockCycles + 1}`,
    });
  };

  const handleReset = () => {
    setIsPlaying(false);
    setClockCycles(0);
    toast({
      title: "Simulator Reset",
      description: "All state has been cleared",
    });
  };

  const handleLoadProgram = () => {
    toast({
      title: "Program Loaded",
      description: "Instructions are ready to execute",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        onHelp={() => setHelpOpen(true)}
        onReset={handleReset}
        onAbout={() => setAboutOpen(true)}
      />

      <main className="flex-1 container mx-auto p-4 space-y-6">
        {/* Pipeline Visualization */}
        <section className="bg-card rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-card-foreground">Pipeline Stages</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {pipelineStages.map((stage, idx) => (
              <div key={stage.label} className="flex items-center flex-shrink-0">
                <PipelineStage {...stage} />
                {idx < pipelineStages.length - 1 && <PipelineFlow />}
              </div>
            ))}
          </div>
        </section>

        {/* Control Panel */}
        <ControlPanel
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onStep={handleStep}
          speed={speed}
          onSpeedChange={(value) => setSpeed(value[0])}
          clockCycles={clockCycles}
          cpi={1.0}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instruction Editor */}
          <div className="lg:col-span-1">
            <InstructionEditor
              code={code}
              onCodeChange={setCode}
              onLoadProgram={handleLoadProgram}
            />
          </div>

          {/* Register/Memory View */}
          <div className="lg:col-span-1">
            <RegisterMemoryView registers={registers} memory={memory} />
          </div>

          {/* Metrics Panel */}
          <div className="lg:col-span-1">
            <MetricsPanel 
              stalls={0}
              forwardings={0}
              branchAccuracy={100}
            />
          </div>
        </div>
      </main>

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
};

export default Index;
