import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import stageIFVideo from "../../CPU VIDS/1.mp4";
import stageIDVideo from "../../CPU VIDS/2.mp4";
import stageEXVideo from "../../CPU VIDS/3.mp4";
import stageMEMVideo from "../../CPU VIDS/4.mp4";
import stageWBVideo from "../../CPU VIDS/5.mp4";
import dataHazardVideo from "../../CPU VIDS/6.mp4";
import loadUseHazardVideo from "../../CPU VIDS/7.mp4";
import controlHazardVideo from "../../CPU VIDS/8.mp4";
import visualIndicatorsVideo from "../../CPU VIDS/9.mp4";
import exampleAVideo from "../../CPU VIDS/10.mp4";
import exampleBVideo from "../../CPU VIDS/11.mp4";
import exampleCVideo from "../../CPU VIDS/12.mp4";

const stageDetails = [
  {
    name: "Instruction Fetch (IF)",
    description:
      "Reads the next instruction from memory using the Program Counter (PC). In the simulator, watch the IF stage fetch your instruction stream one cycle at a time.",
    tip: "Tip: Notice how the IF stage is flushed when a branch is taken with predict-not-taken.",
    videoTitle: "Stage Spotlight: Instruction Fetch",
    videoSrc: stageIFVideo,
  },
  {
    name: "Instruction Decode (ID)",
    description:
      "Decodes the fetched instruction and reads register operands from the register file. This stage is responsible for detecting load-use data hazards before execution.",
    tip: "Tip: When a load-use hazard is detected, the ID stage will stall and the snapshot highlights a STALL badge.",
    videoTitle: "Stage Spotlight: Instruction Decode",
    videoSrc: stageIDVideo,
  },
  {
    name: "Execute (EX)",
    description:
      "Performs arithmetic/logic operations, calculates branch targets, and computes addresses for memory instructions.",
    tip: "Tip: Forwarding badges (A←EX/MEM, B←MEM/WB) appear here when results are forwarded to avoid stalls.",
    videoTitle: "Stage Spotlight: Execute",
    videoSrc: stageEXVideo,
  },
  {
    name: "Memory (MEM)",
    description:
      "Accesses data memory for load/store instructions. ALU results simply flow through if no memory access is needed.",
    tip: "Tip: The MEM stage shows hazards related to memory dependencies and branch resolution effects.",
    videoTitle: "Stage Spotlight: Memory Access",
    videoSrc: stageMEMVideo,
  },
  {
    name: "Write Back (WB)",
    description:
      "Writes results back to the register file for instructions that produce a destination register value.",
    tip: "Tip: Observe the register panel update as instructions complete the WB stage.",
    videoTitle: "Stage Spotlight: Write Back",
    videoSrc: stageWBVideo,
  },
];

const guidedExamples = [
  {
    title: "Example A — Simple ALU Sequence",
    instructions: ["ADD R1, R2, R3", "SUB R4, R1, R5", "AND R6, R1, R7"],
    focus:
      "Follow how the ALU results are forwarded from EX/MEM and MEM/WB to avoid unnecessary stalls. Watch the Forward Count metric update.",
    question: "In which cycle do you first see forwarding badges appear in the EX stage?",
    videoTitle: "Walkthrough: Forwarding in ALU Pipelines",
    videoSrc: exampleAVideo,
  },
  {
    title: "Example B — Load-Use Hazard",
    instructions: ["LW R1, 0(R2)", "ADD R3, R1, R4", "OR R5, R1, R6"],
    focus:
      "The ADD depends on the loaded value, causing a one-cycle stall. Notice the STALL badge in ID and the stall counter increment.",
    question: "Which cycle introduces the stall, and how does the pipeline recover in the next cycle?",
    videoTitle: "Walkthrough: Load-Use Hazard Investigation",
    videoSrc: exampleBVideo,
  },
  {
    title: "Example C — Branch Taken",
    instructions: ["BEQ R1, R2, +2", "ADD R3, R3, R3", "ADD R4, R4, R4"],
    focus:
      "With predict-not-taken, the ADD after the branch is fetched but flushed once the branch resolves in EX. Watch for the FLUSH badge and branch misprediction counter.",
    question: "How many cycles occur between the BEQ fetch and the flush of the wrong-path instruction?",
    videoTitle: "Walkthrough: Control Hazard and Flush Timing",
    videoSrc: exampleCVideo,
  },
];

const hazardTopics = [
  {
    title: "Data Hazards (RAW)",
    summary: "Dependencies between instructions that require forwarding or stalling.",
    body: "Data hazards occur when an instruction needs a value that is still being computed. The simulator forwards results from EX/MEM or MEM/WB when possible and highlights the forwarding path with operand badges.",
    videoTitle: "Hazard Focus: Data Hazards",
    videoSrc: dataHazardVideo,
  },
  {
    title: "Load-Use Hazards",
    summary: "A special case where the loaded value arrives too late for the next instruction.",
    body: "When a load is immediately followed by a dependent instruction, the simulator inserts a bubble (stall) because the value arrives in MEM/WB. Look for the STALL badge in ID and the stall counter increment.",
    videoTitle: "Hazard Focus: Load-Use Stalls",
    videoSrc: loadUseHazardVideo,
  },
  {
    title: "Control Hazards",
    summary: "Branches alter instruction flow and can flush wrong-path instructions.",
    body: "Branches are predicted not taken. When a branch is taken, the simulator flushes IF/ID and ID/EX and increments the branch misprediction counter.",
    videoTitle: "Hazard Focus: Control Hazards",
    videoSrc: controlHazardVideo,
  },
  {
    title: "Visual Indicators",
    summary: "Badges reveal hazards and instruction categories at a glance.",
    body: "ALU, MEM, and BRANCH badges categorize instructions, while STALL, FLUSH, and forwarding badges call out cycle-by-cycle events. Use them alongside metrics to diagnose performance.",
    videoTitle: "Guide: Reading Pipeline Badges",
    videoSrc: visualIndicatorsVideo,
  },
];

const VideoSection = ({ title, src }: { title: string; src?: string }) => (
  <div className="mt-4">
    <Card className="p-4 border border-border/70 bg-muted/10">
      {src ? (
        <video
          controls
          preload="metadata"
          className="aspect-video w-full rounded-md bg-black"
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="aspect-video w-full rounded-md bg-muted flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border/70">
          Video Placeholder: {title}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        {src
          ? "Use the controls to play or scrub through the stage walkthrough."
          : "Embed or link a video here to provide a narrated walkthrough of this topic."}
      </p>
    </Card>
  </div>
);

const collapseVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

const EducationalContentPage = () => {
  const [openStages, setOpenStages] = useState<Record<string, boolean>>({});
  const [openHazards, setOpenHazards] = useState<Record<string, boolean>>({});
  const [openExamples, setOpenExamples] = useState<Record<string, boolean>>({});

  const toggleStage = (name: string) =>
    setOpenStages((prev) => ({ ...prev, [name]: !prev[name] }));

  const toggleHazard = (title: string) =>
    setOpenHazards((prev) => ({ ...prev, [title]: !prev[title] }));

  const toggleExample = (title: string) =>
    setOpenExamples((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <main className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16 space-y-12">
        <section className="space-y-4">
          <h2 className="text-3xl font-bold">Learn CPU Pipelining</h2>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Pipelining boosts CPU throughput by overlapping instruction execution. This learning hub
            summarises the core ideas, explains each pipeline stage, and highlights common hazards you can
            observe in the simulator.
          </p>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl font-semibold">Introduction to CPU Pipelining</h3>
          <Card className="p-6 border border-border/60 bg-muted/30">
            <p className="text-muted-foreground leading-relaxed">
              A pipeline breaks instruction execution into sequential stages. While one instruction is
              executing, another can be decoding, and a third can be fetched, increasing overall throughput.
              The trade-off is the need to handle hazards—situations where there is a dependency or control
              change that interrupts smooth flow. This simulator models a classic five-stage pipeline and
              makes hazards visible through colour-coded cues.
            </p>
            <div className="mt-4 p-4 border-l-4 border-primary bg-primary/10 text-primary text-sm">
              Diagram placeholder: Imagine a horizontal flow showing IF → ID → EX → MEM → WB with multiple
              instructions staggered along the stages.
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl font-semibold">The Five Pipeline Stages</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {stageDetails.map((stage) => {
              const isOpen = openStages[stage.name];
              return (
                <Card
                  key={stage.name}
                  onClick={() => toggleStage(stage.name)}
                  className="p-6 border border-border/60 bg-background shadow-sm space-y-3 cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xl font-semibold mb-2">{stage.name}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isOpen
                          ? stage.description
                          : `${stage.description.slice(0, 120)}${stage.description.length > 120 ? "..." : ""}`}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      {isOpen ? "Tap to collapse" : "Tap to expand"}
                    </span>
                  </div>
                  <motion.div
                    initial={false}
                    animate={isOpen ? "expanded" : "collapsed"}
                    variants={collapseVariants}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-3">
                      <div className="p-3 rounded-md bg-muted/40 border border-muted text-xs text-muted-foreground">
                        {stage.tip}
                      </div>
                      <VideoSection
                        title={stage.videoTitle ?? `${stage.name} Overview`}
                        src={stage.videoSrc}
                      />
                    </div>
                  </motion.div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl font-semibold">Hazards and How to Spot Them</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {hazardTopics.map((topic) => {
              const isOpen = openHazards[topic.title];
              return (
                <Card
                  key={topic.title}
                  onClick={() => toggleHazard(topic.title)}
                  className="p-6 border border-border/60 bg-background shadow-sm space-y-3 cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{topic.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isOpen
                          ? topic.summary
                          : `${topic.summary.slice(0, 120)}${topic.summary.length > 120 ? "..." : ""}`}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      {isOpen ? "Tap to collapse" : "Tap to expand"}
                    </span>
                  </div>
                  <motion.div
                    initial={false}
                    animate={isOpen ? "expanded" : "collapsed"}
                    variants={collapseVariants}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">{topic.body}</p>
                      <VideoSection title={topic.videoTitle} src={topic.videoSrc} />
                    </div>
                  </motion.div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl font-semibold">Guided Example Walkthroughs</h3>
          <div className="grid gap-6 lg:grid-cols-3">
            {guidedExamples.map((example) => {
              const isOpen = openExamples[example.title];
              return (
                <Card
                  key={example.title}
                  onClick={() => toggleExample(example.title)}
                  className="p-6 border border-border/60 bg-background shadow-sm space-y-3 cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold mb-1">{example.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {isOpen
                          ? example.focus
                          : `${example.focus.slice(0, 120)}${example.focus.length > 120 ? "..." : ""}`}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      {isOpen ? "Tap to collapse" : "Tap to expand"}
                    </span>
                  </div>
                  <motion.div
                    initial={false}
                    animate={isOpen ? "expanded" : "collapsed"}
                    variants={collapseVariants}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-3">
                      <div>
                        <div className="text-xs uppercase font-semibold text-primary tracking-wide mb-2">
                          Instruction Sequence
                        </div>
                        <ul className="text-sm text-muted-foreground font-mono space-y-1">
                          {example.instructions.map((instruction) => (
                            <li key={instruction}>{instruction}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 rounded-md bg-primary/10 border border-primary/30 text-primary text-sm">
                        {example.question}
                      </div>
                      <VideoSection title={example.videoTitle} src={example.videoSrc} />
                    </div>
                  </motion.div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 text-center">
          <h3 className="text-2xl font-semibold">Ready to put this into practice?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Launch the simulator to apply what you’ve learned, or head back to the landing page to explore features.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to="/simulator">Open Simulator</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default EducationalContentPage;
