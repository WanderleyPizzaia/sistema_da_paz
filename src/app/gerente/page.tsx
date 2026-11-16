import Link from "next/link";
import { diaAtualCampanhas } from "@/lib/calendario-campanhas";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { marcarAcaoFeita } from "@/lib/actions/gerente";

export default async function GerenteAcoesPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const u = await getSession();
  if (!u || !u.postoId) redirect("/login");

  const mensal = (await searchParams).periodo === "mes";
  const hoje = diaAtualCampanhas();
  const ano = hoje.getUTCFullYear();
  const mes = hoje.getUTCMonth();
  const segunda = hoje.getUTCDate() - (hoje.getUTCDay() + 6) % 7;
  const inicio = new Date(Date.UTC(ano, mes, mensal ? 1 : segunda));
  const fim = mensal ? new Date(Date.UTC(ano, mes + 1, 1)) : new Date(Date.UTC(ano, mes, segunda + 7));

  const acoes = await prisma.acaoMarketing.findMany({
    where: { postoId: u.postoId, OR: [{ data: null }, { data: { gte: inicio, lt: fim } }] },
    orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
  });

  const pendentes = acoes.filter((a) => a.status !== "FEITA");

  return (
    <div className="p-4">
      <section className="mb-4 rounded-2xl bg-gradient-to-br from-[#344197] to-[#1d245e] p-4 text-white">
        <h1 className="text-2xl font-bold">Ações locais</h1>
        <p className="mt-1 text-sm text-blue-100">{pendentes.length} pendente(s) · {acoes.length - pendentes.length} concluída(s)</p>
        <nav aria-label="Período das ações" className="mt-3 flex gap-2">
          <Link href="/gerente?periodo=semana" aria-current={!mensal ? "true" : undefined} className={`rounded-lg px-3 py-2 text-xs font-semibold ${!mensal ? "bg-white !text-[#304299]" : "bg-white/10 !text-white"}`}>Esta semana</Link>
          <Link href="/gerente?periodo=mes" aria-current={mensal ? "true" : undefined} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mensal ? "bg-white !text-[#304299]" : "bg-white/10 !text-white"}`}>Este mês</Link>
        </nav>
      </section>

      {acoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          Nenhuma ação para o seu posto agora.
        </div>
      ) : (
        <ul className="space-y-3">
          {acoes.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <p className="font-medium text-gray-900">{a.titulo}</p>
              <p className="text-xs text-gray-500">
                {[
                  a.tipo,
                  a.data ? new Date(a.data).toLocaleDateString("pt-BR") : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Sem data"}
              </p>

              {a.status === "FEITA" ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                    Feita ✓
                  </span>
                  {a.fotoEnviada && (
                    <span className="text-xs text-gray-400">
                      {a.fotoAprovada ? "Foto aprovada" : "Foto enviada"}
                    </span>
                  )}
                </div>
              ) : (
                <form action={marcarAcaoFeita} className="mt-3">
                  <input type="hidden" name="id" value={a.id} />
                  <button className="w-full rounded-lg bg-[var(--paz-red)] py-2.5 text-sm font-semibold text-white">
                    📷 Tirar foto e marcar como feita
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-center text-[11px] text-gray-400">
        No modo local a foto é simulada. No app real, a câmera abre e a foto
        sobe (com fila offline).
      </p>
    </div>
  );
}
