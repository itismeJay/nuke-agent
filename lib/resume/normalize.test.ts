import { describe, expect, it } from "vitest"

import { comparisonKey, normalizeDate, normalizeUrl } from "./normalize"

describe("normalizeDate", () => {
  it("pads partial dates to the first of the period", () => {
    expect(normalizeDate("2020")).toBe("2020-01-01")
    expect(normalizeDate("2020-06")).toBe("2020-06-01")
    expect(normalizeDate("2020-06-15")).toBe("2020-06-15")
  })

  it("rejects impossible and malformed dates", () => {
    expect(normalizeDate("2020-13")).toBeNull()
    expect(normalizeDate("2020-02-31")).toBeNull()
    expect(normalizeDate("Jan 2020")).toBeNull()
    expect(normalizeDate("")).toBeNull()
    expect(normalizeDate(null)).toBeNull()
  })
})

describe("normalizeUrl", () => {
  it("adds a scheme to a bare domain", () => {
    expect(normalizeUrl("github.com/me")).toBe("https://github.com/me")
    expect(normalizeUrl("https://x.dev")).toBe("https://x.dev")
  })

  it("returns null for non-URLs", () => {
    expect(normalizeUrl("me")).toBeNull()
    expect(normalizeUrl("")).toBeNull()
  })
})

describe("comparisonKey", () => {
  it("is case- and punctuation-insensitive", () => {
    expect(comparisonKey("  ACME, Inc. ")).toBe(comparisonKey("acme inc"))
    expect(comparisonKey("Senior  Engineer")).toBe("senior engineer")
  })
})
