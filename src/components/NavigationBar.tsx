import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:text-foreground hover:bg-muted"
  );

export const NavigationBar = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center bg-muted">
            <div className="w-6 h-6 border-2 border-primary rounded"></div>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">
            CPU Pipeline Simulator
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/simulator" className={navLinkClass}>
              Simulator
            </NavLink>
            <NavLink to="/learn" className={navLinkClass}>
              Tutorials
            </NavLink>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
};


