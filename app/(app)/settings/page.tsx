import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth/actions"
import { requireUser } from "@/lib/auth/user"

import { ComingSoon, PageShell } from "../_components/page-shell"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const user = await requireUser()

  return (
    <PageShell
      title="Settings"
      description="Account and automation configuration."
    >
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              You&apos;re signed in as{" "}
              <span className="text-foreground">{user.email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signOut}>
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-2 text-sm font-medium text-foreground">Automation</h2>
          <ComingSoon phase="Phase 10 — Automation Settings & Guardrails" />
        </div>
      </div>
    </PageShell>
  )
}
