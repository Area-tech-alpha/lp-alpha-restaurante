"use client"

import { useState } from "react"

const PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

// O Clarity não tem link direto para uma gravação filtrada por Custom user ID,
// então copiamos o ID e abrimos a tela de gravações — é só colar no filtro.
export default function ClarityRecordingButton({ sessionId }: { sessionId: string | null }) {
  const [copied, setCopied] = useState(false)
  if (!sessionId || !PROJECT_ID) return <span className="text-gray-300">—</span>

  async function open() {
    try {
      await navigator.clipboard.writeText(sessionId!)
      setCopied(true)
      setTimeout(() => setCopied(false), 4000)
    } catch {}
    window.open(`https://clarity.microsoft.com/projects/view/${PROJECT_ID}/impressions`, "_blank", "noopener")
  }

  return (
    <button
      type="button"
      onClick={open}
      title="Copia o ID da sessão e abre as gravações. No Clarity: Filters → Custom user ID → colar."
      className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
    >
      {copied ? "ID copiado ✓" : "Gravação ↗"}
    </button>
  )
}
