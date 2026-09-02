"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { ActionState } from "@/lib/profile/actions"

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>

const EMPTY: ActionState = {}

/** Native control styling that matches `components/ui/input.tsx`. */
export const controlClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"

export function Labeled({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {error ? (
        <FieldError>{error}</FieldError>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Field>
  )
}

export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select className={cn(controlClass, "pr-8", className)} {...props} />
  )
}

export function SubmitButton({
  children = "Save",
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? <Spinner /> : null}
      {children}
    </Button>
  )
}

/**
 * A `<form>` bound to a profile Server Action. Surfaces the top-level error,
 * fires a toast + `onSuccess` when the action reports `{ ok: true }`.
 */
export function ActionForm({
  action,
  onSuccess,
  successMessage,
  children,
  className,
}: {
  action: Action
  onSuccess?: () => void
  successMessage?: string
  children: (ctx: { state: ActionState }) => React.ReactNode
  className?: string
}) {
  const [state, formAction] = useActionState(action, EMPTY)

  React.useEffect(() => {
    if (state.ok) {
      if (successMessage) toast.success(successMessage)
      onSuccess?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <form action={formAction} className={className} noValidate>
      {state.error ? (
        <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {children({ state })}
    </form>
  )
}

/**
 * Add / edit dialog for a profile record. Renders `fields` inside a form bound
 * to `action`; closes on success. Pass `recordId` to switch the same dialog
 * into edit mode (the caller adds the hidden `id` input).
 */
export function RecordDialog({
  title,
  description,
  triggerLabel,
  triggerVariant = "outline",
  triggerSize = "sm",
  action,
  onDelete,
  children,
}: {
  title: string
  description?: string
  triggerLabel: React.ReactNode
  triggerVariant?: React.ComponentProps<typeof Button>["variant"]
  triggerSize?: React.ComponentProps<typeof Button>["size"]
  action: Action
  onDelete?: React.ReactNode
  children: (ctx: { state: ActionState }) => React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={triggerVariant} size={triggerSize}>
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <ActionForm
          action={action}
          onSuccess={() => setOpen(false)}
          successMessage="Saved"
          className="flex flex-col gap-4"
        >
          {({ state }) => (
            <>
              {children({ state })}
              <DialogFooter className="mt-2">
                <SubmitButton>Save</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
        {onDelete ? (
          <div className="mt-1 border-t pt-3">{onDelete}</div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/** Small inline delete form for use inside a `RecordDialog` footer. */
export function DeleteButton({
  action,
  id,
  label = "Delete",
}: {
  action: (formData: FormData) => Promise<ActionState>
  id: string
  label?: string
}) {
  async function run(formData: FormData) {
    const result = await action(formData)
    if (result?.error) toast.error(result.error)
    else toast.success("Deleted")
  }
  return (
    <form action={run}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" className="text-destructive hover:text-destructive">
        {label}
      </Button>
    </form>
  )
}
