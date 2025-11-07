import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>About CPU Pipeline Simulator</DialogTitle>
          <DialogDescription>
            An educational tool for learning computer architecture
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            This simulator helps students understand how instructions flow through 
            the five stages of a classic RISC processor pipeline. Watch as your code 
            executes step-by-step and observe how hazards are detected and resolved.
          </p>

          <div className="space-y-2">
            <h4 className="font-semibold">Features</h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Visual pipeline stage representation</li>
              <li>Real-time hazard detection</li>
              <li>Performance metrics tracking</li>
              <li>Interactive code editor</li>
              <li>Register and memory inspection</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Version 1.0 | Built for educational purposes
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
