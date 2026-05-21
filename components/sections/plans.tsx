import { content } from "@/lib/content";

/** Decorative mountain area chart — purely visual, no semantic meaning. */
function MountainChart() {
  const platforms = ["Meta", "iFood", "Google", "Instagram", "WhatsApp"];

  return (
    <div aria-hidden="true" className="relative w-full h-64 sm:h-80">
      <svg
        viewBox="0 0 400 220"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chart-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFB800" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="chart-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5A623" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d="M0 220 L0 180 C50 170 80 140 110 90 C130 60 150 40 180 30 C210 20 230 55 260 70 C290 85 320 50 360 20 L400 10 L400 220 Z"
          fill="url(#chart-fill)"
        />

        {/* Line stroke */}
        <path
          d="M0 180 C50 170 80 140 110 90 C130 60 150 40 180 30 C210 20 230 55 260 70 C290 85 320 50 360 20 L400 10"
          fill="none"
          stroke="url(#chart-stroke)"
          strokeWidth="2.5"
        />

        {/* Peak dots */}
        {[
          [110, 90],
          [180, 30],
          [260, 70],
          [360, 20],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="#FFB800" />
        ))}
      </svg>

      {/* Floating platform badges */}
      {platforms.map((name, i) => {
        const positions = [
          "top-[28%] left-[22%]",
          "top-[5%] left-[40%]",
          "top-[18%] left-[58%]",
          "top-[1%] left-[74%]",
          "top-[12%] right-[2%]",
        ];
        return (
          <span
            key={name}
            className={`absolute ${positions[i]} bg-bg-card border border-white/10 text-text-muted text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shadow`}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
}

export default function Plans() {
  const { sectionLabel, paragraph } = content.plans;

  return (
    <section id="planos" aria-label="Planos personalizados" className="bg-bg py-20 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Text */}
        <div>
          <p className="text-accent text-xs font-bold uppercase tracking-widest mb-4">
            {sectionLabel}
          </p>

          <h2 className="font-heading uppercase leading-tight text-3xl sm:text-4xl lg:text-[2.6rem] text-text mb-6">
            <span className="font-light">VOCÊ </span>
            <span className="font-bold">ESCOLHE </span>
            <span className="font-light">A </span>
            <span className="font-bold">SOLUÇÃO CERTA </span>
            <span className="font-light">PARA A FASE QUE SEU RESTAURANTE </span>
            <span className="font-bold">VIVE HOJE.</span>
          </h2>

          <p className="text-text-muted leading-relaxed text-sm sm:text-base max-w-lg">
            {paragraph}
          </p>
        </div>

        {/* Decorative chart */}
        <MountainChart />

      </div>
    </section>
  );
}
