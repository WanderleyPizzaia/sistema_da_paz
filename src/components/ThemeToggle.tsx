"use client";

import { useSyncExternalStore } from "react";

function observarTema(notificar: () => void) {
  const observer = new MutationObserver(notificar);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function lerTema() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function temaInicial() {
  return "light" as const;
}

// Botão que alterna entre tema claro e escuro. A preferência fica salva
// no navegador; na primeira visita segue o tema do aparelho.
export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const tema = useSyncExternalStore(observarTema, lerTema, temaInicial);

  function alternar() {
    const novo = lerTema() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = novo;
    try {
      localStorage.setItem("tema", novo);
    } catch {}
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
