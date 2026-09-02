import Link from "next/link"
import {
  ShieldCheckIcon,
  GaugeIcon,
  FileLock2Icon,
  RouteIcon,
} from "lucide-react"

import { Wordmark } from "@/components/brand/wordmark"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/user"

import { MarketingNav } from "./(marketing)/_components/marketing-nav"
import { WorkflowPreview } from "./(marketing)/_components/workflow-preview"

const values = [
  {
    icon: RouteIcon,
    title: "One profile, every application",
    body: "Build your career profile once. Nook reuses it to match roles, tailor resumes, and answer application questions — no re-typing.",
  },
  {
    icon: GaugeIcon,
    title: "Match scores you can explain",
    body: "Fit is computed by deterministic, versioned code — not a vibe from a model. The explanation is generated separately from the score.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Truthful tailoring",
    body: "Every claim on a generated resume traces back to a fact in your profile. Nook never invents experience or sensitive answers.",
  },
  {
    icon: FileLock2Icon,
    title: "You stay in control",
    body: "Manual first. Assisted next. Auto Apply only behind explicit rules and a global kill switch. Application history is append-only.",
  },
]

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-svh flex-col">
      <MarketingNav signedIn={Boolean(user)} />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
          <p
            className="nook-rise text-sm font-medium text-primary"
            style={{ animationDelay: "80ms" }}
          >
            AI career operating system
          </p>
          <h1
            className="nook-rise mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
            style={{ animationDelay: "140ms" }}
          >
            Your career, in motion.
          </h1>
          <p
            className="nook-rise mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground"
            style={{ animationDelay: "220ms" }}
          >
            Build your career profile once. Nook helps you discover
            opportunities, understand your fit, tailor your materials, and keep
            the whole job search organized.
          </p>
          <div
            className="nook-rise mt-7 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "300ms" }}
          >
            <Button size="lg" render={<Link href="/sign-up" />}>
              Get started
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/sign-in" />}
            >
              I already have an account
            </Button>
          </div>

          <div className="mt-14">
            <WorkflowPreview />
          </div>
        </section>

        <section className="border-t bg-card/40">
          <div className="mx-auto grid w-full max-w-6xl gap-x-10 gap-y-8 px-4 py-16 sm:grid-cols-2 sm:px-6">
            {values.map((v) => {
              const Icon = v.icon
              return (
                <div key={v.title} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      {v.title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {v.body}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Start with the profile everything runs on.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            It works even if you never upload a resume.
          </p>
          <div className="mt-6">
            <Button size="lg" render={<Link href="/sign-up" />}>
              Create your account
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Wordmark />
          <p className="text-xs text-subtle-foreground">
            Build your career profile once.
          </p>
        </div>
      </footer>
    </div>
  )
}
