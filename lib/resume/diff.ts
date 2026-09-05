import type { ResumeExtraction } from "@/lib/ai/resume-schema"
import { slugifySkill } from "@/lib/profile/skills"

import {
  achievementExists,
  hasCertification,
  hasSkill,
  matchEducation,
  matchExperience,
  matchProject,
} from "./match"
import { cleanText, comparisonKey, normalizeDate, normalizeUrl } from "./normalize"
import type { CurrentProfile, ItemConfidence, ProposalItem } from "./types"

/**
 * Deterministic classifier: compares extracted résumé facts to the CURRENT
 * profile and emits reviewable proposal items.
 *
 * Invariants encoded here (BUILD_PLAN Phase 3):
 *   * an omitted fact produces NO item — a résumé that drops something never
 *     deletes it
 *   * a gap (empty current field) is a fill → CHANGED/NEW, pre-selected
 *   * a non-empty current field that differs is a CONFLICT — never pre-selected,
 *     the user must choose; existing data is never silently overwritten or
 *     downgraded
 *   * `uncertain` from the model → confidence 'low' → never pre-selected
 */

function confidenceOf(uncertain: boolean | null | undefined): ItemConfidence {
  return uncertain ? "low" : "high"
}

const PERSONAL_SCALAR_FIELDS = [
  "full_name",
  "headline",
  "email",
  "phone",
  "location",
] as const

const LINK_FIELDS = ["linkedin", "github", "website"] as const

function scalarItem(
  entityType: ProposalItem["entityType"],
  field: string,
  extractedValue: string,
  currentValue: string | null,
  matchTargetId: string | null,
  matchTargetTable: string | null,
  confidence: ItemConfidence,
  contextLabel?: string | null,
): ProposalItem | null {
  const ev = cleanText(extractedValue)
  if (!ev) return null
  const cv = cleanText(currentValue)
  const base = {
    entityType,
    field,
    matchTargetId,
    matchTargetTable,
    confidence,
  }
  const current = { value: cv, label: contextLabel ?? null }
  if (!cv) {
    return {
      ...base,
      classification: matchTargetId ? "changed" : "new",
      proposed: { value: ev },
      current,
      recommended: confidence === "high",
    }
  }
  if (comparisonKey(ev) === comparisonKey(cv)) {
    return {
      ...base,
      classification: "unchanged",
      proposed: { value: ev },
      current,
      recommended: false,
    }
  }
  return {
    ...base,
    classification: "conflict",
    proposed: { value: ev },
    current,
    recommended: false,
  }
}

function dedupeExperienceAchievements(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const clean = cleanText(raw)
    if (!clean) continue
    const key = comparisonKey(clean)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(clean)
  }
  return out
}

export function buildProposal(
  extraction: ResumeExtraction,
  current: CurrentProfile,
): ProposalItem[] {
  const items: ProposalItem[] = []

  // --- personal information -------------------------------------------------
  const personal = extraction.personal
  if (personal) {
    for (const field of PERSONAL_SCALAR_FIELDS) {
      const item = scalarItem(
        "personal_info",
        field,
        personal[field] ?? "",
        current.personal[field],
        null,
        null,
        "high",
      )
      if (item) items.push(item)
    }

    if (personal.summary) {
      const item = scalarItem(
        "summary",
        "summary",
        personal.summary,
        current.personal.summary,
        null,
        null,
        "high",
      )
      if (item) items.push(item)
    }

    for (const key of LINK_FIELDS) {
      const url = normalizeUrl(personal.links?.[key] ?? null)
      if (!url) continue
      const item = scalarItem(
        "personal_info",
        `link:${key}`,
        url,
        current.personal.links[key] ?? null,
        null,
        null,
        "high",
      )
      if (item) items.push(item)
    }
  }

  // --- experience ---------------------------------------------------------
  for (const ee of extraction.experiences) {
    const confidence = confidenceOf(ee.uncertain)
    const match = matchExperience(ee, current.experiences)
    const achievements = dedupeExperienceAchievements(ee.achievements)

    if (!match) {
      items.push({
        entityType: "experience",
        classification: "new",
        field: null,
        proposed: {
          company: cleanText(ee.company),
          title: cleanText(ee.title),
          employment_type: ee.employment_type,
          location: cleanText(ee.location),
          start_date: normalizeDate(ee.start_date),
          end_date: ee.is_current ? null : normalizeDate(ee.end_date),
          is_current: Boolean(ee.is_current),
          description: cleanText(ee.description),
          achievements,
        },
        current: null,
        matchTargetId: null,
        matchTargetTable: null,
        confidence,
        recommended: confidence === "high",
      })
      continue
    }

    const cur = current.experiences.find((row) => row.id === match.id)
    if (!cur) continue
    const before = items.length
    const contextLabel =
      [cleanText(ee.title), cleanText(ee.company)].filter(Boolean).join(" · ") ||
      null

    for (const [field, ev, cv] of [
      ["location", ee.location, cur.location],
      ["description", ee.description, cur.description],
      ["employment_type", ee.employment_type, cur.employment_type],
      ["start_date", normalizeDate(ee.start_date), cur.start_date],
      [
        "end_date",
        ee.is_current ? null : normalizeDate(ee.end_date),
        cur.end_date,
      ],
    ] as const) {
      if (!ev) continue
      const item = scalarItem(
        "experience",
        field,
        ev,
        cv,
        match.id,
        "experience",
        confidence,
        contextLabel,
      )
      if (item && item.classification !== "unchanged") items.push(item)
    }

    for (const achievement of achievements) {
      if (achievementExists(achievement, cur.achievements)) continue
      items.push({
        entityType: "experience_achievement",
        classification: "new",
        field: null,
        proposed: { content: achievement },
        current: { label: contextLabel },
        matchTargetId: match.id,
        matchTargetTable: "experience",
        confidence,
        recommended: confidence === "high",
      })
    }

    if (items.length === before) {
      items.push({
        entityType: "experience",
        classification: "unchanged",
        field: null,
        proposed: { company: cleanText(ee.company), title: cleanText(ee.title) },
        current: { id: match.id },
        matchTargetId: match.id,
        matchTargetTable: "experience",
        confidence,
        recommended: false,
      })
    }
  }

  // --- skills -----------------------------------------------------------
  const seenSkillSlugs = new Set<string>()
  for (const es of extraction.skills) {
    const name = cleanText(es.name)
    if (!name) continue
    const slug = slugifySkill(name)
    if (!slug || seenSkillSlugs.has(slug)) continue
    seenSkillSlugs.add(slug)
    const confidence = confidenceOf(es.uncertain)

    if (hasSkill(name, current)) {
      items.push({
        entityType: "skill",
        classification: "unchanged",
        field: null,
        proposed: { name },
        current: { name },
        matchTargetId: null,
        matchTargetTable: null,
        confidence,
        recommended: false,
      })
    } else {
      items.push({
        entityType: "skill",
        classification: "new",
        field: null,
        proposed: { name },
        current: null,
        matchTargetId: null,
        matchTargetTable: null,
        confidence,
        recommended: confidence === "high",
      })
    }
  }

  // --- projects -------------------------------------------------------
  for (const ep of extraction.projects) {
    const name = cleanText(ep.name)
    if (!name) continue
    const confidence = confidenceOf(ep.uncertain)
    const match = matchProject(ep, current.projects)

    if (!match) {
      items.push({
        entityType: "project",
        classification: "new",
        field: null,
        proposed: {
          name,
          role: cleanText(ep.role),
          url: normalizeUrl(ep.url),
          description: cleanText(ep.description),
          start_date: normalizeDate(ep.start_date),
          end_date: normalizeDate(ep.end_date),
          skills: dedupeExperienceAchievements(ep.skills),
        },
        current: null,
        matchTargetId: null,
        matchTargetTable: null,
        confidence,
        recommended: confidence === "high",
      })
      continue
    }

    const cur = current.projects.find((row) => row.id === match.id)
    const item = scalarItem(
      "project",
      "description",
      ep.description ?? "",
      cur?.description ?? null,
      match.id,
      "project",
      confidence,
      name,
    )
    if (item && item.classification !== "unchanged") {
      items.push(item)
    } else {
      items.push({
        entityType: "project",
        classification: "unchanged",
        field: null,
        proposed: { name },
        current: { id: match.id },
        matchTargetId: match.id,
        matchTargetTable: "project",
        confidence,
        recommended: false,
      })
    }
  }

  // --- education -----------------------------------------------------
  for (const ed of extraction.education) {
    const institution = cleanText(ed.institution)
    if (!institution) continue
    const confidence = confidenceOf(ed.uncertain)
    const match = matchEducation(ed, current.education)

    if (!match) {
      items.push({
        entityType: "education",
        classification: "new",
        field: null,
        proposed: {
          institution,
          degree: cleanText(ed.degree),
          field_of_study: cleanText(ed.field_of_study),
          grade: cleanText(ed.grade),
          description: cleanText(ed.description),
          start_date: normalizeDate(ed.start_date),
          end_date: normalizeDate(ed.end_date),
        },
        current: null,
        matchTargetId: null,
        matchTargetTable: null,
        confidence,
        recommended: confidence === "high",
      })
      continue
    }

    const cur = current.education.find((row) => row.id === match.id)
    if (!cur) continue
    const before = items.length
    const eduLabel =
      [cleanText(ed.degree), cleanText(ed.institution)]
        .filter(Boolean)
        .join(" · ") || null
    for (const [field, ev, cv] of [
      ["degree", ed.degree, cur.degree],
      ["field_of_study", ed.field_of_study, cur.field_of_study],
      ["grade", ed.grade, cur.grade],
      ["description", ed.description, cur.description],
    ] as const) {
      if (!ev) continue
      const item = scalarItem(
        "education",
        field,
        ev,
        cv,
        match.id,
        "education",
        confidence,
        eduLabel,
      )
      if (item && item.classification !== "unchanged") items.push(item)
    }
    if (items.length === before) {
      items.push({
        entityType: "education",
        classification: "unchanged",
        field: null,
        proposed: { institution },
        current: { id: match.id },
        matchTargetId: match.id,
        matchTargetTable: "education",
        confidence,
        recommended: false,
      })
    }
  }

  // --- certifications ---------------------------------------------
  const seenCertKeys = new Set<string>()
  for (const ec of extraction.certifications) {
    const name = cleanText(ec.name)
    if (!name) continue
    const key = comparisonKey(name)
    if (seenCertKeys.has(key)) continue
    seenCertKeys.add(key)
    const confidence = confidenceOf(ec.uncertain)

    if (hasCertification(name, current)) {
      items.push({
        entityType: "certification",
        classification: "unchanged",
        field: null,
        proposed: { name },
        current: { name },
        matchTargetId: null,
        matchTargetTable: null,
        confidence,
        recommended: false,
      })
    } else {
      items.push({
        entityType: "certification",
        classification: "new",
        field: null,
        proposed: {
          name,
          issuer: cleanText(ec.issuer),
          issued_on: normalizeDate(ec.issued_on),
          expires_on: normalizeDate(ec.expires_on),
          credential_id: cleanText(ec.credential_id),
          credential_url: normalizeUrl(ec.credential_url),
        },
        current: null,
        matchTargetId: null,
        matchTargetTable: null,
        confidence,
        recommended: confidence === "high",
      })
    }
  }

  return items
}

/** Rollup counts for the review UI / status line. */
export function summarizeProposal(items: ProposalItem[]) {
  return {
    total: items.length,
    new: items.filter((i) => i.classification === "new").length,
    changed: items.filter((i) => i.classification === "changed").length,
    unchanged: items.filter((i) => i.classification === "unchanged").length,
    conflict: items.filter((i) => i.classification === "conflict").length,
    recommended: items.filter((i) => i.recommended).length,
  }
}
