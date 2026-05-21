"use client";

import { useState } from "react";
import { content } from "@/lib/content";

const { services } = content;

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-xs font-bold"
        style={{ background: "var(--accent)", color: "var(--bg)" }}
        aria-hidden="true"
      >
        ✓
      </span>
      <span className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {text}
      </span>
    </li>
  );
}

export default function Services() {
  const [current, setCurrent] = useState(0);
  const cards = services.cards;
  const total = cards.length;

  const prev = () => setCurrent((i) => (i - 1 + total) % total);
  const next = () => setCurrent((i) => (i + 1) % total);

  return (
    <section aria-label="O que fazemos" style={{ background: "var(--bg)" }} className="py-20 px-4">
      <div className="mx-auto max-w-6xl">
        <p
          className="mb-4 text-center text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          {services.sectionLabel}
        </p>

        <h2
          className="mb-12 text-center text-3xl uppercase leading-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}
        >
          A{" "}
          <strong className="font-bold">ASSESSORIA ALPHA</strong>{" "}
          ESTRUTURA O MARKETING DO SEU RESTAURANTE COM BASE NA SUA{" "}
          <strong className="font-bold">NECESSIDADE</strong>
        </h2>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {cards.map((card, idx) => (
                <article
                  key={card.title}
                  className="min-w-full px-12 sm:px-20"
                  aria-hidden={idx !== current}
                >
                  <div
                    className="mx-auto max-w-2xl rounded-2xl p-8 sm:p-10"
                    style={{ background: "var(--bg-card)" }}
                  >
                    <h3
                      className="mb-6 text-xl font-bold uppercase sm:text-2xl"
                      style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}
                    >
                      {card.title}
                    </h3>

                    {card.bullets.length > 0 ? (
                      <ul className="space-y-4">
                        {card.bullets.map((bullet, bi) => (
                          <CheckItem key={bi} text={bullet} />
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
                        {/* TODO: bullets a confirmar com o cliente (navegar carrossel da LP original) */}
                        Conteúdo em breve.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <button
            onClick={prev}
            aria-label="Card anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold transition-colors"
            style={{ background: "var(--bg-card)", color: "var(--accent)" }}
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Próximo card"
            className="absolute right-0 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold transition-colors"
            style={{ background: "var(--bg-card)", color: "var(--accent)" }}
          >
            ›
          </button>
        </div>

        <div
          className="mt-8 flex justify-center gap-2"
          role="tablist"
          aria-label="Navegação dos cards de serviços"
        >
          {cards.map((card, idx) => (
            <button
              key={card.title}
              role="tab"
              aria-selected={idx === current}
              aria-label={`Ir para card ${idx + 1}: ${card.title}`}
              onClick={() => setCurrent(idx)}
              className="h-2 rounded-full transition-all duration-200"
              style={{
                width: idx === current ? "1.5rem" : "0.5rem",
                background: idx === current ? "var(--accent)" : "var(--bg-card)",
              }}
            />
          ))}
        </div>

        <p className="mt-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {current + 1} / {total}
        </p>
      </div>
    </section>
  );
}
