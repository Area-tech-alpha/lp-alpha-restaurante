"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/dashboard/login" })}
      className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
    >
      Sair
    </button>
  )
}
