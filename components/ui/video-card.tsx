"use client";

import Image from "next/image";
import { useState } from "react";

export function VideoCard({ badge, poster }: { badge: string; poster: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl"
      style={{ background: "var(--bg-card)", aspectRatio: "9 / 16" }}
    >
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "var(--bg-card)" }} />
      )}

      <div className="relative flex h-full flex-col">
        {/* Badge no topo */}
        <div className="p-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
            style={{ background: "rgba(0,0,0,0.65)", color: "var(--text)" }}
          >
            {badge}
          </span>
        </div>

        {/* Botão de play centralizado */}
        <div className="flex flex-1 items-center justify-center">
          {!playing ? (
            <button
              onClick={() => setPlaying(true)}
              aria-label={`Reproduzir vídeo: ${badge}`}
              className="flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-110"
              style={{ background: "#FF0000" }}
            >
              <span className="ml-1 text-2xl text-white" aria-hidden="true">
                ▶
              </span>
            </button>
          ) : (
            /* TODO: substituir por player real (Mux/Cloudflare Stream/Vimeo) quando vídeos forem hospedados */
            <div
              className="flex flex-col items-center gap-2 rounded-xl px-6 py-4 text-center"
              style={{ background: "rgba(0,0,0,0.7)" }}
            >
              <span className="text-3xl" aria-hidden="true">🎬</span>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                Vídeo em breve
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Aguardando hospedagem
              </p>
            </div>
          )}
        </div>

        {/* Ícone de compartilhar no rodapé */}
        <div className="flex justify-center pb-4">
          <button
            aria-label="Compartilhar vídeo"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{ background: "rgba(0,0,0,0.5)", color: "var(--text)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.993 2.993 0 0 0 18 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81A2.993 2.993 0 0 0 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.76 0 1.44-.3 1.96-.77l7.13 4.16c-.05.21-.09.43-.09.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92S19.61 16.08 18 16.08z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
