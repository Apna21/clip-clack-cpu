import { Button } from "@/components/ui/button";
import { HelpCircle, RotateCcw, Info, Moon, Sun } from "lucide-react";

interface HeaderProps {
  onHelp: () => void;
  onReset: () => void;
  onAbout: () => void;
  onToggleTheme: () => void;
  theme: "light" | "dark";
}

export const Header = ({
  onHelp,
  onReset,
  onAbout,
  onToggleTheme,
  theme,
}: HeaderProps) => {
  const isDark = theme === "dark";
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center bg-muted">
            <div className="w-6 h-6 border-2 border-primary rounded"></div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            CPU Pipeline Simulator
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelp}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Help</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAbout}
          >
            <Info className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">About</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
