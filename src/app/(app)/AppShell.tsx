"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

// Casca do CRM: no desktop a barra lateral fica fixa; no celular ela vira
// uma gaveta (menu hambúrguer) com uma barra no topo.
export default function AppShell({
  nome,
  role,
  children,
}: {
  nome: string;
  role: string;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);

  return (
    <div className="lg:flex lg:min-h-screen">
      {/* Overlay escuro no mobile quando a gaveta está aberta */}
      {aberto && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={fechar}
          aria-hidden
        />
      )}

      {/* Barra lateral: gaveta no mobile, fixa no desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar nome={nome} role={role} onNavigate={fechar} />
      </div>

      {/* Coluna de conteúdo */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Barra do topo (só no mobile) */}
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setAberto(true)}
            aria-label="Abrir menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-black tracking-wide text-[var(--paz-navy)]">
            PAZ
          </span>
        </header>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
