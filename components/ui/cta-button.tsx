import Link from "next/link";

interface CtaButtonProps {
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export default function CtaButton({
  href,
  type = "button",
  disabled,
  onClick,
  className = "",
  children,
}: CtaButtonProps) {
  const base =
    "btn-shimmer inline-flex items-center gap-2 bg-cta hover:bg-cta-hover text-text-on-light font-bold px-6 py-3 rounded-full transition-transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer";

  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`}>
        {children}
        <span aria-hidden="true">↗</span>
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${className}`}
    >
      {children}
      <span aria-hidden="true">↗</span>
    </button>
  );
}
