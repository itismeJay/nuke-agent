"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { FileText, UploadCloud } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { ActionState } from "@/lib/profile/actions"
import { uploadMasterResume } from "@/lib/resume/actions"

const EMPTY: ActionState = {}

function DropzoneBody({
  isDragging,
  fileName,
}: {
  isDragging: boolean
  fileName: string | null
}) {
  const { pending } = useFormStatus()

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
        isDragging
          ? "border-ring bg-accent/40"
          : "border-input hover:border-ring/60",
      )}
    >
      {pending ? (
        <Spinner className="size-8 text-muted-foreground" />
      ) : (
        <UploadCloud className="size-8 text-muted-foreground" />
      )}

      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {pending
            ? "Uploading…"
            : fileName
              ? fileName
              : "Drop your résumé here"}
        </p>
        <p className="text-xs text-muted-foreground">PDF, up to 10 MB</p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        aria-busy={pending}
        onClick={(event) => {
          event.currentTarget
            .closest("form")
            ?.querySelector<HTMLInputElement>("input[type=file]")
            ?.click()
        }}
      >
        <FileText /> Choose file
      </Button>
    </div>
  )
}

export function ResumeUpload() {
  const [state, formAction] = useActionState(uploadMasterResume, EMPTY)
  const formRef = React.useRef<HTMLFormElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [fileName, setFileName] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.error ?? "Résumé uploaded — parsing has started.")
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3"
      onReset={() => setFileName(null)}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        const file = event.dataTransfer.files?.[0]
        if (!file || !inputRef.current) return
        inputRef.current.files = event.dataTransfer.files
        setFileName(file.name)
        formRef.current?.requestSubmit()
      }}
    >
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="application/pdf,.pdf"
        required
        aria-label="Résumé PDF"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (!file) return
          setFileName(file.name)
          formRef.current?.requestSubmit()
        }}
      />
      <DropzoneBody isDragging={isDragging} fileName={fileName} />
      {state.error && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  )
}
