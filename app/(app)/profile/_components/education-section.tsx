"use client"

import { PlusIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { deleteEducation, saveEducation } from "@/lib/profile/actions"
import type { EducationRow } from "@/lib/profile/queries"

import { formatRange } from "./format"
import { DeleteButton, Labeled, RecordDialog } from "./form-kit"
import { EmptyHint, RecordRow, SectionCard } from "./section-card"

function EducationFields({
  education,
  fieldErrors,
}: {
  education?: EducationRow
  fieldErrors?: Record<string, string>
}) {
  return (
    <>
      {education ? <input type="hidden" name="id" value={education.id} /> : null}
      <Labeled label="Institution" htmlFor="institution" error={fieldErrors?.institution}>
        <Input
          id="institution"
          name="institution"
          defaultValue={education?.institution ?? ""}
          required
        />
      </Labeled>
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="Degree" htmlFor="degree">
          <Input id="degree" name="degree" defaultValue={education?.degree ?? ""} />
        </Labeled>
        <Labeled label="Field of study" htmlFor="field_of_study">
          <Input
            id="field_of_study"
            name="field_of_study"
            defaultValue={education?.field_of_study ?? ""}
          />
        </Labeled>
        <Labeled label="Start date" htmlFor="start_date" error={fieldErrors?.start_date}>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={education?.start_date ?? ""}
          />
        </Labeled>
        <Labeled label="End date" htmlFor="end_date" error={fieldErrors?.end_date}>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={education?.end_date ?? ""}
          />
        </Labeled>
        <Labeled label="Grade" htmlFor="grade">
          <Input id="grade" name="grade" defaultValue={education?.grade ?? ""} />
        </Labeled>
      </div>
      <Labeled label="Notes" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={education?.description ?? ""}
        />
      </Labeled>
    </>
  )
}

export function EducationSection({ education }: { education: EducationRow[] }) {
  return (
    <SectionCard
      id="education"
      title="Education"
      description="Degrees, diplomas, and coursework."
      action={
        <RecordDialog
          title="Add education"
          triggerLabel={
            <>
              <PlusIcon className="size-4" /> Add
            </>
          }
          action={saveEducation}
        >
          {({ state }) => <EducationFields fieldErrors={state.fieldErrors} />}
        </RecordDialog>
      }
    >
      {education.length === 0 ? (
        <EmptyHint>No education added yet.</EmptyHint>
      ) : (
        <div>
          {education.map((row) => (
            <RecordRow
              key={row.id}
              title={
                <>
                  {row.institution}
                  {row.degree ? (
                    <span className="text-muted-foreground"> · {row.degree}</span>
                  ) : null}
                </>
              }
              meta={
                [row.field_of_study, formatRange(row.start_date, row.end_date), row.grade]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              actions={
                <RecordDialog
                  title="Edit education"
                  triggerLabel="Edit"
                  triggerVariant="ghost"
                  action={saveEducation}
                  onDelete={<DeleteButton action={deleteEducation} id={row.id} />}
                >
                  {({ state }) => (
                    <EducationFields education={row} fieldErrors={state.fieldErrors} />
                  )}
                </RecordDialog>
              }
            >
              {row.description ? (
                <p className="text-sm text-muted-foreground">{row.description}</p>
              ) : null}
            </RecordRow>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
