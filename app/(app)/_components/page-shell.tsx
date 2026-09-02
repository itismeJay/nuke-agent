import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8",
        className,
      )}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </header>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  )
}

/** Placeholder body for routes whose feature phase hasn't started yet. */
export function ComingSoon({ phase }: { phase: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Not built yet</EmptyTitle>
        <EmptyDescription>
          This area is scheduled for {phase}. The route exists now so
          authentication and navigation can be verified end to end.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
