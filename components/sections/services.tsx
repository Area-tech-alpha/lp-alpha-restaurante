"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { content } from "@/lib/content";

const { services } = content;

const slides = [
  { src: "/oquefazemos-Card-Cardapio-Digital-2.webp", alt: "Cardápio Digital" },
  { src: "/oquefazemos-Card-Disparo-de-Mensagens-Inteligente.webp", alt: "Disparo de Mensagens Inteligente" },
  { src: "/oquefazemos-Card-Gestao-e-Atendimento.webp", alt: "Gestão e Atendimento" },
  { src: "/oquefazemos-Card-Midia-Paga.webp", alt: "Mídia Paga" },
  { src: "/oquefazemos-Card-Solucoes-Comerciais.webp", alt: "Soluções Comerciais" },
  { src: "/oquefazemos-Acompanhamento.webp", alt: "Acompanhamento" },
  { src: "/oquefazemos-Videos.webp", alt: "Vídeos" },
];

// Each slide = 80% of the container; 10% of each neighbor peeks from the sides.
const SLIDE_W = 80;
const PEEK = 10;
const GAP = 1.5;
const SLOT = SLIDE_W + GAP * 2;

const INTERVAL_MS = 3500;

export default function Services() {
  const [current, setCurrent] = useState(0);
  const total = slides.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => setCurrent((idx + total) % total);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((i) => (i + 1) % total);
    }, INTERVAL_MS);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManual = (fn: () => void) => { fn(); resetTimer(); };

  const translateX = PEEK - current * SLOT;

  return (
    <section aria-label="O que fazemos" data-section="services" style={{ background: "var(--bg)" }} className="py-20 px-4">
      <div className="mx-auto max-w-5xl">
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

        {/* Carousel */}
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current); }}
          onMouseLeave={resetTimer}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out motion-reduce:transition-none"
            style={{ transform: `translateX(${translateX}%)` }}
          >
            {slides.map((slide, idx) => (
              <div
                key={slide.src}
                className="shrink-0 rounded-2xl overflow-hidden transition-opacity duration-500"
                style={{
                  width: `${SLIDE_W}%`,
                  marginInline: `${GAP}%`,
                  opacity: idx === current ? 1 : 0.45,
                }}
                aria-hidden={idx !== current}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  width={900}
                  height={600}
                  className="w-full h-auto object-contain"
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => handleManual(() => goTo(current - 1))}
            aria-label="Slide anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold shadow transition-colors"
            style={{ background: "var(--bg-card)", color: "var(--accent)" }}
          >
            ‹
          </button>
          <button
            onClick={() => handleManual(() => goTo(current + 1))}
            aria-label="Próximo slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold shadow transition-colors"
            style={{ background: "var(--bg-card)", color: "var(--accent)" }}
          >
            ›
          </button>
        </div>

        {/* Dots */}
        <div
          className="mt-6 flex justify-center gap-2"
          role="tablist"
          aria-label="Navegação dos slides"
        >
          {slides.map((slide, idx) => (
            <button
              key={slide.src}
              role="tab"
              aria-selected={idx === current}
              aria-label={`Ir para slide ${idx + 1}: ${slide.alt}`}
              onClick={() => handleManual(() => goTo(idx))}
              className="h-2 rounded-full transition-all duration-200"
              style={{
                width: idx === current ? "1.5rem" : "0.5rem",
                background: idx === current ? "var(--accent)" : "var(--bg-card)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
