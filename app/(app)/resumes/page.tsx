import type { Metadata } from "next"

import { ComingSoon, PageShell } from "../_components/page-shell"

export const metadata: Metadata = { title: "Resumes" }

export default function ResumesPage() {
  return (
    <PageShell
      title="Resumes"
      description="Your immutable master resumes and the tailored versions derived from them."
    >
      <ComingSoon phase="Phase 3 — Master Resume Intake & Parsing" />
    </PageShell>
  )
}
