"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import type { Role } from "@/lib/enums";

type Tab = {
  href: string;
  label: string;
  icon: ReactNode;
  roles?: Role[];
};

const ic = (d: string) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const TABS: Tab[] = [
  { href: "/visao-geral", label: "Início", icon: ic("M3 11l9-8 9 8M5 9v11h14V9") },
  {
    href: "/postos",
    label: "Postos",
    icon: ic("M12 21s-7-5.6-7-11a7 7 0 0114 0c0 5.4-7 11-7 11zM12 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: ic("M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"),
    roles: ["ADM", "MARKETING"],
  },
  {
    href: "/campanhas",
    label: "Campanhas",
    icon: ic("M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4zM5 4H3v1.5A3.5 3.5 0 007 9M19 4h2v1.5A3.5 3.5 0 0117 9"),
    roles: ["ADM", "MARKETING"],
  },
];

const MAIS_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
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

  return (
    <div className="lg:flex lg:min-h-screen">
      {/* Barra lateral fixa (desktop) */}
      <div className="hidden lg:block">
        <Sidebar nome={nome} role={role} />
      </div>

      {/* Conteúdo (espaço embaixo p/ a tab bar no mobile) */}
      <main className="min-h-screen min-w-0 flex-1 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Tab bar inferior (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {tabs.map((t) => {
          const ativo =
            pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => setMais(false)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                ativo ? "text-[var(--paz-red)]" : "text-gray-500"
              }`}
            >
              {t.icon}
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

      {/* Painel "Mais" (mobile) */}
      {mais && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMais(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar nome={nome} role={role} onNavigate={() => setMais(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
