import Link from "next/link"
import { ZapIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Credit balance display for the sidebar footer.
 *
 * Values are static placeholders until billing/usage accounting lands
 * (BUILD_PLAN Phase 15). The real component will read the authoritative
 * balance server-side. Hidden when the sidebar is collapsed to icons.
 */
const CREDITS_REMAINING = 240
const CREDITS_TOTAL = 500

export function CreditsCard({ className }: { className?: string }) {
  const pct = Math.max(
    0,
    Math.min(100, Math.round((CREDITS_REMAINING / CREDITS_TOTAL) * 100)),
  )

  return (
    <div
      className={cn(
        "rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-sidebar-foreground">
          <ZapIcon className="size-3.5 text-primary" aria-hidden />
          Credits
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {CREDITS_REMAINING.toLocaleString()} / {CREDITS_TOTAL.toLocaleString()}
        </span>
      </div>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sidebar-border"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Credits remaining"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>

      <Link
        href="/billing"
        className="mt-2.5 inline-block text-[0.7rem] font-medium text-primary hover:underline"
      >
        Manage plan &amp; buy credits
      </Link>
    </div>
  )
}
