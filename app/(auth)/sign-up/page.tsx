import type { Metadata } from "next"
import Link from "next/link"

import { FieldSeparator } from "@/components/ui/field"
import { safeRelativePath } from "@/lib/auth/redirect"

import { CredentialsForm } from "../_components/credentials-form"
import { GoogleButton } from "../_components/google-button"
import { AuthShell } from "../_components/auth-shell"

export const metadata: Metadata = { title: "Create your account" }

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const params = await searchParams
  const redirectTo = safeRelativePath(params.redirectTo) ?? undefined

  return (
    <AuthShell
      title="Create your Nook account"
      subtitle="Build your career profile once — reuse it for every application."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/sign-in${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton redirectTo={redirectTo} />
      <FieldSeparator>or</FieldSeparator>
      <CredentialsForm mode="sign-up" redirectTo={redirectTo} />
      <p className="text-xs text-subtle-foreground">
        By creating an account you agree to keep your career data accurate — Nook
        never fabricates professional facts on your behalf.
      </p>
    </AuthShell>
  )
}
