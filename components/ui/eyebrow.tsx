export default function Eyebrow({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[.06em] text-lp-gold-2 ${
        center ? "justify-center" : ""
      }`}
    >
      {!center && (
        <span aria-hidden="true" className="h-0.5 w-[22px] rounded-sm bg-lp-gold-2" />
      )}
      {children}
    </span>
  );
}
