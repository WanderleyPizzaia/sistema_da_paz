"use client";

import { useEffect, useState } from "react";

// Botão que alterna entre tema claro e escuro. A preferência fica salva
// no navegador; na primeira visita segue o tema do aparelho.
export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const [tema, setTema] = useState<"light" | "dark">("light");

  useEffect(() => {
    const atual = document.documentElement.dataset.theme;
    setTema(atual === "dark" ? "dark" : "light");
  }, []);

  function alternar() {
    const novo = tema === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = novo;
    try {
      localStorage.setItem("tema", novo);
    } catch {}
    setTema(novo);
  }

  return (
    <button
      onClick={alternar}
      aria-label={tema === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className={className}
    >
      {tema === "dark" ? "☀️ Claro" : "🌙 Escuro"}
    </button>
  );
}
