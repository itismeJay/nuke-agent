import type { Metadata } from "next"

import { AuthShell } from "../_components/auth-shell"
import { ResetPasswordForm } from "./_form"

export const metadata: Metadata = { title: "Set a new password" }

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password for your Nook account."
    >
      <ResetPasswordForm />
    </AuthShell>
  )
}
