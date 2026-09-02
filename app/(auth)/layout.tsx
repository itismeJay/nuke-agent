import { AuthLayoutFrame } from "./_components/auth-shell"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthLayoutFrame>{children}</AuthLayoutFrame>
}
