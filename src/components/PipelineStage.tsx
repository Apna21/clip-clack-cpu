import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

type BadgeVariant = "neutral" | "hazard" | "info" | "success";

interface PipelineBadge {
  label: string;
  variant?: BadgeVariant;
}

interface PipelineStageProps {
  name: string;
  label: string;
  description: string;
  color: string;
  instruction?: string | null;
  hasHazard?: boolean;
  hazardType?: "stall" | "forward";
  badges?: PipelineBadge[];
}

const badgeClassNames: Record<BadgeVariant, string> = {
  neutral: "bg-muted text-muted-foreground",
  hazard: "bg-hazard-stall/15 text-hazard-stall border border-hazard-stall/40",
  info: "bg-primary/10 text-primary border border-primary/30",
  success: "bg-success/10 text-success border border-success/30",
};

export const PipelineStage = ({
  name,
  label,
  description,
  color,
  instruction,
  hasHazard,
  hazardType,
  badges = [],
}: PipelineStageProps) => {
  const isEmpty = !instruction;
  const displayInstruction = instruction ?? "—";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative flex-1 min-w-[160px]">
            <div
              className={cn(
                "bg-card border-2 rounded-xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                hasHazard && hazardType === "stall" && "border-hazard-stall ring-1 ring-hazard-stall/40",
                hasHazard && hazardType === "forward" && "border-hazard-forward ring-1 ring-hazard-forward/40",
                !hasHazard && `border-${color}`
              )}
              style={{
                borderColor: !hasHazard ? `hsl(var(--stage-${color}))` : undefined,
              }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 justify-between">
                  <div
                    className="text-xs font-semibold px-2 py-1 rounded-md inline-block"
                    style={{
                      backgroundColor: `hsl(var(--stage-${color}) / 0.15)`,
                      color: `hsl(var(--stage-${color}))`,
                    }}
                  >
                    {label}
                  </div>
                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {badges.map((badge, index) => (
                        <Badge
                          key={`${badge.label}-${index}`}
                          className={cn(
                            "text-[10px] uppercase tracking-wide font-semibold border",
                            badgeClassNames[badge.variant ?? "neutral"]
                          )}
                        >
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-card-foreground">{name}</div>
                <div
                  className={cn(
                    "mt-1 p-2 rounded-md text-xs font-mono transition-colors duration-200",
                    isEmpty ? "bg-muted text-muted-foreground/70 italic" : "bg-muted text-muted-foreground"
                  )}
                >
                  {displayInstruction}
                </div>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
