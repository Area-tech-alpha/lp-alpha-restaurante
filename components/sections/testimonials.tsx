import { VideoCard } from "@/components/ui/video-card";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

const { testimonials } = content;

export default function Testimonials() {
  return (
    <section aria-label="Depoimentos" className="py-20 px-4" style={{ background: "#FFFFFF" }}>
      <div className="mx-auto max-w-6xl">
        <ScrollFade>
          <div className="mb-12 text-center">
            <p
              className="mb-4 text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              {testimonials.sectionLabel}
            </p>

            <h2
              className="text-3xl font-bold uppercase leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text-on-light)" }}
            >
              {testimonials.title.prefix}{" "}
              <span style={{ color: "var(--accent)" }}>{testimonials.title.highlight}</span>{" "}
              {testimonials.title.middle}{" "}
              {testimonials.title.suffix}{" "}
              <span style={{ color: "var(--accent)" }}>{testimonials.title.brand}</span>
            </h2>
          </div>
        </ScrollFade>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {testimonials.videos.map((video, i) => (
            <ScrollFade key={video.videoId} delay={i * 150}>
              <VideoCard videoId={video.videoId} />
            </ScrollFade>
          ))}
        </div>
      </div>
    </section>
  );
}
