import type { LucideIcon } from "lucide-react"
import {
  BriefcaseIcon,
  CreditCardIcon,
  FileTextIcon,
  ListChecksIcon,
  Settings2Icon,
  UserIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

/** Primary product sections, in workflow order. */
export const primaryNav: NavItem[] = [
  { href: "/jobs", label: "Jobs", icon: BriefcaseIcon },
  { href: "/resumes", label: "Resume", icon: FileTextIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
  { href: "/applications", label: "Application Status", icon: ListChecksIcon },
]

/** Account-level entries pinned to the sidebar footer. */
export const footerNav: NavItem[] = [
  { href: "/billing", label: "Billing / Credits", icon: CreditCardIcon },
  { href: "/settings", label: "Profile Settings", icon: Settings2Icon },
]
