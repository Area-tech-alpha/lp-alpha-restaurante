import { Fragment } from "react";

// Faixa rolante em CSS puro (@keyframes marquee em globals.css). A lista é
// renderizada duas vezes para o translateX(-50%) emendar sem salto; a cópia
// fica oculta para leitores de tela.
export default function Marquee({ items }: { items: readonly string[] }) {
  const row = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {[...items, ...items].map((item, i) => (
        <Fragment key={i}>
          <span className="px-6 whitespace-nowrap">{item}</span>
          <span aria-hidden="true" className="text-lp-on-gold/60">
            •
          </span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      data-section="marquee"
      className="overflow-hidden bg-gradient-to-r from-lp-gold-1 to-lp-gold-2 py-3.5 font-lp-heading text-[15px] font-bold tracking-[.04em] text-lp-on-gold uppercase"
    >
      <div className="marquee-track flex w-max animate-[marquee_40s_linear_infinite]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
