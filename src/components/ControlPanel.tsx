import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ControlPanelProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStep: () => void;
  speed: number;
  onSpeedChange: (value: number[]) => void;
  clockCycles: number;
  cpi: number;
}

export const ControlPanel = ({
  isPlaying,
  onPlayPause,
  onStep,
  speed,
  onSpeedChange,
  clockCycles,
  cpi
}: ControlPanelProps) => {
  return (
    <Card className="p-6 shadow-lg">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={onPlayPause}
            size="lg"
            className="w-24"
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
          <Button
            onClick={onStep}
            variant="outline"
            size="lg"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Step
          </Button>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Speed</span>
              <span>{speed === 0 ? "Slow" : speed === 50 ? "Medium" : "Fast"}</span>
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

        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{clockCycles}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Clock Cycles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{cpi.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">CPI</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
