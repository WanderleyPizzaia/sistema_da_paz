import Link from "next/link";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import {
  TIPO_CAMPANHA_LABEL,
  STATUS_CAMPANHA_INFO,
} from "@/lib/enums";

export default async function CampanhasPage() {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const campanhas = await prisma.campanha.findMany({
    include: { _count: { select: { participacoes: true, postos: true } } },
    orderBy: { criadoEm: "desc" },
  });

  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Campanhas e sorteios
          </h1>
          <p className="text-sm text-gray-500">
            Sorteios, cupons e ofertas. Ligue um QR Code à campanha para medir
            participações.
          </p>
        </div>
        <Link
          href="/campanhas/novo"
          className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)]"
        >
          + Nova campanha
        </Link>
      </div>

      {campanhas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          Nenhuma campanha ainda.{" "}
          <Link
            href="/campanhas/novo"
            className="font-medium text-[var(--paz-navy)] underline"
          >
            Criar a primeira.
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="space-y-2 lg:hidden">
            {campanhas.map((c) => {
              const si = STATUS_CAMPANHA_INFO[c.status];
              return (
                <li key={c.id}>
                  <Link
                    href={`/campanhas/${c.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-gray-900">{c.nome}</span>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: si?.cor ?? "#6b7280" }}
                      >
                        {si?.label ?? c.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {TIPO_CAMPANHA_LABEL[c.tipo] ?? c.tipo}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {fmt(c.inicio)} – {fmt(c.fim)} · {c._count.postos} posto(s)
                      · {c._count.participacoes} participação(ões)
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop: tabela */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Campanha</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium">Postos</th>
                <th className="px-4 py-3 font-medium">Participações</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campanhas.map((c) => {
                const si = STATUS_CAMPANHA_INFO[c.status];
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link
                        href={`/campanhas/${c.id}`}
                        className="hover:text-[var(--paz-navy)] hover:underline"
                      >
                        {c.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {TIPO_CAMPANHA_LABEL[c.tipo] ?? c.tipo}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {fmt(c.inicio)} – {fmt(c.fim)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c._count.postos}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c._count.participacoes}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: si?.cor ?? "#6b7280" }}
                      >
                        {si?.label ?? c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
