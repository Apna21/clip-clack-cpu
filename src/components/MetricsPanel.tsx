import { Card } from "@/components/ui/card";
import { BarChart3, AlertTriangle, TrendingUp } from "lucide-react";

interface MetricsPanelProps {
  stalls: number;
  forwardings: number;
  branchAccuracy: number;
}

export const MetricsPanel = ({ stalls, forwardings, branchAccuracy }: MetricsPanelProps) => {
  return (
    <Card className="p-6 shadow-lg">
      <h3 className="font-semibold text-lg mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
          <div className="p-2 bg-hazard-stall/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-hazard-stall" />
          </div>
          <div>
            <div className="text-2xl font-bold text-hazard-stall">{stalls}</div>
            <div className="text-xs text-muted-foreground">Pipeline Stalls</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
          <div className="p-2 bg-hazard-forward/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-hazard-forward" />
          </div>
          <div>
            <div className="text-2xl font-bold text-hazard-forward">{forwardings}</div>
            <div className="text-xs text-muted-foreground">Forwardings</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
          <div className="p-2 bg-success/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-success" />
          </div>
          <div>
            <div className="text-2xl font-bold text-success">{branchAccuracy}%</div>
            <div className="text-xs text-muted-foreground">Branch Accuracy</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
