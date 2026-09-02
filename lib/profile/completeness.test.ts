import { describe, expect, it } from "vitest"

import {
  computeCompleteness,
  type CompletenessInput,
} from "./completeness"

const empty: CompletenessInput = {
  fullName: null,
  headline: null,
  location: null,
  summary: null,
  experienceCount: 0,
  achievementCount: 0,
  skillCount: 0,
  projectCount: 0,
  educationCount: 0,
  hasPreferences: false,
}

describe("computeCompleteness", () => {
  it("scores an empty profile at 0", () => {
    const { score, sections } = computeCompleteness(empty)
    expect(score).toBe(0)
    expect(sections.every((s) => !s.complete)).toBe(true)
  })

  it("weights sum to 100 when everything is complete", () => {
    const { score } = computeCompleteness({
      fullName: "Ada Lovelace",
      headline: "Engineer",
      location: "London",
      summary: "Builds things.",
      experienceCount: 2,
      achievementCount: 3,
      skillCount: 8,
      projectCount: 1,
      educationCount: 1,
      hasPreferences: true,
    })
    expect(score).toBe(100)
  })

  it("requires name, location and a headline or summary for personal info", () => {
    expect(
      computeCompleteness({ ...empty, fullName: "Ada", location: "London" })
        .sections.find((s) => s.key === "personal")?.complete,
    ).toBe(false)
    expect(
      computeCompleteness({
        ...empty,
        fullName: "Ada",
        location: "London",
        headline: "Engineer",
      }).sections.find((s) => s.key === "personal")?.complete,
    ).toBe(true)
  })

  it("treats whitespace-only strings as missing", () => {
    const { sections } = computeCompleteness({
      ...empty,
      fullName: "   ",
      location: "\t",
      summary: " ",
    })
    expect(sections.find((s) => s.key === "personal")?.complete).toBe(false)
  })

  it("needs at least three skills", () => {
    expect(
      computeCompleteness({ ...empty, skillCount: 2 }).sections.find(
        (s) => s.key === "skills",
      )?.complete,
    ).toBe(false)
    expect(
      computeCompleteness({ ...empty, skillCount: 3 }).sections.find(
        (s) => s.key === "skills",
      )?.complete,
    ).toBe(true)
  })

  it("gives experience the highest single weight", () => {
    const { score } = computeCompleteness({ ...empty, experienceCount: 1 })
    expect(score).toBe(25)
  })
})
