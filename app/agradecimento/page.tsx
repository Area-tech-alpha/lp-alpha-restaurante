import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PixelEvent } from "@/components/pixel-event";

export const metadata: Metadata = {
  title: "Agradecimento — Assessoria Alpha",
  description: "Obrigado pelo interesse na Assessoria Alpha.",
  robots: { index: false, follow: false },
};

export default function AgradecimentoPage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-6 py-16">
      <PixelEvent event="Lead" />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left — content */}
        <div className="space-y-6">
          <span className="inline-block bg-accent text-bg text-xs font-heading font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full">
            Assessoria Alpha
          </span>

          <h1 className="font-display text-4xl md:text-5xl text-text font-bold leading-tight">
            Obrigado pelo<br />interesse!
          </h1>

          <p className="text-text-muted font-body text-base leading-relaxed max-w-sm">
            Analisamos cada perfil com cuidado. Se houver uma oportunidade de
            parceria, entraremos em contato com você em breve.
          </p>

          <p className="text-accent font-body font-semibold text-base leading-relaxed">
            Enquanto isso, acompanhe nosso conteúdo<br />
            e fique por dentro das novidades.
          </p>

          <div className="flex items-center gap-3 pt-1">
            <Link
              href="https://www.youtube.com/@assessorialpha"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube da Assessoria Alpha"
              className="flex items-center justify-center w-11 h-11 rounded-md bg-white/10 hover:bg-accent hover:text-bg transition-colors text-text"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </Link>

            <Link
              href="https://www.instagram.com/assessorialpha/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da Assessoria Alpha"
              className="flex items-center justify-center w-11 h-11 rounded-md bg-white/10 hover:bg-accent hover:text-bg transition-colors text-text"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </Link>
          </div>

          <Link
            href="/"
            className="inline-block text-sm text-text-muted underline underline-offset-4 hover:text-text transition-colors"
          >
            Voltar ao início
          </Link>
        </div>

        {/* Right — logo card */}
        <div className="flex justify-center md:justify-end">
          <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-2xl bg-[#1e1e1e] border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
            {/* Subtle radial glow */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, #f5a623 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />
            <Image
              src="/logo-footer.svg"
              alt="Alpha Assessoria"
              width={200}
              height={54}
              priority
              className="relative z-10"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
