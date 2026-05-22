"use client";

import Image from "next/image";
import { useState } from "react";

export function VideoCard({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false);
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ aspectRatio: "9 / 16", background: "var(--bg-card)" }}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title="Depoimento de cliente"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <>
          <Image
            src={thumbnail}
            alt="Miniatura do depoimento"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <button
              onClick={() => setPlaying(true)}
              aria-label="Reproduzir depoimento"
              className="flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-110"
              style={{ background: "#FF0000" }}
            >
              <span className="ml-1 text-2xl text-white" aria-hidden="true">
                ▶
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
