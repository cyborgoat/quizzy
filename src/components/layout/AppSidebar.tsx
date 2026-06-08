import { Home, Settings, Target } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useGoals } from "@/hooks/useGoals";

export function AppSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { goals } = useGoals();
  const activeGoalCount = goals.filter((g) => !g.completed).length;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-[4.5rem] gap-0 border-b border-zinc-200 p-0">
        <div className="flex h-full items-center gap-2.5 px-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <SidebarTrigger className="size-8 shrink-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" />
          <span className="text-sm font-semibold text-zinc-950 group-data-[collapsible=icon]:hidden">Quizzy</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/"}
              className="hover:bg-zinc-100 data-[active=true]:bg-zinc-200 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
            >
              <Link to="/">
                <Home className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/goals"}
              className="hover:bg-zinc-100 data-[active=true]:bg-zinc-200 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
            >
              <Link to="/goals" className="flex items-center gap-2">
                <Target className="size-4 shrink-0" />
                <span className="flex-1 group-data-[collapsible=icon]:hidden">Goals</span>
                {activeGoalCount > 0 && (
                  <span className="ml-auto grid-center size-4 shrink-0 rounded-full bg-zinc-900 text-[10px] font-semibold tabular-nums text-white group-data-[collapsible=icon]:hidden">
                    {activeGoalCount}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-200 px-1 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/settings"}
              className="hover:bg-zinc-100 data-[active=true]:bg-zinc-200 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
            >
              <Link to="/settings">
                <Settings className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
