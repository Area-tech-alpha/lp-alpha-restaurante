"use client";

import Image from "next/image";
import { useState } from "react";
import { Play, Star, TrendingUp } from "lucide-react";

const BADGE_ICONS = {
  "trending-up": TrendingUp,
  star: Star,
} as const;

type BadgeIcon = keyof typeof BADGE_ICONS;

export function VideoCard({
  videoId,
  badgeIcon,
  badgeLabel,
  name,
  role,
}: {
  videoId: string;
  badgeIcon: BadgeIcon;
  badgeLabel: string;
  name: string;
  role: string;
}) {
  const [playing, setPlaying] = useState(false);
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const BadgeIconComponent = BADGE_ICONS[badgeIcon];

  return (
    <div
      className="group relative block overflow-hidden rounded-[22px] bg-lp-panel shadow-[0_20px_50px_-20px_rgba(20,16,5,0.18)] transition-transform duration-400 hover:-translate-y-2"
      style={{ aspectRatio: "9 / 13" }}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={name}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <>
          <Image
            src={thumbnail}
            alt={`${name} — depoimento em vídeo`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(0,0,0,.75) 8%, transparent 45%)",
            }}
            aria-hidden="true"
          />

          <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 rounded-full bg-lp-ink/55 px-3 py-1.5 backdrop-blur-sm">
            <BadgeIconComponent className="h-[13px] w-[13px] text-lp-gold-1" aria-hidden="true" />
            <span className="text-[11.5px] font-bold text-white">{badgeLabel}</span>
          </div>

          <button
            onClick={() => setPlaying(true)}
            aria-label={`Reproduzir depoimento de ${name}`}
            className="absolute top-1/2 left-1/2 z-10 flex h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-lp-gold-1/90 transition-transform duration-300 group-hover:scale-[1.12]"
          >
            <Play className="ml-0.5 h-[22px] w-[22px] text-lp-ink" fill="currentColor" aria-hidden="true" />
          </button>

          <div className="absolute right-4 bottom-3.5 left-4 z-10">
            <h3 className="text-[15px] font-semibold text-white">{name}</h3>
            <span className="text-xs text-white/75">{role}</span>
          </div>
        </>
      )}
    </div>
  );
}
