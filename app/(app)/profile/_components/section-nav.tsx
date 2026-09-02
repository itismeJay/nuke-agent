"use client"

import { CheckCircle2Icon, CircleIcon } from "lucide-react"

import { Progress, ProgressValue } from "@/components/ui/progress"
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
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm font-medium">Profile completeness</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {completeness.score}%
          </span>
        </div>
        <Progress value={completeness.score} className="block">
          <ProgressValue className="sr-only" />
        </Progress>
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
    </nav>
  )
}
