import type { Metadata } from "next"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireUser } from "@/lib/auth/user"
import { createClient } from "@/lib/supabase/server"

import { PageShell } from "../_components/page-shell"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const [{ data: profile }, { count: experienceCount }, { data: settings }] =
    await Promise.all([
      supabase
        .from("profile")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("experience")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("agent_settings")
        .select("enabled")
        .eq("user_id", user.id)
        .maybeSingle(),
    ])

  const firstName = profile?.full_name?.split(/\s+/)[0]
  const hasExperience = (experienceCount ?? 0) > 0

  return (
    <PageShell
      title={firstName ? `Welcome, ${firstName}` : "Welcome to Nook"}
      description="Your career operating system. Start by building the profile everything else runs on."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {hasExperience ? "Keep your profile current" : "Build your Career Profile"}
            </CardTitle>
            <CardDescription>
              {hasExperience
                ? "Your profile has experience on it. Add skills, projects, and preferences to improve future matching."
                : "The Career Profile is the trusted source of truth for matching and tailoring. It works even without uploading a resume."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/profile" />}>
              {hasExperience ? "Review profile" : "Start your profile"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation is off</CardTitle>
            <CardDescription>
              {settings?.enabled
                ? "Job discovery is enabled. Auto Apply still requires explicit rules and a confirmed kill switch."
                : "Nothing runs automatically yet. You'll configure discovery and guardrails before anything applies on your behalf."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link href="/settings" />}>
              Open settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <Empty className="mt-4 border">
        <EmptyHeader>
          <EmptyTitle>
            Job matches and application tracking arrive in later phases
          </EmptyTitle>
          <EmptyDescription>
            Once your profile has substance, Nook will surface scored
            opportunities here. For now, this dashboard confirms you&apos;re
            signed in and your account is initialized.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </PageShell>
  )
}
