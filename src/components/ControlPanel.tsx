import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipForward,
  Undo2,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { speedLabel } from "@/utils/simulation";
import { cn } from "@/lib/utils";

interface ControlPanelProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStep: () => void;
  onBack: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (value: number[]) => void;
  clockCycles: number;
  cpi: number;
  isHalted: boolean;
  canStepBack: boolean;
}

export const ControlPanel = ({
  isPlaying,
  onPlayPause,
  onStep,
  onBack,
  onReset,
  speed,
  onSpeedChange,
  clockCycles,
  cpi,
  isHalted,
  canStepBack,
}: ControlPanelProps) => {
  return (
    <Card className="p-6 shadow-lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <Button
            onClick={onPlayPause}
            size="lg"
            className={cn(
              "w-full lg:w-28 font-semibold shadow-md",
              isPlaying
                ? "bg-hazard-stall/10 text-hazard-stall border border-hazard-stall hover:bg-hazard-stall/15"
                : "bg-primary text-primary-foreground border border-primary hover:bg-primary/90",
              isHalted && !isPlaying && "opacity-60 cursor-not-allowed"
            )}
            disabled={isHalted && !isPlaying}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play
              </>
            )}
          </Button>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
            <Button
              onClick={onStep}
              variant="outline"
              size="lg"
              disabled={isHalted}
              className={cn(
                "w-full border-success text-success hover:bg-success/10 hover:text-success font-semibold shadow-sm",
                isHalted && "opacity-60 cursor-not-allowed"
              )}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Step
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              disabled={!canStepBack}
              className={cn(
                "w-full border-amber-400 text-amber-500 hover:bg-amber-400/10 hover:text-amber-600 font-semibold shadow-sm",
                !canStepBack && "opacity-60 cursor-not-allowed"
              )}
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              size="lg"
              className="w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold shadow-sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Speed</span>
              <span>{speedLabel(speed)}</span>
            </div>
            <Slider
              value={[speed]}
              onValueChange={onSpeedChange}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/40">
            <div className="text-xs uppercase text-muted-foreground tracking-wide">
              Cycles
            </div>
            <div className="text-xl font-semibold text-primary mt-1">
              {clockCycles}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/40">
            <div className="text-xs uppercase text-muted-foreground tracking-wide">
              CPI
            </div>
            <div className="text-xl font-semibold text-success mt-1">
              {cpi.toFixed(2)}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/40">
            <div className="text-xs uppercase text-muted-foreground tracking-wide">
              Status
            </div>
            <div className="text-sm font-medium mt-1">
              {isHalted ? "Halted" : isPlaying ? "Running" : "Ready"}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/40">
            <div className="text-xs uppercase text-muted-foreground tracking-wide">
              History
            </div>
            <div className="text-sm font-medium mt-1">
              {canStepBack ? "Undo available" : "No history"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
