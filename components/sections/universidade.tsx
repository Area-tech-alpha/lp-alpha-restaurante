import Eyebrow from "@/components/ui/eyebrow";
import ScrollFade from "@/components/ui/scroll-fade";
import { VideoCard } from "@/components/ui/video-card";
import { content } from "@/lib/content";

const { universidade } = content;

function renderTitle(text: string) {
  return text.split("*").map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="lp-gold-text">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function Universidade() {
  return (
    <section
      id="universidade"
      aria-label="Universidade FFM"
      data-section="universidade"
      className="bg-lp-white py-20"
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <ScrollFade>
          <div className="mb-10 max-w-[820px]">
            <Eyebrow>{universidade.sectionLabel}</Eyebrow>
            <h2 className="font-lp-heading mt-3.5 text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.15] font-semibold text-lp-ink">
              {renderTitle(universidade.title)}
            </h2>
            <p className="mt-3.5 text-base leading-relaxed text-lp-text-muted">
              {universidade.subtitle}
            </p>
          </div>
        </ScrollFade>

        <ScrollFade>
          <VideoCard
            wide
            videoId={universidade.videoId}
            name={universidade.videoTitle}
            role={universidade.videoRole}
          />
        </ScrollFade>
      </div>
    </section>
  );
}
