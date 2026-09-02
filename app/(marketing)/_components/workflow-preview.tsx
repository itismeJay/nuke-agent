import {
  BriefcaseIcon,
  FileCheck2Icon,
  SendIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

const steps = [
  { label: "Profile", icon: UserRoundIcon, note: "Trusted career facts" },
  { label: "Match", icon: BriefcaseIcon, note: "Deterministic fit score" },
  { label: "Tailor", icon: SparklesIcon, note: "Only supportable claims" },
  { label: "Apply", icon: SendIcon, note: "Manual, assisted, or auto" },
  { label: "Track", icon: FileCheck2Icon, note: "Immutable history" },
]

/** Static, honest depiction of the product loop — not an animated fake demo. */
export function WorkflowPreview() {
  return (
    <Card className="p-4 sm:p-6">
      <CardContent className="px-0">
        <ol className="grid gap-3 sm:grid-cols-5">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <li
                key={step.label}
                className="nook-rise flex flex-col gap-2 rounded-lg border bg-background p-3"
                style={{ animationDelay: `${120 + i * 70}ms` }}
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-accent text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {step.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {step.note}
                </span>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
