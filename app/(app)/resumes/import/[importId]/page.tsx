import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { loadResumeImport } from "@/lib/resume/queries"

import { PageShell } from "../../../_components/page-shell"
import { ImportReview } from "./_components/import-review"

export const metadata: Metadata = { title: "Review résumé import" }

export default async function ResumeImportPage({
  params,
}: {
  params: Promise<{ importId: string }>
}) {
  const { importId } = await params
  const detail = await loadResumeImport(importId)
  if (!detail) notFound()

  const failed = detail.import.status === "failed"

  return (
    <PageShell
      title="Review résumé import"
      description={
        failed
          ? "This import didn't finish."
          : "Choose which extracted facts to add to your Career Profile. Nothing is changed until you apply."
      }
    >
      {failed ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {detail.import.error ??
            "Parsing failed. Go back to Resumes and try re-uploading."}
        </p>
      ) : (
        <ImportReview detail={detail} />
      )}
    </PageShell>
  )
}
