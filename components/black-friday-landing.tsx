import BlackFridayHero from "@/components/sections/black-friday-hero";
import BlackFridayAlexandre from "@/components/sections/black-friday-alexandre";
import BlackFridayCardapio from "@/components/sections/black-friday-cardapio";
import BlackFridayDepoimentos from "@/components/sections/black-friday-depoimentos";
import BlackFridayFechamento from "@/components/sections/black-friday-fechamento";
import Footer from "@/components/sections/footer";
import Tracker from "@/components/analytics/tracker";
import Clarity from "@/components/analytics/clarity";
import CountdownBar from "@/components/ui/countdown-bar";
import type { Theme } from "@/lib/variants";

// Composição das variações com layout "black-friday" (lp-11). O chapéu vai como
// rótulo do cronômetro fixo no topo, para o form caber na primeira tela do celular.
export default function BlackFridayLanding({
  variant,
  theme,
  countdown,
}: {
  variant: string;
  theme: Theme;
  countdown: { label: string; endsAt?: string };
}) {
  return (
    <div data-theme={theme} className="bg-lp-off">
      <CountdownBar label={countdown.label} endsAt={countdown.endsAt} />
      <main>
        <Tracker variant={variant} />
        <Clarity />
        <BlackFridayHero variant={variant} />
        <BlackFridayAlexandre />
        <BlackFridayCardapio />
        <BlackFridayDepoimentos />
        <BlackFridayFechamento />
      </main>
      <Footer />
    </div>
  );
}
