"use client";

import Image from "next/image";

export default function ScrollToTop() {
  return (
    <button
      type="button"
      aria-label="Voltar ao topo — Alpha Assessoria"
      onClick={() => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })}
      className="cursor-pointer"
    >
      <Image
        src="/logo-footer.svg"
        alt="Alpha Assessoria"
        width={120}
        height={32}
      />
    </button>
  );
}
