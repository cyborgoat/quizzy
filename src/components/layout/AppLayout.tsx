import type { CSSProperties } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppLayout() {
  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "14rem",
          "--sidebar-width-icon": "3rem",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-zinc-50">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
