"use client"

import { useActionState, useId } from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { updatePassword, type AuthState } from "@/lib/auth/actions"

import { FormMessage } from "../_components/form-message"
import { SubmitButton } from "../_components/submit-button"

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePassword, {} as AuthState)
  const passwordId = useId()
  const confirmId = useId()
  const passwordError = state.fieldErrors?.password

  return (
    <form action={formAction} noValidate>
      <FieldGroup>
        {state.error ? (
          <FormMessage tone="error">{state.error}</FormMessage>
        ) : null}

        <Field data-invalid={passwordError ? true : undefined}>
          <FieldLabel htmlFor={passwordId}>New password</FieldLabel>
          <Input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={passwordError ? true : undefined}
            className="h-10"
          />
          {passwordError ? (
            <FieldError>{passwordError}</FieldError>
          ) : (
            <FieldDescription>Use at least 8 characters.</FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor={confirmId}>Confirm new password</FieldLabel>
          <Input
            id={confirmId}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-10"
          />
        </Field>

        <SubmitButton>Update password</SubmitButton>
      </FieldGroup>
    </form>
  )
}
