import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PipelineStageProps {
  name: string;
  label: string;
  description: string;
  color: string;
  instruction?: string;
  hasHazard?: boolean;
  hazardType?: 'stall' | 'forward';
}

export const PipelineStage = ({ 
  name, 
  label, 
  description, 
  color,
  instruction,
  hasHazard,
  hazardType
}: PipelineStageProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative flex-1 min-w-[140px]">
            <div 
              className={cn(
                "bg-card border-2 rounded-xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                hasHazard && hazardType === 'stall' && "border-hazard-stall",
                hasHazard && hazardType === 'forward' && "border-hazard-forward",
                !hasHazard && `border-${color}`
              )}
              style={{
                borderColor: !hasHazard ? `hsl(var(--stage-${color}))` : undefined
              }}
            >
              <div className="flex flex-col gap-2">
                <div 
                  className="text-xs font-semibold px-2 py-1 rounded-md inline-block w-fit"
                  style={{
                    backgroundColor: `hsl(var(--stage-${color}) / 0.15)`,
                    color: `hsl(var(--stage-${color}))`
                  }}
                >
                  {label}
                </div>
                <div className="text-sm font-medium text-card-foreground">{name}</div>
                {instruction && (
                  <div className="mt-2 p-2 bg-muted rounded-md text-xs font-mono text-muted-foreground animate-fade-in">
                    {instruction}
                  </div>
                )}
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
