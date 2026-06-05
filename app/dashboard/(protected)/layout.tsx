import { auth } from "@/auth"
import { redirect } from "next/navigation"
import SignOutButton from "@/components/dashboard/sign-out-button"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard — Alpha" }

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/dashboard/login")

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">Alpha · Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">{session.user?.email}</span>
          <SignOutButton />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
