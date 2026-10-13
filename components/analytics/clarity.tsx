import Script from "next/script";
import { CLARITY_PROJECT_ID } from "@/lib/clarity";

// Fica fora do layout raiz de propósito: o /dashboard exibe dados de leads e
// não pode ser gravado. Inclua só nas páginas públicas da LP.
export default function Clarity() {
  if (!CLARITY_PROJECT_ID) return null;

  return (
    <Script
      id="clarity"
      // lazyOnload protege o Lighthouse; o Clarity tira snapshot do DOM ao
      // carregar, então só se perde o primeiro ~1-2s da sessão.
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", ${JSON.stringify(CLARITY_PROJECT_ID)});
          try {
            var sid = sessionStorage.getItem("alpha_sid");
            if (sid) clarity("identify", sid);
          } catch (e) {}
        `,
      }}
    />
  );
}
