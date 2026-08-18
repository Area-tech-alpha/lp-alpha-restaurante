import { VideoCard } from "@/components/ui/video-card";
import Eyebrow from "@/components/ui/eyebrow";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

const { testimonials } = content;

export default function Testimonials() {
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
            <Eyebrow center>{testimonials.sectionLabel}</Eyebrow>
            <h2 className="font-lp-heading text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.15] font-semibold text-lp-ink mt-3.5">
              {testimonials.title}
            </h2>
            <p className="mt-3.5 text-base leading-relaxed text-lp-text-muted">
              {testimonials.subtitle}
            </p>
          </div>
        </ScrollFade>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {testimonials.videos.map((video, i) => (
            <ScrollFade key={video.videoId} delay={i * 80}>
              <VideoCard
                videoId={video.videoId}
                badgeIcon={video.badgeIcon}
                badgeLabel={video.badgeLabel}
                name={video.name}
                role={video.role}
              />
            </ScrollFade>
          ))}
        </div>
      </div>
    </section>
  );
}
