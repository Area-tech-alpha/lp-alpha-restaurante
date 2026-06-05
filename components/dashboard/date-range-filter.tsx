"use client"

import { useRouter, usePathname } from "next/navigation"
import type { Range } from "@/lib/dashboard-queries"

const OPTIONS: { label: string; value: Range }[] = [
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "90 dias", value: "90d" },
  { label: "Tudo", value: "all" },
]

export default function DateRangeFilter({ current }: { current: Range }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => router.push(`${pathname}?range=${opt.value}`)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            current === opt.value
              ? "bg-gray-900 text-white font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
