import { signInWithGoogle } from "@/lib/auth/actions"

import { GoogleSubmit } from "./google-submit"

/** Server-action form: starts the Google OAuth redirect flow. */
export function GoogleButton({ redirectTo }: { redirectTo?: string }) {
  return (
    <form action={signInWithGoogle}>
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}
      <GoogleSubmit />
    </form>
  )
}
