import Link from "next/link"

import { Wordmark } from "@/components/brand/wordmark"
import { Button } from "@/components/ui/button"

export function MarketingNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <nav className="flex items-center gap-1">
          {signedIn ? (
            <Button size="sm" render={<Link href="/dashboard" />}>
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/sign-in" />}
              >
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/sign-up" />}>
                Get started
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
