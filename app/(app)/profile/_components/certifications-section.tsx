"use client"

import { PlusIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { deleteCertification, saveCertification } from "@/lib/profile/actions"
import type { CertificationRow } from "@/lib/profile/queries"

import { formatMonth } from "./format"
import { DeleteButton, Labeled, RecordDialog } from "./form-kit"
import { EmptyHint, RecordRow, SectionCard } from "./section-card"

function CertificationFields({
  certification,
  fieldErrors,
}: {
  certification?: CertificationRow
  fieldErrors?: Record<string, string>
}) {
  return (
    <>
      {certification ? <input type="hidden" name="id" value={certification.id} /> : null}
      <Labeled label="Name" htmlFor="name" error={fieldErrors?.name}>
        <Input id="name" name="name" defaultValue={certification?.name ?? ""} required />
      </Labeled>
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="Issuer" htmlFor="issuer">
          <Input id="issuer" name="issuer" defaultValue={certification?.issuer ?? ""} />
        </Labeled>
        <Labeled label="Credential ID" htmlFor="credential_id">
          <Input
            id="credential_id"
            name="credential_id"
            defaultValue={certification?.credential_id ?? ""}
          />
        </Labeled>
        <Labeled label="Issued on" htmlFor="issued_on" error={fieldErrors?.issued_on}>
          <Input
            id="issued_on"
            name="issued_on"
            type="date"
            defaultValue={certification?.issued_on ?? ""}
          />
        </Labeled>
        <Labeled label="Expires on" htmlFor="expires_on" error={fieldErrors?.expires_on}>
          <Input
            id="expires_on"
            name="expires_on"
            type="date"
            defaultValue={certification?.expires_on ?? ""}
          />
        </Labeled>
      </div>
      <Labeled
        label="Credential URL"
        htmlFor="credential_url"
        error={fieldErrors?.credential_url}
      >
        <Input
          id="credential_url"
          name="credential_url"
          placeholder="https://…"
          defaultValue={certification?.credential_url ?? ""}
        />
      </Labeled>
    </>
  )
}

export function CertificationsSection({
  certifications,
}: {
  certifications: CertificationRow[]
}) {
  return (
    <SectionCard
      id="certifications"
      title="Certifications"
      description="Professional certifications and licenses."
      action={
        <RecordDialog
          title="Add certification"
          triggerLabel={
            <>
              <PlusIcon className="size-4" /> Add
            </>
          }
          action={saveCertification}
        >
          {({ state }) => <CertificationFields fieldErrors={state.fieldErrors} />}
        </RecordDialog>
      }
    >
      {certifications.length === 0 ? (
        <EmptyHint>No certifications added yet.</EmptyHint>
      ) : (
        <div>
          {certifications.map((row) => (
            <RecordRow
              key={row.id}
              title={
                row.credential_url ? (
                  <a
                    href={row.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {row.name}
                  </a>
                ) : (
                  row.name
                )
              }
              meta={
                [
                  row.issuer,
                  row.issued_on ? `Issued ${formatMonth(row.issued_on)}` : null,
                  row.expires_on ? `Expires ${formatMonth(row.expires_on)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              actions={
                <RecordDialog
                  title="Edit certification"
                  triggerLabel="Edit"
                  triggerVariant="ghost"
                  action={saveCertification}
                  onDelete={<DeleteButton action={deleteCertification} id={row.id} />}
                >
                  {({ state }) => (
                    <CertificationFields
                      certification={row}
                      fieldErrors={state.fieldErrors}
                    />
                  )}
                </RecordDialog>
              }
            />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
