import { NextResponse } from "next/server"

/**
 * Liveness endpoint for post-deploy smoke tests and uptime checks.
 *
 * Deliberately says almost nothing: process is up and serving. No database
 * call, no env values, no build internals, no stack traces — this response is
 * public and unauthenticated.
 *
 * `commit` echoes Vercel's injected build SHA so a smoke test can assert it hit
 * the deployment it just created. It is not sensitive (the repo is public).
 */
export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      timestamp: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  )
}
