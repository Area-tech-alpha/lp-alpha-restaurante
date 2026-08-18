"use client";

import { useEffect, useRef, useState } from "react";
import LpCtaButton from "@/components/ui/lp-cta-button";
import { content } from "@/lib/content";

export default function StickyCta() {
  const [visible, setVisible] = useState(false);
  const formRef = useRef<Element | null>(null);

  useEffect(() => {
    formRef.current = document.getElementById("contato");
    if (!formRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(formRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-3 bottom-3.5 z-[900] flex justify-center transition-all duration-300 sm:inset-x-auto sm:right-6 sm:justify-end md:right-6 ${
        visible ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <LpCtaButton
        data-cta="sticky-cta"
        className="w-full max-w-sm shadow-[0_16px_40px_-8px_rgba(245,166,35,0.5)] sm:w-auto"
      >
        {content.floatCta.cta}
      </LpCtaButton>
    </div>
  );
}
