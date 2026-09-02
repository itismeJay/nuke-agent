"use client"

import { PlusIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteAchievement,
  deleteExperience,
  saveAchievement,
  saveExperience,
} from "@/lib/profile/actions"
import type { ExperienceWithAchievements } from "@/lib/profile/queries"

import { EMPLOYMENT_TYPES, formatRange } from "./format"
import {
  DeleteButton,
  Labeled,
  NativeSelect,
  RecordDialog,
} from "./form-kit"
import { EmptyHint, RecordRow, SectionCard } from "./section-card"

type Experience = ExperienceWithAchievements

function ExperienceFields({
  experience,
  fieldErrors,
}: {
  experience?: Experience
  fieldErrors?: Record<string, string>
}) {
  return (
    <>
      {experience ? <input type="hidden" name="id" value={experience.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="Company" htmlFor="company" error={fieldErrors?.company}>
          <Input id="company" name="company" defaultValue={experience?.company ?? ""} required />
        </Labeled>
        <Labeled label="Title" htmlFor="title" error={fieldErrors?.title}>
          <Input id="title" name="title" defaultValue={experience?.title ?? ""} required />
        </Labeled>
        <Labeled label="Employment type" htmlFor="employment_type">
          <NativeSelect
            id="employment_type"
            name="employment_type"
            defaultValue={experience?.employment_type ?? ""}
          >
            <option value="">—</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        </Labeled>
        <Labeled label="Location" htmlFor="location">
          <Input id="location" name="location" defaultValue={experience?.location ?? ""} />
        </Labeled>
        <Labeled label="Start date" htmlFor="start_date" error={fieldErrors?.start_date}>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={experience?.start_date ?? ""}
          />
        </Labeled>
        <Labeled label="End date" htmlFor="end_date" error={fieldErrors?.end_date}>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={experience?.end_date ?? ""}
          />
        </Labeled>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_current"
          defaultChecked={!!experience && experience.end_date === null}
          className="size-4"
        />
        I currently work here
      </label>
      <Labeled label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={experience?.description ?? ""}
        />
      </Labeled>
    </>
  )
}

function AchievementList({ experience }: { experience: Experience }) {
  return (
    <div className="mt-2 space-y-1.5">
      {experience.achievements.map((achievement) => (
        <div key={achievement.id} className="flex items-start gap-2 text-sm">
          <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
          <span className="min-w-0 flex-1 text-muted-foreground">{achievement.content}</span>
          <RecordDialog
            title="Edit achievement"
            triggerLabel="Edit"
            triggerVariant="ghost"
            action={saveAchievement}
            onDelete={<DeleteButton action={deleteAchievement} id={achievement.id} />}
          >
            {({ state }) => (
              <>
                <input type="hidden" name="id" value={achievement.id} />
                <input type="hidden" name="experience_id" value={experience.id} />
                <Labeled
                  label="Achievement"
                  htmlFor={`ach-${achievement.id}`}
                  error={state.fieldErrors?.content}
                >
                  <Textarea
                    id={`ach-${achievement.id}`}
                    name="content"
                    rows={2}
                    defaultValue={achievement.content}
                  />
                </Labeled>
              </>
            )}
          </RecordDialog>
        </div>
      ))}
      <RecordDialog
        title="Add achievement"
        description="A concrete result — a metric, a launch, an outcome."
        triggerLabel={
          <>
            <PlusIcon className="size-3.5" /> Add achievement
          </>
        }
        triggerVariant="ghost"
        action={saveAchievement}
      >
        {({ state }) => (
          <>
            <input type="hidden" name="experience_id" value={experience.id} />
            <Labeled
              label="Achievement"
              htmlFor={`ach-new-${experience.id}`}
              error={state.fieldErrors?.content}
            >
              <Textarea
                id={`ach-new-${experience.id}`}
                name="content"
                rows={2}
                placeholder="Cut checkout latency 40% by …"
              />
            </Labeled>
          </>
        )}
      </RecordDialog>
    </div>
  )
}

export function ExperienceSection({
  experiences,
}: {
  experiences: Experience[]
}) {
  return (
    <SectionCard
      id="experience"
      title="Work experience"
      description="Roles you've held, most recent first."
      action={
        <RecordDialog
          title="Add experience"
          triggerLabel={
            <>
              <PlusIcon className="size-4" /> Add
            </>
          }
          action={saveExperience}
        >
          {({ state }) => <ExperienceFields fieldErrors={state.fieldErrors} />}
        </RecordDialog>
      }
    >
      {experiences.length === 0 ? (
        <EmptyHint>No experience yet. Add your current or most recent role.</EmptyHint>
      ) : (
        <div>
          {experiences.map((experience) => (
            <RecordRow
              key={experience.id}
              title={
                <>
                  {experience.title}
                  {experience.company ? (
                    <span className="text-muted-foreground"> · {experience.company}</span>
                  ) : null}
                </>
              }
              meta={
                [formatRange(experience.start_date, experience.end_date), experience.location]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              actions={
                <RecordDialog
                  title="Edit experience"
                  triggerLabel="Edit"
                  triggerVariant="ghost"
                  action={saveExperience}
                  onDelete={<DeleteButton action={deleteExperience} id={experience.id} />}
                >
                  {({ state }) => (
                    <ExperienceFields
                      experience={experience}
                      fieldErrors={state.fieldErrors}
                    />
                  )}
                </RecordDialog>
              }
            >
              {experience.description ? (
                <p className="text-sm text-muted-foreground">{experience.description}</p>
              ) : null}
              <AchievementList experience={experience} />
            </RecordRow>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
