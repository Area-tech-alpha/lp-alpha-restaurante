import type { ReactNode } from "react";

interface FadeInLoadProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function FadeInLoad({ children, delay = 0, className = "" }: FadeInLoadProps) {
  return (
    <div className={`fade-in-load ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
