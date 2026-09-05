"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { ActionState } from "@/lib/profile/actions"
import { applyResumeImport, discardResumeImport } from "@/lib/resume/actions"
import type { ResumeImportDetail, ResumeImportItemRow } from "@/lib/resume/queries"

const EMPTY: ActionState = {}

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full name",
  headline: "Headline",
  email: "Email",
  phone: "Phone",
  location: "Location",
  summary: "Professional summary",
  description: "Description",
  employment_type: "Employment type",
  start_date: "Start date",
  end_date: "End date",
  degree: "Degree",
  field_of_study: "Field of study",
  grade: "Grade",
  "link:linkedin": "LinkedIn link",
  "link:github": "GitHub link",
  "link:website": "Website link",
}

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function proposedValue(item: ResumeImportItemRow): string {
  const p = (item.proposed ?? {}) as Record<string, unknown>
  return str(p.value)
}

function currentValue(item: ResumeImportItemRow): string {
  const c = (item.current ?? {}) as Record<string, unknown>
  return str(c.value)
}

function contextLabel(item: ResumeImportItemRow): string {
  const c = (item.current ?? {}) as Record<string, unknown>
  return str(c.label)
}

function describe(item: ResumeImportItemRow): { title: string; body?: string } {
  const p = (item.proposed ?? {}) as Record<string, unknown>
  const verbNew = item.classification === "new" ? "Add" : "Update"

  switch (item.entity_type) {
    case "personal_info":
      return {
        title: `${verbNew} ${FIELD_LABELS[item.field ?? ""] ?? item.field}`,
        body: proposedValue(item),
      }
    case "summary":
      return {
        title: item.classification === "new" ? "Add professional summary" : "Replace professional summary",
        body: proposedValue(item),
      }
    case "experience":
      if (item.field) {
        return { title: `Update ${FIELD_LABELS[item.field] ?? item.field}`, body: proposedValue(item) }
      }
      return {
        title: `Add role: ${str(p.title) || "Untitled"}${p.company ? ` · ${str(p.company)}` : ""}`,
        body: [
          [str(p.start_date), str(p.end_date) || (p.is_current ? "Present" : "")]
            .filter(Boolean)
            .join(" – "),
          Array.isArray(p.achievements) && p.achievements.length > 0
            ? `${p.achievements.length} bullet point${p.achievements.length === 1 ? "" : "s"}`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      }
    case "experience_achievement":
      return { title: "Add achievement", body: `“${str(p.content)}”` }
    case "skill":
      return { title: `Add skill: ${str(p.name)}` }
    case "project":
      if (item.field) {
        return { title: `Update project description`, body: proposedValue(item) }
      }
      return { title: `Add project: ${str(p.name)}`, body: str(p.description) }
    case "education":
      if (item.field) {
        return { title: `Update ${FIELD_LABELS[item.field] ?? item.field}`, body: proposedValue(item) }
      }
      return {
        title: `Add education: ${str(p.degree) || str(p.institution)}`,
        body: [str(p.institution), str(p.field_of_study)].filter(Boolean).join(" · "),
      }
    case "certification":
      return {
        title: `Add certification: ${str(p.name)}`,
        body: str(p.issuer),
      }
    default:
      return { title: item.entity_type }
  }
}

const CLASS_META: Record<
  ResumeImportItemRow["classification"],
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  new: { label: "New", variant: "default" },
  changed: { label: "Fills a gap", variant: "secondary" },
  conflict: { label: "Conflict", variant: "destructive" },
  unchanged: { label: "Already on profile", variant: "outline" },
}

function ApplyButton({ count }: { count: number }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || count === 0} aria-busy={pending}>
      {pending ? <Spinner /> : null}
      {count === 0 ? "Nothing selected" : `Apply ${count} change${count === 1 ? "" : "s"}`}
    </Button>
  )
}

function ItemCard({
  item,
  checked,
  onToggle,
  locked,
}: {
  item: ResumeImportItemRow
  checked: boolean
  onToggle: (checked: boolean) => void
  locked: boolean
}) {
  const { title, body } = describe(item)
  const meta = CLASS_META[item.classification]
  const isConflict = item.classification === "conflict"

  return (
    <label className="flex gap-3 border-b p-3 last:border-0 has-[:disabled]:opacity-70">
      <input
        type="checkbox"
        name="accept"
        value={item.id}
        checked={checked}
        disabled={locked || item.classification === "unchanged"}
        onChange={(event) => onToggle(event.target.checked)}
        className="mt-1 size-4 accent-primary"
      />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {item.confidence === "low" ? (
            <Badge variant="outline">Unverified</Badge>
          ) : null}
          {item.apply_error ? (
            <Badge variant="destructive">Failed: {item.apply_error}</Badge>
          ) : null}
        </div>
        {contextLabel(item) ? (
          <p className="text-xs text-muted-foreground">{contextLabel(item)}</p>
        ) : null}
        {isConflict ? (
          <div className="space-y-0.5 text-sm">
            <p className="text-muted-foreground">
              Current: <span className="text-foreground">{currentValue(item)}</span>
            </p>
            <p className="text-muted-foreground">
              From résumé:{" "}
              <span className="text-foreground">{proposedValue(item)}</span>
            </p>
          </div>
        ) : body ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{body}</p>
        ) : null}
      </div>
    </label>
  )
}

export function ImportReview({ detail }: { detail: ResumeImportDetail }) {
  const { items } = detail
  const alreadyApplied = detail.import.status === "applied"

  const [accepted, setAccepted] = React.useState<Set<string>>(() => {
    const next = new Set<string>()
    for (const item of items) {
      if (alreadyApplied ? item.applied_at : item.recommended && item.classification !== "unchanged") {
        next.add(item.id)
      }
    }
    return next
  })

  const [state, formAction] = useActionState(applyResumeImport, EMPTY)

  const groups: Array<[ResumeImportItemRow["classification"], ResumeImportItemRow[]]> = (
    ["conflict", "new", "changed", "unchanged"] as const
  ).map((c) => [c, items.filter((i) => i.classification === c)])

  const toggle = (id: string, on: boolean) =>
    setAccepted((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const selectRecommended = () =>
    setAccepted(
      new Set(
        items
          .filter((i) => i.recommended && i.classification !== "unchanged")
          .map((i) => i.id),
      ),
    )

  if (state.ok) {
    return (
      <div className="space-y-3">
        <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          {state.error ?? "Your Career Profile has been updated."}
        </p>
        <Button render={<Link href="/profile" />}>View your profile</Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          This résumé didn&apos;t add anything your profile doesn&apos;t already
          have.
        </p>
        <Button variant="outline" render={<Link href="/resumes" />}>
          Back to Resumes
        </Button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="import_id" value={detail.import.id} />

      {state.error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          From <span className="font-medium text-foreground">{detail.resume.original_filename}</span>
        </span>
        {!alreadyApplied ? (
          <Button type="button" variant="outline" size="sm" onClick={selectRecommended}>
            Select recommended
          </Button>
        ) : null}
      </div>

      {groups.map(([classification, groupItems]) => {
        if (groupItems.length === 0) return null
        const meta = CLASS_META[classification]
        const body = (
          <div className="rounded-lg border">
            {groupItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                checked={accepted.has(item.id)}
                onToggle={(on) => toggle(item.id, on)}
                locked={alreadyApplied}
              />
            ))}
          </div>
        )
        if (classification === "unchanged") {
          return (
            <details key={classification}>
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                {meta.label} ({groupItems.length})
              </summary>
              <div className="mt-2">{body}</div>
            </details>
          )
        }
        return (
          <section key={classification} className="space-y-2">
            <h2 className="text-sm font-semibold">
              {meta.label} ({groupItems.length})
            </h2>
            {body}
          </section>
        )
      })}

      {!alreadyApplied ? (
        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <ApplyButton count={accepted.size} />
          <Button
            type="submit"
            variant="ghost"
            formAction={discardResumeImport}
            className="text-muted-foreground"
          >
            Discard this import
          </Button>
        </div>
      ) : (
        <div className="border-t pt-4">
          <Button variant="outline" render={<Link href="/resumes" />}>
            Back to Resumes
          </Button>
        </div>
      )}
    </form>
  )
}
