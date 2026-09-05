import { describe, expect, it } from "vitest"

import { checkResumeFile, sanitizeResumeFilename } from "./validation"

const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])

function pdfBytes(size: number, extra = ""): Uint8Array {
  const body = new TextEncoder().encode("\n".repeat(Math.max(0, size)) + extra)
  const out = new Uint8Array(PDF_HEADER.length + body.length)
  out.set(PDF_HEADER)
  out.set(body, PDF_HEADER.length)
  return out
}

describe("sanitizeResumeFilename", () => {
  it("strips paths and forces a .pdf extension", () => {
    expect(sanitizeResumeFilename("/etc/passwd")).toBe("passwd.pdf")
    expect(sanitizeResumeFilename("C:\\Users\\me\\CV final.pdf")).toBe(
      "CV final.pdf",
    )
  })

  it("removes unsafe characters and caps length", () => {
    expect(sanitizeResumeFilename('rm -rf <>:"|?*.pdf')).toBe("rm -rf.pdf")
    expect(sanitizeResumeFilename(`${"a".repeat(300)}.pdf`).length).toBeLessThanOrEqual(
      124,
    )
  })

  it("falls back to a default when nothing usable remains", () => {
    expect(sanitizeResumeFilename("###.pdf")).toBe("resume.pdf")
  })
})

describe("checkResumeFile", () => {
  it("accepts a real PDF", () => {
    const result = checkResumeFile(pdfBytes(100), "resume.pdf")
    expect(result.ok).toBe(true)
  })

  it("rejects an empty file", () => {
    expect(checkResumeFile(new Uint8Array(), "x.pdf")).toEqual({
      ok: false,
      error: "empty",
    })
  })

  it("rejects a non-PDF regardless of extension", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])
    expect(checkResumeFile(png, "resume.pdf")).toEqual({
      ok: false,
      error: "not_pdf",
    })
  })

  it("rejects a file over the size limit", () => {
    const big = pdfBytes(11 * 1024 * 1024)
    expect(checkResumeFile(big, "big.pdf")).toEqual({
      ok: false,
      error: "too_large",
    })
  })

  it("rejects an encrypted PDF", () => {
    const encrypted = pdfBytes(50, "trailer<< /Encrypt 5 0 R >>")
    expect(checkResumeFile(encrypted, "locked.pdf")).toEqual({
      ok: false,
      error: "encrypted_pdf",
    })
  })
})
