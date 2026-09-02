import type { Metadata } from "next"

import { loadCareerProfile } from "@/lib/profile/queries"

import { PageShell } from "../_components/page-shell"
import { ProfileWorkspace } from "./_components/profile-workspace"

export const metadata: Metadata = { title: "Profile" }

export default async function ProfilePage() {
  const data = await loadCareerProfile()

  return (
    <PageShell
      title="Career Profile"
      description="The trusted source of truth for matching, tailoring, and applications. Fill in what you can — every section is optional and editable."
    >
      <ProfileWorkspace data={data} />
    </PageShell>
  )
}
