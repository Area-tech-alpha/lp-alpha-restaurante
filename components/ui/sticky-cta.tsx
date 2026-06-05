"use client";

import { useEffect, useRef, useState } from "react";
import CtaButton from "@/components/ui/cta-button";

export default function StickyCta() {
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<Element | null>(null);

  useEffect(() => {
    heroRef.current = document.querySelector("[data-section='hero']");
    if (!heroRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-center px-4 py-3 bg-bg/95 backdrop-blur-sm border-t border-white/10"
    >
      <CtaButton
        href="#formulario"
        data-cta="sticky-cta"
        className="w-full max-w-sm justify-center text-sm"
      >
        Quero mais informações
      </CtaButton>
    </div>
  );
}
