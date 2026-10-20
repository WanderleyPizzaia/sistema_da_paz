import Link from "next/link";
import { requireUser } from "@/lib/session";
import {
  podeVerClientes,
  podeEditarClientes,
  podeOperarMarketing,
} from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { TIPOS_VEICULO, VEICULO_LABEL } from "@/lib/enums";

type Busca = { q?: string; veiculo?: string; posto?: string };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<Busca>;
}) {
  const u = await requireUser();
  if (!podeVerClientes(u)) return <SemAcesso />;

  const { q, veiculo, posto } = await searchParams;
  const podeEditar = podeEditarClientes(u);
  const podeDisparar = podeOperarMarketing(u);
  const filtroQuery = new URLSearchParams(
    Object.entries({ q, veiculo, posto }).filter(([, v]) => v) as [
      string,
      string,
    ][],
  ).toString();

  const where = {
    AND: [
      q
        ? {
            OR: [
              { nome: { contains: q } },
              { whatsapp: { contains: q.replace(/\D/g, "") || q } },
            ],
          }
        : {},
      veiculo ? { tipoVeiculo: veiculo } : {},
      posto ? { postoPreferidoId: posto } : {},
    ],
  };

  const [clientes, postos, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: {
        postoPreferido: { select: { nome: true } },
        _count: { select: { eventos: true } },
        eventos: { orderBy: { criadoEm: "desc" }, take: 1 },
      },
      orderBy: { criadoEm: "desc" },
      take: 200,
    }),
    prisma.posto.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.cliente.count(),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">
            {total} na base · captados pelo QR Code ou cadastrados à mão.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {podeDisparar && (
            <Link
              href={`/clientes/disparo${filtroQuery ? `?${filtroQuery}` : ""}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Enviar WhatsApp em massa
            </Link>
          )}
          {podeEditar && (
            <Link
              href="/clientes/novo"
              className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)]"
            >
              + Novo cliente
            </Link>
          )}
        </div>
      </div>

      {/* Filtros */}
      <form className="mb-4 flex flex-wrap gap-2" action="/clientes">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou WhatsApp"
          className="min-w-52 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--paz-navy)]"
        />
        <select
          name="veiculo"
          defaultValue={veiculo ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600"
        >
          <option value="">Todos os veículos</option>
          {TIPOS_VEICULO.map((v) => (
            <option key={v} value={v}>
              {VEICULO_LABEL[v]}
            </option>
          ))}
        </select>
        <select
          name="posto"
          defaultValue={posto ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600"
        >
          <option value="">Todos os postos</option>
          {postos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-[var(--paz-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-navy-700)]">
          Filtrar
        </button>
        {(q || veiculo || posto) && (
          <Link
            href="/clientes"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Limpar
          </Link>
        )}
      </form>

      {clientes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="space-y-2 lg:hidden">
            {clientes.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-gray-900">{c.nome}</span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {c._count.eventos} visita(s)
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">{c.whatsapp}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {[
                      c.postoPreferido?.nome,
                      c.tipoVeiculo ? VEICULO_LABEL[c.tipoVeiculo] : null,
                      c.origem,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: tabela */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Posto preferido</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Veículo</th>
                  <th className="px-4 py-3 font-medium">Visitas</th>
                  <th className="px-4 py-3 font-medium">Última</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="hover:text-[var(--paz-navy)] hover:underline"
                      >
                        {c.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.whatsapp}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.postoPreferido?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.origem ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.tipoVeiculo ? (VEICULO_LABEL[c.tipoVeiculo] ?? "—") : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c._count.eventos}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.eventos[0]
                        ? new Date(c.eventos[0].criadoEm).toLocaleDateString(
                            "pt-BR",
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
