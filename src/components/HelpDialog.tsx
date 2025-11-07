import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpDialog = ({ open, onOpenChange }: HelpDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CPU Pipeline Simulator - Help</DialogTitle>
          <DialogDescription>
            Learn how to use the simulator effectively
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <section>
            <h3 className="font-semibold text-base mb-2">Pipeline Stages</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="font-medium text-stage-fetch">IF (Fetch):</span> Instruction is fetched from memory</li>
              <li><span className="font-medium text-stage-decode">ID (Decode):</span> Instruction is decoded and registers are read</li>
              <li><span className="font-medium text-stage-execute">EX (Execute):</span> Arithmetic or logical operation is performed</li>
              <li><span className="font-medium text-stage-memory">MEM (Memory):</span> Memory access for load/store instructions</li>
              <li><span className="font-medium text-stage-writeback">WB (Write-Back):</span> Result is written back to register file</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Controls</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><strong>Play:</strong> Start automatic execution</li>
              <li><strong>Pause:</strong> Pause automatic execution</li>
              <li><strong>Step:</strong> Execute one clock cycle at a time</li>
              <li><strong>Speed Slider:</strong> Adjust execution speed</li>
              <li><strong>Reset:</strong> Clear all state and start over</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Hazard Detection</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="text-hazard-stall font-medium">Red border:</span> Pipeline stall detected</li>
              <li><span className="text-hazard-forward font-medium">Orange border:</span> Data forwarding enabled</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Supported Instructions</h3>
            <div className="text-muted-foreground font-mono text-xs bg-muted p-3 rounded-lg">
              ADD R1, R2, R3  # Add registers<br/>
              SUB R1, R2, R3  # Subtract registers<br/>
              LW R1, 0(R2)    # Load word<br/>
              SW R1, 0(R2)    # Store word<br/>
              BEQ R1, R2, LABEL  # Branch if equal
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
