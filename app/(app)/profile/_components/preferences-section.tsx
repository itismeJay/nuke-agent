"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { savePreferences } from "@/lib/profile/actions"
import type { CareerPreferencesRow } from "@/lib/profile/queries"

import {
  AVAILABILITY,
  PREF_EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
} from "./format"
import { ActionForm, Labeled, NativeSelect, SubmitButton } from "./form-kit"
import { SectionCard } from "./section-card"

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function CheckboxGroup({
  name,
  options,
  selected,
}: {
  name: string
  options: { value: string; label: string }[]
  selected: string[]
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={selected.includes(option.value)}
            className="size-4"
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

export function PreferencesSection({
  preferences,
}: {
  preferences: CareerPreferencesRow | null
}) {
  const roles = asList(preferences?.desired_roles).join(", ")
  const locations = asList(preferences?.desired_locations).join(", ")
  const arrangements = asList(preferences?.work_arrangements)
  const employmentTypes = asList(preferences?.employment_types)

  return (
    <SectionCard
      id="preferences"
      title="Career preferences"
      description="What you're looking for. Used to rank opportunities later."
    >
      <ActionForm
        key={preferences?.updated_at ?? "new"}
        action={savePreferences}
        successMessage="Preferences saved"
        className="flex flex-col gap-4"
      >
        {({ state }) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Labeled
                label="Target roles"
                htmlFor="desired_roles"
                hint="Comma-separated"
                error={state.fieldErrors?.desired_roles}
              >
                <Textarea
                  id="desired_roles"
                  name="desired_roles"
                  rows={2}
                  defaultValue={roles}
                  placeholder="Frontend Engineer, Full-Stack Engineer"
                />
              </Labeled>
              <Labeled
                label="Target locations"
                htmlFor="desired_locations"
                hint="Comma-separated"
                error={state.fieldErrors?.desired_locations}
              >
                <Textarea
                  id="desired_locations"
                  name="desired_locations"
                  rows={2}
                  defaultValue={locations}
                  placeholder="Remote (EU), Berlin"
                />
              </Labeled>
            </div>

            <Labeled label="Work arrangement" htmlFor="work_arrangements">
              <CheckboxGroup
                name="work_arrangements"
                options={WORK_ARRANGEMENTS}
                selected={arrangements}
              />
            </Labeled>

            <Labeled label="Employment type" htmlFor="employment_types">
              <CheckboxGroup
                name="employment_types"
                options={PREF_EMPLOYMENT_TYPES}
                selected={employmentTypes}
              />
            </Labeled>

            <div className="grid gap-4 sm:grid-cols-3">
              <Labeled
                label="Minimum salary"
                htmlFor="min_salary"
                error={state.fieldErrors?.min_salary}
              >
                <Input
                  id="min_salary"
                  name="min_salary"
                  type="number"
                  min={0}
                  defaultValue={preferences?.min_salary ?? ""}
                />
              </Labeled>
              <Labeled label="Currency" htmlFor="salary_currency">
                <Input
                  id="salary_currency"
                  name="salary_currency"
                  placeholder="USD"
                  defaultValue={preferences?.salary_currency ?? ""}
                />
              </Labeled>
              <Labeled label="Per" htmlFor="salary_period">
                <NativeSelect
                  id="salary_period"
                  name="salary_period"
                  defaultValue={preferences?.salary_period ?? ""}
                >
                  <option value="">—</option>
                  <option value="year">Year</option>
                  <option value="hour">Hour</option>
                </NativeSelect>
              </Labeled>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Labeled label="Availability" htmlFor="availability">
                <NativeSelect
                  id="availability"
                  name="availability"
                  defaultValue={preferences?.availability ?? ""}
                >
                  <option value="">—</option>
                  {AVAILABILITY.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </NativeSelect>
              </Labeled>
              <Labeled label="Seniority" htmlFor="seniority">
                <Input
                  id="seniority"
                  name="seniority"
                  placeholder="Senior"
                  defaultValue={preferences?.seniority ?? ""}
                />
              </Labeled>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="open_to_relocation"
                defaultChecked={preferences?.open_to_relocation ?? false}
                className="size-4"
              />
              Open to relocation
            </label>

            <Labeled label="Notes" htmlFor="notes">
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                defaultValue={preferences?.notes ?? ""}
              />
            </Labeled>

            <SubmitButton>Save preferences</SubmitButton>
          </>
        )}
      </ActionForm>
    </SectionCard>
  )
}
