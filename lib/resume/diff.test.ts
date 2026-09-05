import { describe, expect, it } from "vitest"

import { EMPTY_EXTRACTION, type ResumeExtraction } from "@/lib/ai/resume-schema"

import { buildProposal } from "./diff"
import type { CurrentProfile } from "./types"

function emptyProfile(overrides: Partial<CurrentProfile> = {}): CurrentProfile {
  return {
    profileId: "p1",
    personal: {
      full_name: null,
      headline: null,
      email: null,
      phone: null,
      location: null,
      summary: null,
      links: {},
    },
    experiences: [],
    skillSlugs: [],
    projects: [],
    education: [],
    certificationNames: [],
    ...overrides,
  }
}

function extraction(overrides: Partial<ResumeExtraction>): ResumeExtraction {
  return { ...EMPTY_EXTRACTION, ...overrides }
}

function experience(over: Partial<ResumeExtraction["experiences"][number]> = {}) {
  return {
    company: "Acme",
    title: "Engineer",
    employment_type: null,
    location: null,
    start_date: null,
    end_date: null,
    is_current: null,
    description: null,
    achievements: [],
    uncertain: null,
    ...over,
  }
}

describe("buildProposal — experience", () => {
  it("proposes a NEW, recommended item when the role is absent", () => {
    const items = buildProposal(
      extraction({ experiences: [experience({ title: "Staff Engineer" })] }),
      emptyProfile(),
    )
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      entityType: "experience",
      classification: "new",
      recommended: true,
    })
  })

  it("marks a NEW item low-confidence and not recommended when uncertain", () => {
    const items = buildProposal(
      extraction({ experiences: [experience({ uncertain: true })] }),
      emptyProfile(),
    )
    expect(items[0]).toMatchObject({
      classification: "new",
      confidence: "low",
      recommended: false,
    })
  })

  it("classifies a matched role with no new data as UNCHANGED", () => {
    const items = buildProposal(
      extraction({ experiences: [experience()] }),
      emptyProfile({
        experiences: [
          {
            id: "e1",
            company: "Acme",
            title: "Engineer",
            employment_type: null,
            location: null,
            start_date: null,
            end_date: null,
            description: null,
            achievements: [],
          },
        ],
      }),
    )
    expect(items).toHaveLength(1)
    expect(items[0].classification).toBe("unchanged")
  })

  it("fills an empty field as CHANGED and a differing field as CONFLICT", () => {
    const current = emptyProfile({
      experiences: [
        {
          id: "e1",
          company: "Acme",
          title: "Engineer",
          employment_type: null,
          location: "New York",
          start_date: null,
          end_date: null,
          description: null,
          achievements: [],
        },
      ],
    })

    const fill = buildProposal(
      extraction({ experiences: [experience({ description: "Built things" })] }),
      current,
    )
    expect(fill.find((i) => i.field === "description")).toMatchObject({
      classification: "changed",
      recommended: true,
    })

    const conflict = buildProposal(
      extraction({ experiences: [experience({ location: "San Francisco" })] }),
      current,
    )
    expect(conflict.find((i) => i.field === "location")).toMatchObject({
      classification: "conflict",
      recommended: false,
    })
  })

  it("adds only résumé bullets not already present, and never removes any", () => {
    const items = buildProposal(
      extraction({
        experiences: [
          experience({ achievements: ["Shipped v1", "Grew the team"] }),
        ],
      }),
      emptyProfile({
        experiences: [
          {
            id: "e1",
            company: "Acme",
            title: "Engineer",
            employment_type: null,
            location: null,
            start_date: null,
            end_date: null,
            description: null,
            achievements: ["shipped v1"],
          },
        ],
      }),
    )
    const achievementItems = items.filter(
      (i) => i.entityType === "experience_achievement",
    )
    expect(achievementItems).toHaveLength(1)
    expect(achievementItems[0].proposed).toEqual({ content: "Grew the team" })
  })
})

describe("buildProposal — skills", () => {
  it("proposes NEW for an absent skill and UNCHANGED for a present one", () => {
    const items = buildProposal(
      extraction({
        skills: [
          { name: "TypeScript", uncertain: null },
          { name: "Rust", uncertain: null },
        ],
      }),
      emptyProfile({ skillSlugs: ["typescript"] }),
    )
    const byName = Object.fromEntries(
      items.map((i) => [(i.proposed as { name: string }).name, i.classification]),
    )
    expect(byName).toEqual({ TypeScript: "unchanged", Rust: "new" })
  })

  it("never emits an item for a profile skill the résumé omits", () => {
    const items = buildProposal(
      extraction({ skills: [{ name: "Go", uncertain: null }] }),
      emptyProfile({ skillSlugs: ["go", "python", "sql"] }),
    )
    expect(items).toHaveLength(1)
    expect(items[0].classification).toBe("unchanged")
  })
})

describe("buildProposal — personal info", () => {
  it("fills empty fields but never silently overwrites a written summary", () => {
    const items = buildProposal(
      extraction({
        personal: {
          full_name: "Jay S",
          headline: null,
          email: null,
          phone: null,
          location: null,
          summary: "Short blurb.",
          links: null,
        },
      }),
      emptyProfile({
        personal: {
          full_name: null,
          headline: null,
          email: null,
          phone: null,
          location: null,
          summary:
            "A detailed, hand-written professional summary describing years of work.",
          links: {},
        },
      }),
    )
    expect(items.find((i) => i.field === "full_name")).toMatchObject({
      classification: "new",
    })
    expect(items.find((i) => i.entityType === "summary")).toMatchObject({
      classification: "conflict",
      recommended: false,
    })
  })
})

describe("buildProposal — nothing in, nothing out", () => {
  it("returns no items for an empty extraction", () => {
    expect(buildProposal(EMPTY_EXTRACTION, emptyProfile())).toEqual([])
  })
})
