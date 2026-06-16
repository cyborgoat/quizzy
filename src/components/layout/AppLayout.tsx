import type { CSSProperties } from "react";
import { Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { QuizStartDialogProvider } from "@/contexts/QuizStartDialogContext";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppLayout() {
  return (
    <QuizStartDialogProvider>
      <SidebarProvider
        defaultOpen={false}
        storageKey="app_sidebar_open"
        className="min-w-0 overflow-x-hidden"
        style={
          {
            "--sidebar-width": "var(--app-sidebar-width)",
            "--sidebar-width-icon": "3rem",
          } as CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset className="min-h-svh min-w-0 overflow-x-hidden bg-zinc-50">
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </QuizStartDialogProvider>
  );
}
