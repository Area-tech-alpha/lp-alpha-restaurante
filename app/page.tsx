import Hero from "@/components/sections/hero";
import Marquee from "@/components/sections/marquee";
import FormSection from "@/components/sections/form-section";
import Testimonials from "@/components/sections/testimonials";
import About from "@/components/sections/about";
import Method from "@/components/sections/method";
import Services from "@/components/sections/services";
import Plans from "@/components/sections/plans";
import TeamCta from "@/components/sections/team-cta";
import Faq from "@/components/sections/faq";
import Footer from "@/components/sections/footer";
import Tracker from "@/components/analytics/tracker";
import StickyCta from "@/components/ui/sticky-cta";

export default function Home() {
  return (
    <main>
      <Tracker />
      <StickyCta />
      <Hero />
      <Marquee />
      <FormSection />
      <Testimonials />
      <About />
      <Method />
      <Services />
      <Plans />
      <TeamCta />
      <Faq />
      <Footer />
    </main>
  );
}
