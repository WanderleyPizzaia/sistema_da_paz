import Link from "next/link";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { mudarStatusPonto } from "@/lib/actions/producao";
import { STATUS_ESTOP, STATUS_ESTOP_INFO, corPrazo } from "@/lib/enums";
import NovoPontoForm from "./NovoPontoForm";

export default async function EStopPage() {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const [pontos, postos, clientesEletricos, pedidos] = await Promise.all([
    prisma.pontoEStop.findMany({
      include: { posto: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.posto.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.cliente.count({ where: { tipoVeiculo: "ELETRICO" } }),
    prisma.pedidoArte.findMany({
      where: { ehEStop: true },
      include: { posto: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  const postosComPonto = new Set(pontos.map((p) => p.postoId)).size;
  const pedidosAbertos = pedidos.filter((p) => p.status !== "ENTREGUE").length;

  return (
    <div className="p-6 lg:p-8">
      {/* Hero verde (carregamento elétrico) */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-6 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl">
            ⚡
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
              Carregamento elétrico
            </p>
            <h1 className="text-2xl font-black leading-tight">E-Stop</h1>
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Pedidos de marketing e pontos de recarga para carros elétricos da Rede
          Paz.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <HeroStat
            titulo="Pontos de recarga"
            valor={pontos.length}
            sub={`em ${postosComPonto} posto(s)`}
          />
          <HeroStat
            titulo="Clientes elétricos"
            valor={clientesEletricos}
            sub="na base"
          />
          <HeroStat
            titulo="Pedidos E-Stop abertos"
            valor={pedidosAbertos}
            sub="artes e vídeos"
          />
          <HeroStat titulo="Recargas no mês" valor="—" sub="sem integração" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pedidos E-Stop */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pedidos E-Stop</h2>
            <Link
              href="/designer"
              className="text-xs font-medium text-green-700 hover:underline"
            >
              + Novo pedido
            </Link>
          </div>
          <p className="mb-4 text-xs text-gray-500">
            Artes seguem o prazo de 24h e aparecem na fila do Designer.
          </p>
          {pedidos.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhum pedido E-Stop ainda. Crie no Designer marcando “É um pedido
              E-Stop”.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {pedidos.map((p) => {
                const prazo = corPrazo(p.prazo);
                return (
                  <li key={p.id} className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          #{p.numero} · {p.acao}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[p.posto?.nome, p.formato]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                      {p.status === "ENTREGUE" ? (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          Entregue
                        </span>
                      ) : (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: prazo.cor }}
                        >
                          {prazo.texto}
                        </span>
                      )}
                    </div>
                    <Link
                      href="/designer"
                      className="mt-1 inline-block text-xs text-green-700 hover:underline"
                    >
                      Ver na fila do Designer →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Pontos de recarga */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 font-semibold text-gray-900">Pontos de recarga</h2>
          <p className="mb-4 text-xs text-gray-500">
            Clientes com carro elétrico viram segmento para disparos.
          </p>

          {pontos.length > 0 && (
            <ul className="mb-5 space-y-3">
              {pontos.map((p) => {
                const info = STATUS_ESTOP_INFO[p.status];
                return (
                  <li
                    key={p.id}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {p.posto?.nome ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[
                            `${p.numCarregadores} carregador(es)`,
                            p.potenciaKw ? `${p.potenciaKw} kW` : null,
                            p.conector,
                            p.horario,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: info?.cor ?? "#6b7280" }}
                      >
                        {info?.label ?? p.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_ESTOP.map((s) => (
                        <form key={s} action={mudarStatusPonto}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="status" value={s} />
                          <button
                            disabled={p.status === s}
                            className={`rounded-md px-2 py-1 text-xs font-medium ${
                              p.status === s
                                ? "bg-gray-200 text-gray-500"
                                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {STATUS_ESTOP_INFO[s].label}
                          </button>
                        </form>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Novo ponto de recarga
            </p>
            <NovoPontoForm postos={postos} />
          </div>
        </section>
      </div>
    </div>
  );
}

function HeroStat({
  titulo,
  valor,
  sub,
}: {
  titulo: string;
  valor: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-3">
      <p className="text-[11px] text-white/70">{titulo}</p>
      <p className="mt-0.5 text-2xl font-bold">{valor}</p>
      <p className="text-[11px] text-white/60">{sub}</p>
    </div>
  );
}
