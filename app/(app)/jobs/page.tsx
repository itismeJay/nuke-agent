import type { Metadata } from "next"

import { ComingSoon, PageShell } from "../_components/page-shell"

export const metadata: Metadata = { title: "Jobs" }

export default function JobsPage() {
  return (
    <PageShell
      title="Jobs"
      description="Discovered and imported opportunities, normalized into one model."
    >
      <ComingSoon phase="Phase 4 — Jobs & Companies / Manual Discovery" />
    </PageShell>
  )
}
