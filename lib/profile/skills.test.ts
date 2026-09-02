import { describe, expect, it } from "vitest"

import { normalizeSkillName, slugifySkill } from "./skills"

describe("normalizeSkillName", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeSkillName("  React  ")).toBe("React")
    expect(normalizeSkillName("Ruby on\t Rails")).toBe("Ruby on Rails")
  })
})

describe("slugifySkill", () => {
  it("lowercases and dashes non-alphanumerics", () => {
    expect(slugifySkill("Next.js")).toBe("next-js")
    expect(slugifySkill("Ruby on Rails")).toBe("ruby-on-rails")
    expect(slugifySkill("CI/CD")).toBe("ci-cd")
  })

  it("keeps C, C++ and C# distinct", () => {
    expect(slugifySkill("C")).toBe("c")
    expect(slugifySkill("C++")).toBe("cpp")
    expect(slugifySkill("C#")).toBe("csharp")
  })

  it("strips leading and trailing separators", () => {
    expect(slugifySkill(".NET")).toBe("net")
    expect(slugifySkill("  React!  ")).toBe("react")
  })

  it("is stable under name normalization and casing", () => {
    expect(slugifySkill("  TypeScript ")).toBe(slugifySkill("typescript"))
  })
})
