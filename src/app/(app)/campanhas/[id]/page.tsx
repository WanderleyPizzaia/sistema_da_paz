import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { definirStatusCampanha, sortear } from "@/lib/actions/campanhas";
import {
  TIPO_CAMPANHA_LABEL,
  STATUS_CAMPANHA_INFO,
} from "@/lib/enums";

export default async function CampanhaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const campanha = await prisma.campanha.findUnique({
    where: { id },
    include: {
      postos: { select: { id: true, nome: true } },
      participacoes: {
        include: { cliente: { select: { nome: true, whatsapp: true } } },
        orderBy: { criadoEm: "asc" },
      },
    },
  });
  if (!campanha) notFound();

  const si = STATUS_CAMPANHA_INFO[campanha.status];
  const ehSorteio = campanha.tipo === "SORTEIO";
  const ganhadora = campanha.participacoes.find(
    (p) => p.id === campanha.ganhadorParticipacaoId,
  );
  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/campanhas"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Campanhas
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{campanha.nome}</h1>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: si?.cor ?? "#6b7280" }}
          >
            {si?.label ?? campanha.status}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          {TIPO_CAMPANHA_LABEL[campanha.tipo] ?? campanha.tipo}
          {campanha.premio ? ` · ${campanha.premio}` : ""} · {fmt(campanha.inicio)}{" "}
          – {fmt(campanha.fim)}
        </p>
      </div>

      {/* Status */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Mudar status:</span>
        {(["RASCUNHO", "ATIVA", "ENCERRADA"] as const).map((s) => (
          <form key={s} action={definirStatusCampanha}>
            <input type="hidden" name="id" value={campanha.id} />
            <input type="hidden" name="status" value={s} />
            <button
              disabled={campanha.status === s}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                campanha.status === s
                  ? "bg-gray-200 text-gray-500"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {STATUS_CAMPANHA_INFO[s].label}
            </button>
          </form>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Postos participantes */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">
            Postos participantes
          </h2>
          {campanha.postos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum posto vinculado.</p>
          ) : (
            <ul className="space-y-1 text-sm text-gray-700">
              {campanha.postos.map((p) => (
                <li key={p.id}>{p.nome}</li>
              ))}
            </ul>
          )}
        </section>

        {/* Sorteio */}
        {ehSorteio && (
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Sorteio</h2>
            {ganhadora ? (
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-xs text-green-700">Ganhador</p>
                <p className="text-lg font-bold text-green-900">
                  {ganhadora.cliente.nome}
                </p>
                <p className="text-sm text-green-700">
                  Nº {ganhadora.numeroSorte} · {ganhadora.cliente.whatsapp}
                </p>
              </div>
            ) : (
              <p className="mb-3 text-sm text-gray-500">
                {campanha.participacoes.length} participações. Sorteie um
                ganhador aleatório.
              </p>
            )}
            {campanha.participacoes.length > 0 && (
              <form action={sortear} className="mt-3">
                <input type="hidden" name="id" value={campanha.id} />
                <button className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)]">
                  {ganhadora ? "Sortear de novo" : "Sortear ganhador"}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Participações */}
        <section
          className={`rounded-xl border border-gray-200 bg-white p-5 ${
            ehSorteio ? "" : "lg:col-span-2"
          }`}
        >
          <h2 className="mb-3 font-semibold text-gray-900">
            Participações ({campanha.participacoes.length})
          </h2>
          {campanha.participacoes.length === 0 ? (
            <p className="text-sm text-gray-500">
              Ninguém participou ainda. Gere um QR Code ligado a esta campanha.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {campanha.participacoes.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-gray-900">
                      {p.cliente.nome}
                    </span>
                    <span className="ml-2 text-gray-400">
                      {p.cliente.whatsapp}
                    </span>
                  </div>
                  <span className="font-mono text-gray-600">
                    {p.numeroSorte}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
