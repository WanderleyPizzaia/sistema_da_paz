"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/gerente", label: "Ações locais", icon: "✓" },
  { href: "/gerente/pedidos", label: "Pedidos", icon: "✎" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-10 grid grid-cols-2 border-t border-gray-200 bg-white">
      {TABS.map((t) => {
        const ativo = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center gap-0.5 py-3 text-xs font-medium ${
              ativo ? "text-[var(--paz-red)]" : "text-gray-500"
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
