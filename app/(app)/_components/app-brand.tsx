import Link from "next/link"
import { SparklesIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * App-shell identity: logo mark + "JobBuddy AI" wordmark.
 * The wordmark hides when the sidebar is in its icon-only collapsed state;
 * the mark stays visible.
 */
export function AppBrand({
  href = "/dashboard",
  className,
}: {
  href?: string | null
  className?: string
}) {
  const content = (
    <>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <SparklesIcon className="size-4" />
      </span>
      <span className="truncate text-sm font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
        JobBuddy AI
      </span>
    </>
  )

  const classes = cn("flex items-center gap-2", className)

  if (!href) return <div className={classes}>{content}</div>

  return (
    <Link
      href={href}
      aria-label="JobBuddy AI — go to dashboard"
      className={cn(classes, "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring")}
    >
      {content}
    </Link>
  )
}
