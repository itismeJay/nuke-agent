import type { Metadata } from "next"

import { ComingSoon, PageShell } from "../_components/page-shell"

export const metadata: Metadata = { title: "Billing / Credits" }

export default function BillingPage() {
  return (
    <PageShell
      title="Billing / Credits"
      description="Your plan, credit balance, and usage history."
    >
      <ComingSoon phase="Phase 15 — Billing & Usage Accounting" />
    </PageShell>
  )
}
