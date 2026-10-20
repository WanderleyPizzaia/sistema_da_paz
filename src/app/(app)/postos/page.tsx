import Link from "next/link";
import { requireUser } from "@/lib/session";
import { isAdm, isGerente } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  BANDEIRAS,
  ETAPA_LABEL,
  FAROIS,
  mesRefAtual,
  type Farol,
} from "@/lib/enums";
import FarolBadge from "@/components/FarolBadge";

export default async function PostosPage() {
  const u = await requireUser();
  const mes = mesRefAtual();

  const where = isGerente(u) ? { id: u.postoId ?? "__none__" } : {};
  const postos = await prisma.posto.findMany({
    where,
    include: {
      status: { where: { mesRef: mes } },
      acoes: true,
    },
    orderBy: { nome: "asc" },
  });

  const comFarol = postos.map((p) => ({
    ...p,
    farol: (p.status[0]?.farol as Farol | undefined) ?? null,
    feitas: p.acoes.filter((a) => a.status === "FEITA").length,
  }));

  const contagem = {
    total: comFarol.length,
    precisaAcao: comFarol.filter((p) => p.farol === "VERMELHO").length,
    porFarol: Object.fromEntries(
      FAROIS.map((f) => [f, comFarol.filter((p) => p.farol === f).length]),
    ) as Record<Farol, number>,
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Postos da rede</h1>
          <p className="text-sm text-gray-500">
            Status do mês e ações de marketing de cada posto.
          </p>
        </div>
        {isAdm(u) && (
          <Link
            href="/postos/novo"
            className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)]"
          >
            + Novo posto
          </Link>
        )}
      </div>

      {/* Resumo */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat titulo="Postos" valor={contagem.total} />
        <Stat
          titulo="Verde"
          valor={contagem.porFarol.VERDE}
          cor="#16a34a"
        />
        <Stat
          titulo="Amarelo"
          valor={contagem.porFarol.AMARELO}
          cor="#eab308"
        />
        <Stat
          titulo="Precisa de ação"
          valor={contagem.precisaAcao}
          cor="#dc2626"
        />
      </div>

      {comFarol.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          Nenhum posto cadastrado ainda.
          {isAdm(u) && (
            <>
              {" "}
              <Link
                href="/postos/novo"
                className="font-medium text-[var(--paz-navy)] underline"
              >
                Cadastrar o primeiro.
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {comFarol.map((p) => (
            <Link
              key={p.id}
              href={`/postos/${p.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-[var(--paz-navy)] hover:shadow-sm"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                  <p className="text-xs text-gray-500">
                    {rotuloBandeira(p.bandeira)} ·{" "}
                    {ETAPA_LABEL[p.etapa] ?? p.etapa}
                  </p>
                </div>
                <FarolBadge farol={p.farol} />
              </div>
              {p.endereco && (
                <p className="mb-3 text-sm text-gray-600">{p.endereco}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  {p.feitas}/{p.acoes.length} ações feitas
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function rotuloBandeira(b: string): string {
  return (BANDEIRAS as readonly string[]).includes(b) ? b : b;
}

function Stat({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="text-2xl font-bold" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
    </div>
  );
}
