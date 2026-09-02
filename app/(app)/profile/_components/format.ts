/** "2021" or "Mar 2021" from an ISO date string; "" for null. */
export function formatMonth(value: string | null): string {
  if (!value) return ""
  const [year, month] = value.split("-")
  if (!month) return year
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" })
}

export function formatRange(
  start: string | null,
  end: string | null,
): string {
  const from = formatMonth(start)
  const to = end ? formatMonth(end) : start ? "Present" : ""
  if (from && to) return `${from} – ${to}`
  return from || to || ""
}

export const EMPLOYMENT_TYPES: { value: string; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
  { value: "freelance", label: "Freelance" },
]

export const PROFICIENCIES: { value: string; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
]

export const WORK_ARRANGEMENTS: { value: string; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
]

export const PREF_EMPLOYMENT_TYPES: { value: string; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
]

export const AVAILABILITY: { value: string; label: string }[] = [
  { value: "immediately", label: "Immediately" },
  { value: "one_month", label: "Within a month" },
  { value: "three_months", label: "Within three months" },
  { value: "exploring", label: "Just exploring" },
]

export const ANSWER_CATEGORIES: { value: string; label: string }[] = [
  { value: "general", label: "General" },
  { value: "work_authorization", label: "Work authorization" },
  { value: "sponsorship", label: "Visa sponsorship" },
  { value: "compensation", label: "Compensation" },
  { value: "demographic_eeo", label: "Demographic / EEO" },
  { value: "logistics", label: "Logistics" },
  { value: "other", label: "Other" },
]
