import type { Metadata } from "next"
import Link from "next/link"

import { FieldSeparator } from "@/components/ui/field"
import { authErrorMessage } from "@/lib/auth/errors"
import { safeRelativePath } from "@/lib/auth/redirect"

import { CredentialsForm } from "../_components/credentials-form"
import { FormMessage } from "../_components/form-message"
import { GoogleButton } from "../_components/google-button"
import { AuthShell } from "../_components/auth-shell"

export const metadata: Metadata = { title: "Sign in" }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}) {
  const params = await searchParams
  const redirectTo = safeRelativePath(params.redirectTo) ?? undefined
  const errorMessage = authErrorMessage(params.error)

  return (
    <AuthShell
      title="Sign in to Nook"
      subtitle="Pick up your job search where you left off."
      footer={
        <>
          New here?{" "}
          <Link
            href={`/sign-up${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {errorMessage ? (
        <FormMessage tone="error">{errorMessage}</FormMessage>
      ) : null}
      <GoogleButton redirectTo={redirectTo} />
      <FieldSeparator>or</FieldSeparator>
      <CredentialsForm mode="sign-in" redirectTo={redirectTo} />
    </AuthShell>
  )
}
