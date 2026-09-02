import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCard({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  )
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}

/** A row in a section list: primary text, meta line, and an actions slot. */
export function RecordRow({
  title,
  meta,
  children,
  actions,
}: {
  title: React.ReactNode
  meta?: React.ReactNode
  children?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-3 last:border-0 last:pb-0 first:pt-0">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {meta ? (
          <p className="text-xs text-muted-foreground">{meta}</p>
        ) : null}
        {children}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
