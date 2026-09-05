import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

// Refreshes the Supabase session and guards protected route groups on every
// matched request. (Next 16 also accepts the newer "proxy" filename, but its
// dev-mode support in 16.3.x is flaky — revisit on upgrade.)
export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *  - api routes (own auth: /api/inngest is signature-verified, /api/health
     *    is public — the session-refresh + route-guard logic here is for pages)
     *  - _next/static, _next/image
     *  - favicon.ico
     *  - files with a static asset extension
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
