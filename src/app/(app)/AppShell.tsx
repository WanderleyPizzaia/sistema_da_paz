"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { logout } from "@/lib/actions/auth";
import { ROLE_LABEL, type Role } from "@/lib/enums";

type Item = { href: string; label: string; roles?: Role[] };
type Secao = { titulo: string; itens: Item[] };

const SECOES: Secao[] = [
  { titulo: "Objetivos de marketing", itens: [{ href: "/paz365", label: "PAZ365" }, { href: "/postos", label: "Postos / abastecimento" }] },
  {
    titulo: "Gestão",
    itens: [
      { href: "/visao-geral", label: "Visão geral" },
      { href: "/clientes", label: "Clientes", roles: ["ADM", "MARKETING"] },
      { href: "/campanhas", label: "Campanhas e sorteios", roles: ["ADM", "MARKETING"] },
      { href: "/whatsapp", label: "WhatsApp", roles: ["ADM", "MARKETING"] },
    ],
  },
  {
    titulo: "Produção",
    itens: [
      { href: "/designer", label: "Designer", roles: ["ADM", "MARKETING"] },
      { href: "/videos", label: "Vídeos", roles: ["ADM", "MARKETING"] },
      { href: "/estop", label: "E-Stop", roles: ["ADM", "MARKETING"] },
      { href: "/influenciadores", label: "Influenciadores", roles: ["ADM", "MARKETING"] },
    ],
  },
  {
    titulo: "Administração",
    itens: [
      { href: "/operacao", label: "Operação das ações", roles: ["ADM", "MARKETING"] },
      { href: "/usuarios", label: "Usuários e acessos", roles: ["ADM"] },
    ],
  },
];

// Abas da barra inferior (as demais telas ficam no "Mais").
const TAB_HREFS = ["/visao-geral", "/postos", "/clientes", "/campanhas"];

const ic = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const TABS: Item[] = [
  { href: "/visao-geral", label: "Início" },
  { href: "/postos", label: "Postos" },
  { href: "/clientes", label: "Clientes", roles: ["ADM", "MARKETING"] },
  { href: "/campanhas", label: "Campanhas", roles: ["ADM", "MARKETING"] },
];
const TAB_ICONS: Record<string, ReactNode> = {
  "/visao-geral": ic("M3 11l9-8 9 8M5 9v11h14V9"),
  "/postos": ic("M12 21s-7-5.6-7-11a7 7 0 0114 0c0 5.4-7 11-7 11zM12 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"),
  "/clientes": ic("M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"),
  "/campanhas": ic("M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4zM5 4H3v1.5A3.5 3.5 0 007 9M19 4h2v1.5A3.5 3.5 0 0117 9"),
};
const MAIS_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const CHEVRON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default function AppShell({
  nome,
  role,
  children,
}: {
  nome: string;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mais, setMais] = useState(false);
  const tabs = TABS.filter((t) => !t.roles || t.roles.includes(role as Role));

  // Itens do "Mais": tudo que não está na barra inferior, filtrado por perfil.
  const secoesMais = SECOES.map((s) => ({
    titulo: s.titulo,
    itens: s.itens.filter(
      (i) =>
        !TAB_HREFS.includes(i.href) &&
        (!i.roles || i.roles.includes(role as Role)),
    ),
  })).filter((s) => s.itens.length > 0);

  return (
    <div className="lg:flex lg:min-h-screen">
      {/* Barra lateral fixa (só desktop) */}
      <div className="hidden lg:block">
        <Sidebar nome={nome} role={role} />
      </div>

      {/* Conteúdo */}
      <main className="min-h-screen min-w-0 flex-1 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Tab bar inferior (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {tabs.map((t) => {
          const ativo =
            !mais && (pathname === t.href || pathname.startsWith(t.href + "/"));
          return (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => setMais(false)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                ativo ? "text-[var(--paz-red)]" : "text-gray-500"
              }`}
            >
              {TAB_ICONS[t.href]}
              {t.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMais(true)}
          className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
            mais ? "text-[var(--paz-red)]" : "text-gray-500"
          }`}
        >
          {MAIS_ICON}
          Mais
        </button>
      </nav>

      {/* Tela "Mais" — estilo app, sem barra lateral (mobile) */}
      {mais && (
        <div className="fixed inset-0 z-40 flex flex-col bg-[var(--bg)] lg:hidden">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <span className="text-lg font-bold text-gray-900">Menu</span>
            <button
              onClick={() => setMais(false)}
              aria-label="Fechar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4">
            {secoesMais.map((s) => (
              <div key={s.titulo} className="mb-5">
                <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {s.titulo}
                </p>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {s.itens.map((i, idx) => (
                    <Link
                      key={i.href}
                      href={i.href}
                      onClick={() => setMais(false)}
                      className={`flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 ${
                        idx > 0 ? "border-t border-gray-100" : ""
                      }`}
                    >
                      {i.label}
                      <span className="text-gray-400">{CHEVRON}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <footer className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{nome}</p>
              <p className="text-xs text-gray-500">
                {ROLE_LABEL[role as Role] ?? role}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle className="text-sm font-medium text-gray-600" />
              <form action={logout}>
                <button className="text-sm font-medium text-[var(--paz-red)]">
                  Sair
                </button>
              </form>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
