import { BookOpen, ClipboardList, History, Home, Settings } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function AppSidebarHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarHeader className="h-[4.5rem] gap-0 border-b border-zinc-200 p-0">
      <div className="flex h-full items-center gap-2 px-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md p-1 hover:bg-zinc-200"
            >
              <img
                src="/quizzy-logo.png"
                alt="Quizzy"
                className="size-full rounded-[5px] object-cover"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Toggle sidebar</TooltipContent>
        </Tooltip>

        <span className="truncate text-sm font-semibold text-zinc-950 group-data-[collapsible=icon]:hidden">
          Quizzy
        </span>
      </div>
    </SidebarHeader>
  );
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <AppSidebarHeader />

      <SidebarContent className="px-1 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/"}
              className="hover:bg-zinc-200 data-[active=true]:bg-zinc-300 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
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
              isActive={pathname === "/mistakes"}
              className="hover:bg-zinc-200 data-[active=true]:bg-zinc-300 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
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
              className="hover:bg-zinc-200 data-[active=true]:bg-zinc-300 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
            >
              <Link to="/knowledge">
                <BookOpen className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Knowledge</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/history"}
              className="hover:bg-zinc-200 data-[active=true]:bg-zinc-300 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
            >
              <Link to="/history">
                <History className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">History</span>
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
              className="hover:bg-zinc-200 data-[active=true]:bg-zinc-300 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
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
