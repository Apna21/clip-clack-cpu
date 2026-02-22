import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Interactive Pipeline",
    description: "Step through a MIPS-like 5-stage pipeline and watch instructions flow in real time.",
  },
  {
    title: "Hazard Visualisation",
    description: "See stalls, flushes, and forwarding paths highlighted as they occur.",
  },
  {
    title: "Guided Tutorials",
    description: "Follow curated lessons that explain stages, hazards, and performance metrics.",
  },
  {
    title: "Research-Informed Design",
    description: "Built for teaching and learning with feedback from computer architecture students.",
  },
];

const steps = [
  {
    title: "Read the Tutorials",
    description: "Get comfortable with the terminology and pipeline stages in the learning hub.",
  },
  {
    title: "Run the Simulator",
    description: "Explore how instructions advance through the pipeline and watch hazards unfold.",
  },
  {
    title: "Experiment Freely",
    description: "Paste your own instruction sequences to test your understanding of pipelining.",
  },
];

const LandingPage = () => {
  return (
    <main className="bg-background text-foreground">
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
              Learn. Simulate. Understand.
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              CPU Pipeline Simulator
            </h2>
            <p className="text-lg text-muted-foreground">
              Interactive web tool to explore CPU pipelining, hazards, and performance.
              Step through a classic 5-stage pipeline, analyse hazards, and connect theory to practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="sm:w-auto" asChild>
                <Link to="/simulator">Start Simulator</Link>
              </Button>
              <Button size="lg" variant="outline" className="sm:w-auto" asChild>
                <Link to="/learn">Learn the Concepts</Link>
              </Button>
            </div>
          </div>
          <Card className="p-6 md:p-8 shadow-lg bg-muted/40 border border-muted">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Built for interactive learning</h3>
              <p className="text-muted-foreground">
                Visualise each pipeline stage, monitor performance metrics, and inspect hazards as they appear.
                The simulator pairs with structured tutorials so you can bridge diagrams and execution.
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Configurable instruction editor with load/store and branch examples</li>
                <li>Play, step, and rewind controls with detailed hazard logging</li>
                <li>Dark mode, responsive design, and accessible UI controls</li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-4 py-16">
          <h3 className="text-2xl font-semibold mb-8 text-center">Why learners love this tool</h3>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 bg-background shadow-sm border border-border/70">
                <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h3 className="text-2xl font-semibold">How to use this tool</h3>
          <p className="text-muted-foreground">
            Whether you&apos;re preparing for an exam or just curious about pipelining, follow this simple
            learning path to get the most from the simulator.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="p-6 border border-border/70 bg-background shadow-sm">
              <div className="text-sm uppercase font-semibold text-primary tracking-wide mb-2">
                Step {index + 1}
              </div>
              <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
};

export default LandingPage;


