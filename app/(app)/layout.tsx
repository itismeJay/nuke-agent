import { cookies } from "next/headers"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ensureAccountInitialized } from "@/lib/auth/account"
import { requireUser } from "@/lib/auth/user"
import { createClient } from "@/lib/supabase/server"

import { AppBrand } from "./_components/app-brand"
import { AppSidebar } from "./_components/app-sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const supabase = await createClient()

  let { data: profile } = await supabase
    .from("profile")
    .select("full_name, email")
    .eq("user_id", user.id)
    .maybeSingle()

  // Defence-in-depth: if the signup trigger never fired for this account, seed
  // the base rows now and re-read. In the normal case the row already exists,
  // so this costs one SELECT and no writes per request.
  if (!profile) {
    await ensureAccountInitialized(supabase, user)
    ;({ data: profile } = await supabase
      .from("profile")
      .select("full_name, email")
      .eq("user_id", user.id)
      .maybeSingle())
  }

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
          <AppBrand href="/dashboard" />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
