import Link from "next/link"
import { Download } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  retryResumeParse,
  setPrimaryResume,
  viewMasterResume,
} from "@/lib/resume/actions"
import type { MasterResumeListEntry } from "@/lib/resume/queries"

type StatusView = { label: string; variant: "default" | "secondary" | "outline" | "destructive" }

function statusView(entry: MasterResumeListEntry): StatusView {
  const importStatus = entry.latestImport?.status
  switch (entry.resume.parse_status) {
    case "parsed":
      return importStatus === "applied"
        ? { label: "Imported", variant: "secondary" }
        : { label: "Ready to review", variant: "default" }
    case "failed":
      return { label: "Parse failed", variant: "destructive" }
    case "processing":
      return { label: "Parsing…", variant: "outline" }
    default:
      return { label: "Queued…", variant: "outline" }
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function MasterResumeRow({ entry }: { entry: MasterResumeListEntry }) {
  const { resume, latestImport, reviewable } = entry
  const status = statusView(entry)

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">
            {resume.original_filename}
          </span>
          {resume.is_primary ? (
            <Badge variant="outline">Primary</Badge>
          ) : null}
        </div>
        {resume.parse_status === "failed" && resume.parse_error ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {resume.parse_error}
          </p>
        ) : null}
      </TableCell>

      <TableCell className="text-muted-foreground">
        {formatDate(resume.uploaded_at)}
      </TableCell>

      <TableCell className="text-muted-foreground">
        {formatBytes(resume.byte_size)}
      </TableCell>

      <TableCell>
        <Badge variant={status.variant}>{status.label}</Badge>
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {reviewable && latestImport ? (
            <Button
              size="sm"
              render={<Link href={`/resumes/import/${latestImport.id}`} />}
            >
              Review import
            </Button>
          ) : null}

          {latestImport?.status === "applied" ? (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/resumes/import/${latestImport.id}`} />}
            >
              View import
            </Button>
          ) : null}

          {resume.parse_status === "failed" ? (
            <form action={retryResumeParse}>
              <input type="hidden" name="resume_id" value={resume.id} />
              <Button size="sm" variant="outline" type="submit">
                Retry
              </Button>
            </form>
          ) : null}

          {!resume.is_primary ? (
            <form action={setPrimaryResume}>
              <input type="hidden" name="resume_id" value={resume.id} />
              <Button size="sm" variant="ghost" type="submit">
                Set primary
              </Button>
            </form>
          ) : null}

          <form action={viewMasterResume}>
            <input type="hidden" name="resume_id" value={resume.id} />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    type="submit"
                    aria-label="Download original"
                  >
                    <Download />
                  </Button>
                }
              />
              <TooltipContent>Download original</TooltipContent>
            </Tooltip>
          </form>
        </div>
      </TableCell>
    </TableRow>
  )
}
