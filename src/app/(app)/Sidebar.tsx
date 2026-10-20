"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { ROLE_LABEL, type Role } from "@/lib/enums";

type Props = { nome: string; role: string; onNavigate?: () => void };

type Item = { href: string; label: string; roles?: Role[] };
type Secao = { titulo: string; itens: Item[] };

const SECOES: Secao[] = [
  {
    titulo: "Objetivos de marketing",
    itens: [
      { href: "/paz365", label: "PAZ365" },
      { href: "/postos", label: "Postos / abastecimento" },
    ],
  },
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

export default function Sidebar({ nome, role, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-screen w-60 shrink-0 flex-col bg-[var(--paz-navy)] text-white">
      <div className="px-5 py-5">
        <span className="text-xl font-black tracking-wide">PAZ</span>
        <p className="mt-0.5 text-[11px] text-white/50">CRM · Rede Paz</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        {SECOES.map((secao) => {
          const itens = secao.itens.filter(
            (i) => !i.roles || i.roles.includes(role as Role),
          );
          if (itens.length === 0) return null;
          return (
            <div key={secao.titulo} className="mb-5">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {secao.titulo}
              </p>
              {itens.map((i) => {
                const ativo =
                  pathname === i.href || pathname.startsWith(i.href + "/");
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={onNavigate}
                    className={`mb-0.5 block rounded-md px-2.5 py-2 text-sm transition ${
                      ativo
                        ? "bg-[var(--paz-red)] font-semibold text-white"
                        : "text-white/75 hover:bg-white/10"
                    }`}
                  >
                    {i.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-3">
        <p className="truncate text-sm font-medium">{nome}</p>
        <p className="mb-2 text-[11px] text-white/50">
          {ROLE_LABEL[role as Role] ?? role}
        </p>
        <form action={logout}>
          <button className="text-xs text-white/60 hover:text-white">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
