import type { Metadata } from "next";
import ObrigadoContent from "@/components/obrigado-content";

export const metadata: Metadata = {
  title: "Cadastro Concluído — Assessoria Alpha",
  description: "Recebemos seu contato. Em breve nosso time entrará em contato.",
  robots: { index: false, follow: false },
};

export default function ObrigadoBPage() {
  return <ObrigadoContent />;
}
