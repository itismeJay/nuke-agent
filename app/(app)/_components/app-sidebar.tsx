import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

import { AppBrand } from "./app-brand"
import { CreditsCard } from "./credits-card"
import { FooterNavMenu, PrimaryNavMenu } from "./nav-menu"
import { UserMenu } from "./user-menu"

export function AppSidebar({
  email,
  name,
}: {
  email: string
  name: string | null
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="px-1.5 py-1">
            <AppBrand href="/dashboard" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <PrimaryNavMenu />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3">
        <CreditsCard />
        <FooterNavMenu />
        <SidebarSeparator className="mx-0" />
        <UserMenu email={email} name={name} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
