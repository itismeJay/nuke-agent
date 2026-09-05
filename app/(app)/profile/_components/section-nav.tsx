"use client"

import { CheckCircle2Icon, CircleIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { CircularProgress } from "@/components/ui/circular-progress"
import { cn } from "@/lib/utils"
import type { Completeness } from "@/lib/profile/completeness"

const SECTIONS: { id: string; label: string; key?: string }[] = [
  { id: "personal", label: "Personal info", key: "personal" },
  { id: "experience", label: "Experience", key: "experience" },
  { id: "skills", label: "Skills", key: "skills" },
  { id: "projects", label: "Projects", key: "projects" },
  { id: "education", label: "Education", key: "education" },
  { id: "certifications", label: "Certifications" },
  { id: "preferences", label: "Preferences", key: "preferences" },
  { id: "answers", label: "Application answers" },
]

export function SectionNav({ completeness }: { completeness: Completeness }) {
  const done = new Map(completeness.sections.map((s) => [s.key, s.complete]))

  return (
    <nav className="flex flex-col gap-4 lg:sticky lg:top-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <CircularProgress value={completeness.score} size={104} strokeWidth={8}>
              <span className="text-2xl font-semibold tabular-nums">
                {completeness.score}%
              </span>
            </CircularProgress>
            <span className="text-sm font-medium text-muted-foreground">
              Profile completeness
            </span>
          </div>

          <ul className="flex flex-col gap-0.5 text-sm">
            {SECTIONS.map((section) => {
              const complete = section.key ? done.get(section.key) : undefined
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {complete === undefined ? (
                      <span className="size-3.5" />
                    ) : complete ? (
                      <CheckCircle2Icon className="size-3.5 text-primary" />
                    ) : (
                      <CircleIcon className="size-3.5" />
                    )}
                    <span className={cn(complete && "text-foreground")}>
                      {section.label}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </nav>
  )
}
