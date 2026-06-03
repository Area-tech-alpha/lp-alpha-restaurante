import type { Metadata } from "next";
import Image from "next/image";
import { PixelEvent } from "@/components/pixel-event";
import YoutubePlayer from "@/components/ui/youtube-player";

export const metadata: Metadata = {
  title: "Cadastro Concluído — Assessoria Alpha",
  description: "Recebemos seu contato. Em breve nosso time entrará em contato.",
  robots: { index: false, follow: false },
};

const VIDEO_ID = "Bp27LBpMAck";

export default function ObrigadoPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <PixelEvent event="Lead" />

      {/* Header */}
      <header className="px-6 py-6 border-b border-white/10 flex justify-center">
        <Image
          src="/logo-footer.svg"
          alt="Alpha Assessoria"
          width={160}
          height={42}
          priority
        />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-3xl space-y-8">
          <h1 className="font-heading font-bold text-4xl md:text-5xl leading-tight">
            Cadastro{" "}
            <span className="text-accent">Concluído!</span>
          </h1>

          <p className="text-text-muted font-body text-lg leading-relaxed max-w-2xl mx-auto">
            Nos próximos minutos, o nosso time de especialistas entrará em contato
            com você para entender melhor o seu negócio e saber se realmente
            podemos te ajudar a acelerar suas vendas. Por enquanto conheça nossa
            assessoria, através do vídeo abaixo:
          </p>

          <hr className="border-accent/40" />

          {/* YouTube facade */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-xl">
            <YoutubePlayer
              videoId={VIDEO_ID}
              title="Saiba Como Funciona a Alpha Assessoria"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 text-center">
        <p className="text-text-muted text-sm">
          2024 © Assessoria Alpha. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
