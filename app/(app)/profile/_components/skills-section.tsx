"use client"

import { XIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { addSkill, removeSkill } from "@/lib/profile/actions"
import type { ProfileSkillWithSkill, SkillRow } from "@/lib/profile/queries"

import { PROFICIENCIES } from "./format"
import { ActionForm, Labeled, NativeSelect, SubmitButton } from "./form-kit"
import { EmptyHint, SectionCard } from "./section-card"

async function removeSkillAction(formData: FormData) {
  const result = await removeSkill(formData)
  if (result?.error) toast.error(result.error)
}

function RemoveSkill({ id }: { id: string }) {
  return (
    <form action={removeSkillAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Remove skill"
        className="ml-1 rounded-sm text-muted-foreground hover:text-foreground"
      >
        <XIcon className="size-3" />
      </button>
    </form>
  )
}

export function SkillsSection({
  skills,
  catalog,
}: {
  skills: ProfileSkillWithSkill[]
  catalog: SkillRow[]
}) {
  return (
    <SectionCard
      id="skills"
      title="Skills"
      description="Add at least a few so matching has something to work with."
    >
      <ActionForm
        action={addSkill}
        successMessage="Skill added"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        {({ state }) => (
          <>
            <Labeled
              label="Skill"
              htmlFor="skill_name"
              error={state.fieldErrors?.skill_name}
              className="flex-1"
            >
              <Input
                id="skill_name"
                name="skill_name"
                list="skill-catalog"
                placeholder="e.g. TypeScript"
                autoComplete="off"
              />
            </Labeled>
            <Labeled label="Proficiency" htmlFor="proficiency" className="sm:w-44">
              <NativeSelect id="proficiency" name="proficiency" defaultValue="">
                <option value="">—</option>
                {PROFICIENCIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </NativeSelect>
            </Labeled>
            <SubmitButton>Add</SubmitButton>
          </>
        )}
      </ActionForm>

      <datalist id="skill-catalog">
        {catalog.map((skill) => (
          <option key={skill.id} value={skill.name} />
        ))}
      </datalist>

      <div className="mt-4">
        {skills.length === 0 ? (
          <EmptyHint>No skills added yet.</EmptyHint>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {skills.map((row) => (
              <li key={row.id}>
                <Badge variant="secondary" className="gap-1 py-1 pr-1.5 pl-2.5 font-normal">
                  {row.skill.name}
                  {row.proficiency ? (
                    <span className="text-muted-foreground">· {row.proficiency}</span>
                  ) : null}
                  <RemoveSkill id={row.id} />
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  )
}
