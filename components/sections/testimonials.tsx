import { VideoCard } from "@/components/ui/video-card";
import Eyebrow from "@/components/ui/eyebrow";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

const { testimonials } = content;

// carousel: faixa horizontal com scroll-snap (CSS puro, sem JS) — usado na lp-09.
export default function Testimonials({
  layout = "grid",
  sectionLabel = testimonials.sectionLabel,
  title = testimonials.title,
  subtitle = testimonials.subtitle,
}: {
  layout?: "grid" | "carousel";
  sectionLabel?: string;
  title?: string;
  subtitle?: string;
} = {}) {
  const videos = testimonials.videos.map((video) => (
    <VideoCard
      key={video.videoId}
      videoId={video.videoId}
      badgeIcon={video.badgeIcon}
      badgeLabel={video.badgeLabel}
      name={video.name}
      role={video.role}
    />
  ));

  return (
    <section
      id="depoimentos"
      aria-label="Depoimentos"
      data-section="testimonials"
      className="bg-lp-off py-20"
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <ScrollFade>
          <div className="mx-auto mb-11 max-w-[640px] text-center">
            <Eyebrow center>{sectionLabel}</Eyebrow>
            <h2 className="font-lp-heading text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.15] font-semibold text-lp-ink mt-3.5">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-3.5 text-base leading-relaxed text-lp-text-muted">{subtitle}</p>
            )}
          </div>
        </ScrollFade>

        {layout === "carousel" ? (
          <ScrollFade>
            <ul className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:thin] sm:gap-5">
              {videos.map((video) => (
                <li
                  key={video.key}
                  className="w-[72%] max-w-[300px] shrink-0 snap-center sm:w-[calc((100%-2.5rem)/3)] sm:snap-start"
                >
                  {video}
                </li>
              ))}
            </ul>
          </ScrollFade>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {videos.map((video, i) => (
              <ScrollFade key={video.key} delay={i * 80}>
                {video}
              </ScrollFade>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
