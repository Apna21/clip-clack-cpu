import { Button } from "@/components/ui/button";
import { HelpCircle, RotateCcw, Info } from "lucide-react";

interface HeaderProps {
  onHelp: () => void;
  onReset: () => void;
  onAbout: () => void;
}

export const Header = ({ onHelp, onReset, onAbout }: HeaderProps) => {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary-foreground rounded"></div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold">CPU Pipeline Simulator</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onHelp}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Help</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onReset}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onAbout}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Info className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">About</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
