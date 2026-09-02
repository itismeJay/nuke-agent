import type { Metadata } from "next"

import { ComingSoon, PageShell } from "../_components/page-shell"

export const metadata: Metadata = { title: "Profile" }

export default function ProfilePage() {
  return (
    <PageShell
      title="Career Profile"
      description="The trusted source of truth for matching, tailoring, and applications."
    >
      <ComingSoon phase="Phase 2 — Career Profile" />
    </PageShell>
  )
}
