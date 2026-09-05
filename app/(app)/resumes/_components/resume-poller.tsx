"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

/**
 * Refreshes the Resumes page while a parse is in flight. There is no completion
 * notification yet (Phase 12) — this keeps the status badges current.
 */
export function ResumePoller({ intervalMs = 3500 }: { intervalMs?: number }) {
  const router = useRouter()

  React.useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return null
}
