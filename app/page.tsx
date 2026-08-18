import { FaqJsonLd } from "@/components/json-ld";
import Hero from "@/components/sections/hero";
import Testimonials from "@/components/sections/testimonials";
import Entregaveis from "@/components/sections/entregaveis";
import Faq from "@/components/sections/faq";
import CtaFinal from "@/components/sections/cta-final";
import Footer from "@/components/sections/footer";
import Tracker from "@/components/analytics/tracker";
import StickyCta from "@/components/ui/sticky-cta";

export default function Home() {
  return (
    <main>
      <Tracker />
      <StickyCta />
      <Hero />
      <Testimonials />
      <Entregaveis />
      <Faq />
      <CtaFinal />
      <Footer />
      <FaqJsonLd />
    </main>
  );
}
