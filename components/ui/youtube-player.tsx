"use client";

import Image from "next/image";
import { useState } from "react";

interface YoutubePlayerProps {
  videoId: string;
  title: string;
}

export default function YoutubePlayer({ videoId, title }: YoutubePlayerProps) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Reproduzir: ${title}`}
      onClick={() => setActive(true)}
      className="absolute inset-0 w-full h-full group cursor-pointer"
    >
      <Image
        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
        alt={title}
        fill
        className="object-cover"
      />
      {/* play button overlay */}
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
        <span className="flex items-center justify-center w-16 h-16 rounded-full bg-accent group-hover:scale-110 transition-transform">
          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 translate-x-0.5" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
