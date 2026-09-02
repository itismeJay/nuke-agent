import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * Nook wordmark. Lowercase, understated weight, tight tracking.
 * See docs/design/COMPONENT_PATTERNS.md ("Brand Wordmark").
 */
export function Wordmark({
  href = "/",
  className,
}: {
  href?: string | null
  className?: string
}) {
  const content = (
    <span
      className={cn(
        "text-[0.95rem] font-semibold tracking-tight lowercase text-foreground",
        className,
      )}
    >
      nook
    </span>
  )

  if (!href) return content

  return (
    <Link href={href} className="inline-flex items-center rounded-sm">
      {content}
    </Link>
  )
}
