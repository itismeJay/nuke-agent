import { CircleAlertIcon, CircleCheckIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

/** Inline status banner for auth forms, built on the shadcn Alert primitive. */
export function FormMessage({
  children,
  tone = "error",
  className,
}: {
  children: React.ReactNode
  tone?: "error" | "success"
  className?: string
}) {
  if (!children) return null
  const Icon = tone === "success" ? CircleCheckIcon : CircleAlertIcon
  return (
    <Alert
      variant={tone === "error" ? "destructive" : "default"}
      className={cn(tone === "success" && "text-success", className)}
    >
      <Icon />
      <AlertDescription
        className={cn(tone === "success" && "text-success/90")}
      >
        {children}
      </AlertDescription>
    </Alert>
  )
}
