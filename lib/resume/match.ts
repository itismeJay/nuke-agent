import { slugifySkill } from "@/lib/profile/skills"

import { comparisonKey } from "./normalize"
import type { CurrentProfile } from "./types"

/**
 * Deterministic matching of extracted entities to existing profile records.
 *
 * AI transcribes; this code decides identity (D-006). Matching is intentionally
 * conservative — a missed match produces a NEW proposal (a duplicate the user
 * can reject), which is safer than a wrong match that silently edits the wrong
 * record.
 */

function titlesAlign(a: string, b: string): boolean {
  const ka = comparisonKey(a)
  const kb = comparisonKey(b)
  if (!ka || !kb) return false
  return ka === kb || ka.includes(kb) || kb.includes(ka)
}

export function matchExperience(
  extracted: {
    company?: string | null
    title?: string | null
  },
  current: CurrentProfile["experiences"],
): { id: string } | null {
  const company = comparisonKey(extracted.company)
  if (!company) return null
  const candidates = current.filter(
    (row) => comparisonKey(row.company) === company,
  )
  if (candidates.length === 0) return null
  if (candidates.length === 1 && !extracted.title) return { id: candidates[0].id }
  const byTitle = candidates.find(
    (row) => extracted.title && titlesAlign(row.title ?? "", extracted.title ?? ""),
  )
  return byTitle ? { id: byTitle.id } : { id: candidates[0].id }
}

export function matchProject(
  extracted: { name?: string | null },
  current: CurrentProfile["projects"],
): { id: string } | null {
  const name = comparisonKey(extracted.name)
  if (!name) return null
  const found = current.find((row) => comparisonKey(row.name) === name)
  return found ? { id: found.id } : null
}

export function matchEducation(
  extracted: {
    institution?: string | null
    degree?: string | null
  },
  current: CurrentProfile["education"],
): { id: string } | null {
  const institution = comparisonKey(extracted.institution)
  if (!institution) return null
  const candidates = current.filter(
    (row) => comparisonKey(row.institution) === institution,
  )
  if (candidates.length === 0) return null
  const degree = comparisonKey(extracted.degree)
  const byDegree = candidates.find(
    (row) => !degree || comparisonKey(row.degree) === degree,
  )
  return byDegree ? { id: byDegree.id } : { id: candidates[0].id }
}

export function hasSkill(name: string, current: CurrentProfile): boolean {
  const slug = slugifySkill(name)
  return slug.length > 0 && current.skillSlugs.includes(slug)
}

export function hasCertification(name: string, current: CurrentProfile): boolean {
  const key = comparisonKey(name)
  return key.length > 0 && current.certificationNames.some((n) => comparisonKey(n) === key)
}

export function achievementExists(content: string, existing: string[]): boolean {
  const key = comparisonKey(content)
  return key.length > 0 && existing.some((e) => comparisonKey(e) === key)
}
