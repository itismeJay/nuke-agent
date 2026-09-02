"use client"

import { useActionState, useId } from "react"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { requestPasswordReset, type AuthState } from "@/lib/auth/actions"

import { FormMessage } from "../_components/form-message"
import { SubmitButton } from "../_components/submit-button"

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordReset,
    {} as AuthState,
  )
  const emailId = useId()
  const emailError = state.fieldErrors?.email

  if (state.message) {
    return <FormMessage tone="success">{state.message}</FormMessage>
  }

  return (
    <form action={formAction} noValidate>
      <FieldGroup>
        {state.error ? (
          <FormMessage tone="error">{state.error}</FormMessage>
        ) : null}
        <Field data-invalid={emailError ? true : undefined}>
          <FieldLabel htmlFor={emailId}>Email</FieldLabel>
          <Input
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-invalid={emailError ? true : undefined}
            className="h-10"
            placeholder="you@example.com"
          />
          {emailError ? <FieldError>{emailError}</FieldError> : null}
        </Field>
        <SubmitButton>Send reset link</SubmitButton>
      </FieldGroup>
    </form>
  )
}
