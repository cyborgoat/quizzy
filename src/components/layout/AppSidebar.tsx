import { BookOpen, Home, Settings, Target, ClipboardList } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGoals } from "@/hooks/useGoals";

const appLogoClassName =
  "size-8 shrink-0 rounded-md border border-zinc-200 bg-white object-cover";

function AppSidebarHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarHeader className="h-[4.5rem] gap-0 border-b border-zinc-200 p-0">
      <div className="flex h-full items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:justify-start">
        <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:hidden">
          <img
            src="/quizzy-logo.png"
            alt=""
            aria-hidden
            className={appLogoClassName}
          />
          <span className="truncate text-sm font-semibold text-zinc-950">Quizzy</span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
              className="hidden size-8 shrink-0 items-center justify-center rounded-md p-1 hover:bg-zinc-100 group-data-[collapsible=icon]:inline-flex"
            >
              <img
                src="/quizzy-logo.png"
                alt="Quizzy"
                className="size-full rounded-[5px] object-cover"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Open sidebar</TooltipContent>
        </Tooltip>

        <SidebarTrigger
          className="group-data-[collapsible=icon]:hidden"
          tooltipSide="left"
        />
      </div>
    </SidebarHeader>
  );
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { goals } = useGoals();
  const activeGoalCount = goals.filter((g) => !g.completed).length;

  return (
    <Sidebar collapsible="icon">
      <AppSidebarHeader />

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
                  <span className="ml-auto grid-center size-4 shrink-0 rounded-full bg-zinc-900 text-xs font-semibold tabular-nums text-white group-data-[collapsible=icon]:hidden">
                    {activeGoalCount}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/mistakes"}
              className="hover:bg-zinc-100 data-[active=true]:bg-zinc-200 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
            >
              <Link to="/mistakes">
                <ClipboardList className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Mistake Log</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/knowledge")}
              className="hover:bg-zinc-100 data-[active=true]:bg-zinc-200 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
            >
              <Link to="/knowledge">
                <BookOpen className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Knowledge</span>
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
