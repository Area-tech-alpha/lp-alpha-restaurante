"use client";

interface CtaButtonProps {
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  "data-cta"?: string;
  children: React.ReactNode;
}

export default function CtaButton({
  href,
  type = "button",
  disabled,
  onClick,
  className = "",
  "data-cta": dataCta,
  children,
}: CtaButtonProps) {
  const base =
    "btn-shimmer inline-flex items-center gap-2 bg-cta hover:bg-cta-hover text-text-on-light font-bold px-6 py-3 rounded-full transition-transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer";

  if (href?.startsWith("#")) {
    const id = href.slice(1);
    return (
      <button
        type="button"
        data-cta={dataCta ?? "cta"}
        onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
        className={`${base} ${className}`}
      >
        {children}
        <span aria-hidden="true">↗</span>
      </button>
    );
  }

  if (href) {
    return (
      <a href={href} data-cta={dataCta ?? "cta"} className={`${base} ${className}`}>
        {children}
        <span aria-hidden="true">↗</span>
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      data-cta={dataCta ?? "cta"}
      className={`${base} ${className}`}
    >
      {children}
      <span aria-hidden="true">↗</span>
    </button>
  );
}
