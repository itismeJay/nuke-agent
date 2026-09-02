import { describe, expect, it } from "vitest"

import {
  addProfileSkillSchema,
  applicationAnswerSchema,
  careerPreferencesSchema,
  certificationSchema,
  educationSchema,
  experienceSchema,
  personalInfoSchema,
  projectSchema,
} from "./schemas"

describe("personalInfoSchema", () => {
  it("collapses blank strings to undefined", () => {
    const parsed = personalInfoSchema.parse({ full_name: "  ", summary: "" })
    expect(parsed.full_name).toBeUndefined()
    expect(parsed.summary).toBeUndefined()
  })

  it("rejects a malformed email", () => {
    expect(personalInfoSchema.safeParse({ email: "nope" }).success).toBe(false)
    expect(personalInfoSchema.safeParse({ email: "a@b.co" }).success).toBe(true)
  })

  it("rejects a link that is not an http(s) URL", () => {
    expect(
      personalInfoSchema.safeParse({ link_github: "github.com/x" }).success,
    ).toBe(false)
    expect(
      personalInfoSchema.safeParse({ link_github: "https://github.com/x" }).success,
    ).toBe(true)
  })
})

describe("experienceSchema", () => {
  it("requires company and title", () => {
    expect(experienceSchema.safeParse({}).success).toBe(false)
    expect(
      experienceSchema.safeParse({ company: "ACME", title: "Engineer" }).success,
    ).toBe(true)
  })

  it("rejects an end date before the start date", () => {
    const result = experienceSchema.safeParse({
      company: "ACME",
      title: "Engineer",
      start_date: "2022-01-01",
      end_date: "2020-01-01",
    })
    expect(result.success).toBe(false)
  })

  it("clears the end date when the role is current", () => {
    const parsed = experienceSchema.parse({
      company: "ACME",
      title: "Engineer",
      is_current: true,
      end_date: "2024-01-01",
    })
    expect(parsed.end_date).toBeUndefined()
  })

  it("rejects an unknown employment type", () => {
    expect(
      experienceSchema.safeParse({
        company: "ACME",
        title: "Engineer",
        employment_type: "gig",
      }).success,
    ).toBe(false)
  })
})

describe("addProfileSkillSchema", () => {
  it("requires a skill name", () => {
    expect(addProfileSkillSchema.safeParse({ skill_name: "" }).success).toBe(false)
  })

  it("rejects negative years", () => {
    expect(
      addProfileSkillSchema.safeParse({ skill_name: "React", years_experience: "-2" })
        .success,
    ).toBe(false)
  })

  it("coerces years from a string", () => {
    const parsed = addProfileSkillSchema.parse({
      skill_name: "React",
      years_experience: "3.5",
    })
    expect(parsed.years_experience).toBe(3.5)
  })
})

describe("careerPreferencesSchema", () => {
  it("defaults array fields to []", () => {
    const parsed = careerPreferencesSchema.parse({})
    expect(parsed.desired_roles).toEqual([])
    expect(parsed.work_arrangements).toEqual([])
  })

  it("rejects an unknown work arrangement", () => {
    expect(
      careerPreferencesSchema.safeParse({ work_arrangements: ["space"] }).success,
    ).toBe(false)
  })

  it("rejects a negative salary", () => {
    expect(careerPreferencesSchema.safeParse({ min_salary: "-1" }).success).toBe(
      false,
    )
  })
})

describe("projectSchema", () => {
  it("requires a name and keeps skill names as an array", () => {
    const parsed = projectSchema.parse({
      name: "Nook",
      skill_names: ["React", "TypeScript"],
    })
    expect(parsed.skill_names).toEqual(["React", "TypeScript"])
  })
})

describe("educationSchema", () => {
  it("requires an institution", () => {
    expect(educationSchema.safeParse({}).success).toBe(false)
    expect(educationSchema.safeParse({ institution: "MIT" }).success).toBe(true)
  })
})

describe("certificationSchema", () => {
  it("rejects expiry before issue", () => {
    expect(
      certificationSchema.safeParse({
        name: "AWS SAA",
        issued_on: "2023-01-01",
        expires_on: "2022-01-01",
      }).success,
    ).toBe(false)
  })
})

describe("applicationAnswerSchema", () => {
  it("defaults category to general and is_sensitive to false", () => {
    const parsed = applicationAnswerSchema.parse({ question: "Why us?" })
    expect(parsed.category).toBe("general")
    expect(parsed.is_sensitive).toBe(false)
  })

  it("rejects an unknown category", () => {
    expect(
      applicationAnswerSchema.safeParse({ question: "x", category: "salary" }).success,
    ).toBe(false)
  })
})
