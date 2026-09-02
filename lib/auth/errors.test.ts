import { describe, expect, it } from "vitest"

import { authErrorMessage, friendlyAuthError } from "./errors"

describe("friendlyAuthError", () => {
  it("maps wrong-credentials to a non-enumerating message", () => {
    expect(friendlyAuthError("Invalid login credentials")).toBe(
      "That email or password is incorrect.",
    )
  })

  it("is case-insensitive on the provider string", () => {
    expect(friendlyAuthError("INVALID LOGIN CREDENTIALS")).toBe(
      "That email or password is incorrect.",
    )
  })

  it("maps duplicate-signup variants", () => {
    expect(friendlyAuthError("User already registered")).toMatch(/already exists/)
    expect(friendlyAuthError("Email has already been registered")).toMatch(
      /already exists/,
    )
  })

  it("maps rate-limit errors", () => {
    expect(friendlyAuthError("email rate limit exceeded")).toMatch(/Too many/)
    expect(friendlyAuthError("Request rate limit reached")).toMatch(/Too many/)
  })

  it("maps weak-password errors", () => {
    expect(friendlyAuthError("Weak password: too short")).toMatch(/too weak/)
  })

  it("falls through unknown errors to a generic message and never echoes them", () => {
    const raw = "duplicate key value violates unique constraint \"users_pkey\""
    const out = friendlyAuthError(raw)
    expect(out).toBe("Something went wrong. Please try again.")
    expect(out).not.toContain("constraint")
  })
})

describe("authErrorMessage", () => {
  it("maps known codes to fixed copy", () => {
    expect(authErrorMessage("oauth_start")).toMatch(/Google sign-in/)
    expect(authErrorMessage("oauth_failed")).toMatch(/cancelled or did not complete/)
    expect(authErrorMessage("link_invalid")).toMatch(/invalid/)
    expect(authErrorMessage("link_expired")).toMatch(/expired/)
  })

  it("returns null for unknown, missing, or array codes", () => {
    expect(authErrorMessage(undefined)).toBeNull()
    expect(authErrorMessage(null)).toBeNull()
    expect(authErrorMessage("")).toBeNull()
    expect(authErrorMessage("Call 1-800-SCAM to unlock your account")).toBeNull()
    expect(authErrorMessage("<script>alert(1)</script>")).toBeNull()
  })

  it("takes the first entry when given an array", () => {
    expect(authErrorMessage(["oauth_start", "link_expired"])).toMatch(
      /Google sign-in/,
    )
  })
})
