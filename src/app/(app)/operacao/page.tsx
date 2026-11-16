import Link from "next/link";
import { diaAtualCampanhas } from "@/lib/calendario-campanhas";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { aprovarFoto, pedirRefazer, cobrarPosto } from "@/lib/actions/gerente";

type Acao = {
  id: string;
  status: string;
  data: Date | null;
  fotoEnviada: boolean;
  fotoAprovada: boolean;
};

function statusPosto(acoes: Acao[]): { label: string; cor: string } {
  if (acoes.length === 0) return { label: "Sem ações", cor: "#9ca3af" };
  const feitas = acoes.filter((a) => a.status === "FEITA" && a.fotoEnviada).length;
  const atrasadas = acoes.filter(
    (a) => !(a.status === "FEITA" && a.fotoEnviada) && a.data && new Date(a.data) < new Date(),
  ).length;
  if (feitas === acoes.length) return { label: "Funcionando", cor: "#16a34a" };
  if (atrasadas > 0) return { label: "Atrasado", cor: "#dc2626" };
  return { label: "Sem retorno", cor: "#eab308" };
}

export default async function OperacaoPage({ searchParams }: { searchParams: Promise<{ periodo?: string; status?: string }> }) {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const { periodo, status } = await searchParams;
  const mensal = periodo === "mes";
  const hoje = diaAtualCampanhas();
  const ano = hoje.getUTCFullYear();
  const mes = hoje.getUTCMonth();
  const segunda = hoje.getUTCDate() - (hoje.getUTCDay() + 6) % 7;
  const inicio = new Date(Date.UTC(ano, mes, mensal ? 1 : segunda));
  const fim = mensal ? new Date(Date.UTC(ano, mes + 1, 1)) : new Date(Date.UTC(ano, mes, segunda + 7));
  const href = (periodo: string, status?: string) => "/operacao?" + new URLSearchParams(status ? { periodo, status } : { periodo });
  const postos = await prisma.posto.findMany({
    include: { acoes: { where: { data: { gte: inicio, lt: fim } } } },
    orderBy: { nome: "asc" },
  });

  const todas = postos.flatMap((p) => p.acoes);
  const totalAcoes = todas.length;
  const feitasComFoto = todas.filter(
    (a) => a.status === "FEITA" && a.fotoEnviada,
  ).length;
  const pct = totalAcoes ? Math.round((feitasComFoto / totalAcoes) * 100) : 0;
  const atrasadas = todas.filter(
    (a) => !(a.status === "FEITA" && a.fotoEnviada) && a.data && new Date(a.data) < new Date(),
  ).length;
  const semRetorno = postos.filter(
    (p) => statusPosto(p.acoes).label === "Sem retorno",
  ).length;

  const aguardandoAprovacao = postos.flatMap((p) =>
    p.acoes
      .filter((a) => a.status === "FEITA" && a.fotoEnviada && !a.fotoAprovada)
      .map((a) => ({ ...a, postoNome: p.nome })),
  );

  const visiveis = postos.filter((posto) => !status || statusPosto(posto.acoes).label === status);

  return (
    <div className="min-h-screen bg-[#f4f5fa] p-5 lg:p-8">
      <div className="max-w-[1176px]">
      <h1 className="mb-4 text-xl font-bold">Operação das ações locais</h1>
      <section className="mb-5 rounded-[20px] bg-gradient-to-br from-[#344197] to-[#1d245e] p-6 text-white shadow-[0_14px_32px_#293d8d40]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-3xl font-semibold">As ações locais estão rodando?</h2><p className="mt-1 text-sm text-blue-100">Acompanhe a execução e as fotos enviadas pelos postos.</p></div>
          <nav aria-label="Período" className="flex gap-2">
            <Link href={href("semana", status)} aria-current={!mensal ? "true" : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold ${!mensal ? "bg-white !text-[#304299]" : "bg-white/10 !text-white"}`}>Esta semana</Link>
            <Link href={href("mes", status)} aria-current={mensal ? "true" : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mensal ? "bg-white !text-[#304299]" : "bg-white/10 !text-white"}`}>Este mês</Link>
          </nav>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat titulo="Concluídas com foto" valor={`${pct}%`} />
          <Stat titulo="Ações atrasadas" valor={atrasadas} />
          <Stat titulo="Postos sem retorno" valor={semRetorno} />
          <Stat titulo="Postos" valor={postos.length} />
        </div>
      </section>
      <nav aria-label="Status dos postos" className="mb-4 flex flex-wrap gap-2">
        {["", "Funcionando", "Atrasado", "Sem retorno"].map((item) => <Link key={item} href={href(mensal ? "mes" : "semana", item)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${(status ?? "") === item ? "bg-[#304299] !text-white" : "bg-white"}`}>{item || "Todos"}</Link>)}
      </nav>
      {!visiveis.length && <p className="mb-4 rounded-xl border bg-white p-4 text-sm">Nenhum posto neste filtro.</p>}
      {/* Por posto */}
      {/* Mobile: cards */}
      <ul className="mb-6 space-y-2 lg:hidden">
        {visiveis.map((p) => {
          const sp = statusPosto(p.acoes);
          const feitas = p.acoes.filter((a) => a.status === "FEITA").length;
          const fotos = p.acoes.filter((a) => a.fotoEnviada).length;
          const precisaCobrar =
            sp.label === "Sem retorno" || sp.label === "Atrasado";
          return (
            <li
              key={p.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-gray-900">{p.nome}</span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: sp.cor }}
                >
                  {sp.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {feitas}/{p.acoes.length} ações feitas · {fotos} foto(s)
              </p>
              {precisaCobrar && (
                <form action={cobrarPosto} className="mt-2">
                  <input type="hidden" name="postoId" value={p.id} />
                  <button className="text-xs font-medium text-[var(--paz-navy)] hover:underline">
                    Cobrar no WhatsApp
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {/* Desktop: tabela */}
      <div className="mb-6 hidden overflow-x-auto rounded-xl border border-gray-200 bg-white lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Posto</th>
              <th className="px-4 py-3 font-medium">Ações feitas</th>
              <th className="px-4 py-3 font-medium">Fotos</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visiveis.map((p) => {
              const sp = statusPosto(p.acoes);
              const feitas = p.acoes.filter((a) => a.status === "FEITA").length;
              const fotos = p.acoes.filter((a) => a.fotoEnviada).length;
              const precisaCobrar =
                sp.label === "Sem retorno" || sp.label === "Atrasado";
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.nome}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {feitas}/{p.acoes.length}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fotos}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: sp.cor }}
                    >
                      {sp.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {precisaCobrar && (
                      <form action={cobrarPosto}>
                        <input type="hidden" name="postoId" value={p.id} />
                        <button className="text-xs font-medium text-[var(--paz-navy)] hover:underline">
                          Cobrar no WhatsApp
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Fotos aguardando aprovação */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">
          Fotos aguardando aprovação
        </h2>
        {aguardandoAprovacao.length === 0 ? (
          <p className="text-sm text-gray-500">Nada para aprovar agora.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {aguardandoAprovacao.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {a.titulo}
                  </p>
                  <p className="text-xs text-gray-500">{a.postoNome}</p>
                </div>
                <div className="flex gap-2">
                  <form action={aprovarFoto}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
                      Aprovar foto
                    </button>
                  </form>
                  <form action={pedirRefazer}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      Pedir para refazer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}

function Stat({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string | number;
  cor?: string;
}) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
      <p className="text-xs text-blue-100">{titulo}</p>
      <p className="text-2xl font-bold" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
    </div>
  );
}
