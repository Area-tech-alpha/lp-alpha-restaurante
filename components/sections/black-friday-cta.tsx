import LpCtaButton from "@/components/ui/lp-cta-button";

// CTA único da LP: toda seção rola até o form da primeira dobra e foca o primeiro campo.
export default function BlackFridayCta({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <div className="mt-10 flex justify-center">
      <LpCtaButton
        href="#formulario"
        focusId="nome"
        data-cta={`bf-${id}`}
        className="w-full max-w-[460px] text-center uppercase sm:w-auto"
      >
        {children}
      </LpCtaButton>
    </div>
  );
}
