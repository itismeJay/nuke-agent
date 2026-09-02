import type { Metadata } from "next"

import { ComingSoon, PageShell } from "../_components/page-shell"

export const metadata: Metadata = { title: "Applications" }

export default function ApplicationsPage() {
  return (
    <PageShell
      title="Applications"
      description="Every application, its immutable snapshot, and where it stands."
    >
      <ComingSoon phase="Phase 8 — Manual Application Tracker" />
    </PageShell>
  )
}
