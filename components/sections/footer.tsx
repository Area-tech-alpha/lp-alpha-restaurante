import Image from "next/image";
import Link from "next/link";
import { content } from "@/lib/content";

function IconInstagram() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconTiktok() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07Z" />
    </svg>
  );
}

function IconLinkedin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function Footer() {
  const { copyright, socials } = content.footer;

  return (
    <footer aria-label="Rodapé" className="bg-bg border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">

          {/* Logo */}
          <Link href="#hero" aria-label="Voltar ao topo — Alpha Assessoria">
            <Image
              src="/logo-footer.svg"
              alt="Alpha Assessoria"
              width={120}
              height={32}
            />
          </Link>

          {/* Social icons */}
          <nav aria-label="Redes sociais">
            <ul className="flex items-center gap-5 list-none p-0 m-0">
              <li>
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram da Alpha Assessoria"
                  className="text-text-muted hover:text-accent transition-colors"
                >
                  <IconInstagram />
                </a>
              </li>
              {socials.tiktok && (
                <li>
                  <a
                    href={socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok da Alpha Assessoria"
                    className="text-text-muted hover:text-accent transition-colors"
                  >
                    <IconTiktok />
                  </a>
                </li>
              )}
              <li>
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn da Alpha Assessoria"
                  className="text-text-muted hover:text-accent transition-colors"
                >
                  <IconLinkedin />
                </a>
              </li>
            </ul>
          </nav>

          {/* Copyright */}
          <p className="text-text-muted text-sm text-center sm:text-right">
            {copyright}
          </p>

        </div>
      </div>
    </footer>
  );
}
