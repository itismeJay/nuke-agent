"use server"

import { redirect } from "next/navigation"

import { publicEnv } from "@/lib/env"
import { ensureAccountInitialized } from "@/lib/auth/account"
import { friendlyAuthError } from "@/lib/auth/errors"
import { safeRedirect } from "@/lib/auth/redirect"
import { createClient } from "@/lib/supabase/server"

export type AuthState = {
  error?: string
  fieldErrors?: Partial<Record<"email" | "password", string>>
  message?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const fieldErrors: AuthState["fieldErrors"] = {}
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email address."
  if (password.length < MIN_PASSWORD) {
    fieldErrors.password = `Use at least ${MIN_PASSWORD} characters.`
  }
  return { email, password, fieldErrors }
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password, fieldErrors } = readCredentials(formData)
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: friendlyAuthError(error.message) }

  redirect(safeRedirect(formData.get("redirectTo")))
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password, fieldErrors } = readCredentials(formData)
  const fullName = String(formData.get("fullName") ?? "").trim()
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: `${publicEnv.siteUrl}/auth/callback`,
    },
  })
  if (error) return { error: friendlyAuthError(error.message) }

  // Email confirmation is disabled, so signUp returns an active session.
  // If confirmation is ever enabled, `data.session` is null here.
  if (!data.session) {
    return {
      message:
        "Check your email for a confirmation link to finish creating your account.",
    }
  }

  if (data.user) {
    await ensureAccountInitialized(supabase, data.user)
  }

  redirect(safeRedirect(formData.get("redirectTo")))
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const redirectTo = safeRedirect(formData.get("redirectTo"))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${publicEnv.siteUrl}/auth/callback?redirectTo=${encodeURIComponent(
        redirectTo,
      )}`,
    },
  })
  if (error || !data.url) {
    redirect(`/sign-in?error=${encodeURIComponent("Could not start Google sign-in.")}`)
  }
  redirect(data.url)
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { fieldErrors: { email: "Enter a valid email address." } }
  }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${publicEnv.siteUrl}/auth/callback?redirectTo=/reset-password`,
  })

  // Always report success — never reveal whether the address has an account.
  return {
    message:
      "If an account exists for that email, a password reset link is on its way.",
  }
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirmPassword") ?? "")
  if (password.length < MIN_PASSWORD) {
    return {
      fieldErrors: { password: `Use at least ${MIN_PASSWORD} characters.` },
    }
  }
  if (password !== confirm) {
    return { fieldErrors: { password: "Passwords do not match." } }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      error:
        "This reset link has expired or was already used. Request a new one.",
    }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: friendlyAuthError(error.message) }

  redirect("/dashboard")
}
