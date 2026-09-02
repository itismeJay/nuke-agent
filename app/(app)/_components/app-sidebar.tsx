import { Wordmark } from "@/components/brand/wordmark"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { PrimaryNavMenu, SecondaryNavMenu } from "./nav-menu"
import { UserMenu } from "./user-menu"

export function AppSidebar({
  email,
  name,
}: {
  email: string
  name: string | null
}) {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="px-2 py-1.5">
            <Wordmark href="/dashboard" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <PrimaryNavMenu />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SecondaryNavMenu />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu email={email} name={name} />
      </SidebarFooter>
    </Sidebar>
  )
}
