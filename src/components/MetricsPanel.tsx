import { Card } from "@/components/ui/card";
import {
  ActivitySquare,
  AlertTriangle,
  TrendingUp,
  Gauge,
  BarChart3,
} from "lucide-react";

interface MetricsPanelProps {
  cycleCount: number;
  instructionsCompleted: number;
  cpi: number;
  stallCount: number;
  forwardCount: number;
  branchCount: number;
  branchMispredictions: number;
  branchAccuracy: number;
}

export const MetricsPanel = ({
  cycleCount,
  instructionsCompleted,
  cpi,
  stallCount,
  forwardCount,
  branchCount,
  branchMispredictions,
  branchAccuracy,
}: MetricsPanelProps) => {
  return (
    <Card className="p-6 shadow-lg">
      <h3 className="font-semibold text-lg mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricTile
          icon={<ActivitySquare className="w-5 h-5 text-primary" />}
          label="Cycle Count"
          value={cycleCount}
        />
        <MetricTile
          icon={<Gauge className="w-5 h-5 text-success" />}
          label="Instructions Completed"
          value={instructionsCompleted}
        />
        <MetricTile
          icon={<TrendingUp className="w-5 h-5 text-success" />}
          label="Average CPI"
          value={cpi.toFixed(2)}
        />
        <MetricTile
          icon={<AlertTriangle className="w-5 h-5 text-hazard-stall" />}
          label="Stall Count"
          value={stallCount}
        />
        <MetricTile
          icon={<TrendingUp className="w-5 h-5 text-hazard-forward" />}
          label="Forward Count"
          value={forwardCount}
        />
        <MetricTile
          icon={<BarChart3 className="w-5 h-5 text-primary" />}
          label="Branches"
          value={`${branchCount} (${branchMispredictions} miss)`}
        />
        <MetricTile
          icon={<BarChart3 className="w-5 h-5 text-success" />}
          label="Branch Accuracy"
          value={`${branchAccuracy.toFixed(1)}%`}
        />
      </div>
    </Card>
  );
};

interface MetricTileProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const MetricTile = ({ icon, label, value }: MetricTileProps) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
      <div className="p-2 bg-background rounded-lg border border-muted-foreground/10">
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase text-muted-foreground tracking-wide">
          {label}
        </div>
        <div className="text-lg font-semibold text-foreground mt-1">{value}</div>
      </div>
    </div>
  );
};
