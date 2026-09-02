import type { LucideIcon } from "lucide-react"
import {
  BriefcaseIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  SendIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/jobs", label: "Jobs", icon: BriefcaseIcon },
  { href: "/applications", label: "Applications", icon: SendIcon },
  { href: "/resumes", label: "Resumes", icon: FileTextIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
]

export const secondaryNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: SettingsIcon },
]
