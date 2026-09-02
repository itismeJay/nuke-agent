import { cookies } from "next/headers"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Wordmark } from "@/components/brand/wordmark"
import { ensureAccountInitialized } from "@/lib/auth/account"
import { requireUser } from "@/lib/auth/user"
import { createClient } from "@/lib/supabase/server"

import { AppSidebar } from "./_components/app-sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const supabase = await createClient()

  // Defence-in-depth: guarantee the base rows exist even if the signup trigger
  // never fired for this account. Idempotent — safe on every request.
  await ensureAccountInitialized(supabase, user)

  const { data: profile } = await supabase
    .from("profile")
    .select("full_name, email")
    .eq("user_id", user.id)
    .maybeSingle()

  const name = profile?.full_name ?? null
  const email = profile?.email ?? user.email ?? ""

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar email={email} name={name} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <Wordmark href="/dashboard" />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
