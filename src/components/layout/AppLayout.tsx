import { Outlet } from "react-router-dom";
import { NavigationBar } from "@/components/NavigationBar";

export const AppLayout = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <NavigationBar />
    <div className="flex-1">
      <Outlet />
    </div>
  </div>
);


