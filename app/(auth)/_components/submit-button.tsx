"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export function SubmitButton({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      size="lg"
      variant={variant}
      disabled={pending}
      aria-busy={pending}
      className={cn("h-10 w-full", className)}
    >
      {pending ? (
        <>
          <Spinner />
          <span>Working…</span>
        </>
      ) : (
        children
      )}
    </Button>
  )
}
