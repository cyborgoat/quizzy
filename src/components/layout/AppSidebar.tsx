import { Home, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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

export function AppSidebar() {
  const location = useLocation();

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
              isActive={location.pathname === "/"}
              className="hover:bg-zinc-100 data-[active=true]:bg-zinc-200 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
            >
              <NavLink to="/">
                <Home className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Home</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-200 px-1 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/settings"}
              className="hover:bg-zinc-100 data-[active=true]:bg-zinc-200 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
            >
              <NavLink to="/settings">
                <Settings className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
