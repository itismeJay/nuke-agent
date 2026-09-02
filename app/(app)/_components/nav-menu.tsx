"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { primaryNav, secondaryNav, type NavItem } from "./nav-items"

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavMenu({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              isActive={isActive(pathname, item.href)}
              tooltip={item.label}
              render={<Link href={item.href} />}
            >
              <Icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

export function PrimaryNavMenu() {
  return <NavMenu items={primaryNav} />
}

export function SecondaryNavMenu() {
  return <NavMenu items={secondaryNav} />
}
