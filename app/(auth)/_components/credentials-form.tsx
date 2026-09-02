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
import { signIn, signUp, type AuthState } from "@/lib/auth/actions"

import { FormMessage } from "./form-message"
import { SubmitButton } from "./submit-button"

const initialState: AuthState = {}

export function CredentialsForm({
  mode,
  redirectTo,
}: {
  mode: "sign-in" | "sign-up"
  redirectTo?: string
}) {
  const action = mode === "sign-in" ? signIn : signUp
  const [state, formAction] = useActionState(action, initialState)
  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()

  const emailError = state.fieldErrors?.email
  const passwordError = state.fieldErrors?.password

  return (
    <form action={formAction} noValidate>
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      <FieldGroup>
        {state.error ? (
          <FormMessage tone="error">{state.error}</FormMessage>
        ) : null}
        {state.message ? (
          <FormMessage tone="success">{state.message}</FormMessage>
        ) : null}

        {mode === "sign-up" ? (
          <Field>
            <FieldLabel htmlFor={nameId}>Name</FieldLabel>
            <Input
              id={nameId}
              name="fullName"
              type="text"
              autoComplete="name"
              className="h-10"
              placeholder="Ada Lovelace"
            />
          </Field>
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

        <Field data-invalid={passwordError ? true : undefined}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
            {mode === "sign-in" ? (
              <a
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </a>
            ) : null}
          </div>
          <Input
            id={passwordId}
            name="password"
            type="password"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            required
            minLength={8}
            aria-invalid={passwordError ? true : undefined}
            className="h-10"
            placeholder={
              mode === "sign-up" ? "At least 8 characters" : "Your password"
            }
          />
          {passwordError ? (
            <FieldError>{passwordError}</FieldError>
          ) : mode === "sign-up" ? (
            <FieldDescription>Use at least 8 characters.</FieldDescription>
          ) : null}
        </Field>

        <SubmitButton>
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}
