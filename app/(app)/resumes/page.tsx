import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listMasterResumes } from "@/lib/resume/queries"

import { PageShell } from "../_components/page-shell"
import { ResumePoller } from "./_components/resume-poller"
import { ResumeUpload } from "./_components/resume-upload"
import { MasterResumeRow } from "./_components/master-resume-row"

export const metadata: Metadata = { title: "Resumes" }

export default async function ResumesPage() {
  const resumes = await listMasterResumes()
  const anyProcessing = resumes.some(
    (entry) =>
      entry.resume.parse_status === "pending" ||
      entry.resume.parse_status === "processing" ||
      entry.latestImport?.status === "queued" ||
      entry.latestImport?.status === "extracting" ||
      entry.latestImport?.status === "parsing",
  )

  return (
    <PageShell
      title="Resumes"
      description="Your uploaded master résumés are immutable source documents. Importing one proposes changes to your Career Profile, which stays the source of truth."
    >
      {anyProcessing ? <ResumePoller /> : null}

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload another résumé</CardTitle>
            <CardDescription>
              Upload a PDF to populate your profile fast. Nothing is added
              automatically — you review every extracted field first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeUpload />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your résumés</CardTitle>
          </CardHeader>
          <CardContent>
            {resumes.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>No résumés yet</EmptyTitle>
                  <EmptyDescription>
                    A résumé is optional — your Career Profile works without one.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumes.map((entry) => (
                      <MasterResumeRow key={entry.resume.id} entry={entry} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tailored Resumes</CardTitle>
            <CardDescription>
              Job-specific résumés generated from your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>Not built yet</EmptyTitle>
                <EmptyDescription>
                  Tailored résumé generation arrives in a later phase.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
