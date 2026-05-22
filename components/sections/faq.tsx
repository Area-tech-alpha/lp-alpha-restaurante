"use client";

import { useState } from "react";
import { content } from "@/lib/content";

const { faq } = content;

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  const panelId = `faq-panel-${index}`;
  const headingId = `faq-heading-${index}`;

  return (
    <div className="border-b" style={{ borderColor: "var(--bg-card)" }}>
      <h3 id={headingId}>
        <button
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center gap-4 py-5 text-left"
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
            aria-hidden="true"
          >
            ?
          </span>
          <span
            className="flex-1 text-base font-semibold uppercase sm:text-lg"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}
          >
            {question}
          </span>
          <span
            className="ml-2 text-xl transition-transform duration-200 motion-reduce:transition-none"
            style={{
              color: "var(--accent)",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
            aria-hidden="true"
          >
            ↓
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        className="grid overflow-hidden transition-[grid-template-rows] duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="min-h-0">
          <p className="pb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section aria-label="Perguntas frequentes" data-section="faq" style={{ background: "var(--bg)" }} className="py-20 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2
              className="text-4xl font-bold uppercase sm:text-5xl"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}
            >
              {faq.title}
            </h2>
            <p className="mt-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {faq.subtitle}
            </p>
          </div>

          <div>
            {faq.items.map((item, i) => (
              <FaqItem
                key={i}
                index={i}
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === i}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
