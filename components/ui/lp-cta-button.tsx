"use client";

interface LpCtaButtonProps {
  href?: string;
  className?: string;
  "data-cta"?: string;
  children: React.ReactNode;
}

export default function LpCtaButton({
  href = "#contato",
  className = "",
  "data-cta": dataCta,
  children,
}: LpCtaButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2.5 rounded-full bg-lp-gold-2 bg-gradient-to-r from-lp-gold-1 to-lp-gold-2 px-[30px] py-4 font-lp-heading text-[15.5px] font-bold text-lp-ink shadow-[0_10px_30px_rgba(245,166,35,0.3)] transition-transform hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(245,166,35,0.42)]";

  const id = href.startsWith("#") ? href.slice(1) : undefined;

  return (
    <a
      href={href}
      data-cta={dataCta ?? "lp-cta"}
      className={`${base} ${className}`}
      onClick={
        id
          ? (e) => {
              e.preventDefault();
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
            }
          : undefined
      }
    >
      {children} →
    </a>
  );
}
