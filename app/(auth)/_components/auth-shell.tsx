import Link from "next/link"

import { Wordmark } from "@/components/brand/wordmark"

/** Heading + subcopy + body wrapper shared by every auth screen. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="nook-rise mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      {children}

      {footer ? (
        <p className="text-sm text-muted-foreground">{footer}</p>
      ) : null}
    </div>
  )
}

const brandSteps = [
  { label: "Profile" },
  { label: "Match" },
  { label: "Tailor" },
  { label: "Apply" },
  { label: "Track" },
]

/** Full-page frame: brand panel on desktop, single focused column on mobile. */
export function AuthLayoutFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r bg-sidebar lg:flex lg:flex-col lg:justify-center lg:p-12">
        {/* soft, non-decorative depth: a single faint radial, no gradient noise */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/[0.06] blur-3xl"
        />

        <div className="absolute left-12 top-12">
          <Wordmark />
        </div>

        <div className="relative flex max-w-sm flex-col gap-8">
          <div>
            <p className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
              Your career, in motion.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Build your career profile once. Nook helps you discover
              opportunities, understand your fit, tailor your materials, and keep
              the whole search organized.
            </p>
          </div>

          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground">
            {brandSteps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-2">
                <span>{step.label}</span>
                {i < brandSteps.length - 1 ? (
                  <span aria-hidden className="text-subtle-foreground">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <p className="absolute bottom-12 left-12 text-xs text-subtle-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to nook.com
          </Link>
        </p>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Wordmark />
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-4 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  )
}
