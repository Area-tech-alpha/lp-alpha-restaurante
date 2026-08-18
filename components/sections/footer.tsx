import Image from "next/image";
import { content } from "@/lib/content";

export default function Footer() {
  const { footer } = content;

  return (
    <footer aria-label="Rodapé" className="bg-lp-ink py-[50px] pb-[26px] text-center text-white/60">
      <div className="mx-auto max-w-[1180px] px-6">
        <a href="https://assessorialpha.com" className="mx-auto mb-3.5 block w-fit">
          <Image
            src="/logo-alpha-footer.png"
            alt={footer.logoAlt}
            width={764}
            height={247}
            className="h-[30px] w-auto brightness-0 invert"
          />
        </a>
        <p className="text-[12.5px]">
          {new Date().getFullYear()} © {footer.copyright}
        </p>
      </div>
    </footer>
  );
}
