"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ScrollFadeProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function ScrollFade({
  children,
  delay = 0,
  className = "",
}: ScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("fade-in-visible");
        } else {
          el.style.transitionDelay = "0ms";
          el.classList.remove("fade-in-visible");
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`fade-in-hidden ${className}`}>
      {children}
    </div>
  );
}
