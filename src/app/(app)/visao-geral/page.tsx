import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  mesRefAtual,
  formatBRL,
  FAROL_INFO,
  type Farol,
} from "@/lib/enums";

export default async function VisaoGeralPage() {
  const u = await requireUser();
  const mes = mesRefAtual();

  const [
    postos,
    totalClientes,
    comOptIn,
    cadastros,
    participacoes,
    campanhasAtivas,
    pedidosAbertos,
    pedidosAtrasados,
    videosProducao,
    metricas,
  ] = await Promise.all([
    prisma.posto.findMany({
      include: { status: { where: { mesRef: mes } } },
    }),
    prisma.cliente.count(),
    prisma.cliente.count({
      where: {
        consentimentos: {
          some: { finalidade: "MARKETING_WHATSAPP", aceito: true },
        },
      },
    }),
    prisma.eventoCliente.count({ where: { tipo: "CADASTRO" } }),
    prisma.participacao.count(),
    prisma.campanha.count({ where: { status: "ATIVA" } }),
    prisma.pedidoArte.count({ where: { status: { not: "ENTREGUE" } } }),
    prisma.pedidoArte.count({
      where: { status: { not: "ENTREGUE" }, prazo: { lt: new Date() } },
    }),
    prisma.video.count({ where: { etapa: { not: "PUBLICADO" } } }),
    prisma.metricaPosto.findMany({ where: { mes } }),
  ]);

  const porFarol = (f: Farol) =>
    postos.filter((p) => (p.status[0]?.farol as Farol) === f).length;
  const vendasRede = metricas.reduce((s, m) => s + m.vendas, 0);
  const ticketMedio =
    metricas.length > 0
      ? metricas.reduce((s, m) => s + m.ticketMedio, 0) / metricas.length
      : 0;

  const funil = [
    { label: "Cadastros pelo QR", valor: cadastros },
    { label: "Com opt-in de marketing", valor: comOptIn },
    { label: "Participações em sorteio", valor: participacoes },
  ];
  const maxFunil = Math.max(1, ...funil.map((f) => f.valor));

  const integracoes = [
    { nome: "WhatsApp Business API", ok: true },
    { nome: "Google Business Profile", ok: true },
    { nome: "Instagram / Meta", ok: true },
    { nome: "PDV (caixa das lojas)", ok: true },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Olá, {u.nome.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500">
          Visão geral da Rede Paz e PAZ365 — {mes}.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi titulo="Vendas da rede (mês)" valor={formatBRL(vendasRede)} />
        <Kpi titulo="Ticket médio" valor={formatBRL(ticketMedio)} />
        <Kpi titulo="Clientes na base" valor={totalClientes} />
        <Kpi titulo="Participações" valor={participacoes} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Saúde dos postos */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Saúde dos postos</h2>
            <Link
              href="/postos"
              className="text-xs text-[var(--paz-navy)] hover:underline"
            >
              Ver postos
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["VERDE", "AMARELO", "VERMELHO"] as const).map((f) => (
              <div
                key={f}
                className="rounded-lg border border-gray-100 px-3 py-3 text-center"
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: FAROL_INFO[f].cor }}
                >
                  {porFarol(f)}
                </p>
                <p className="text-xs text-gray-500">{FAROL_INFO[f].label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {postos.length} postos no total ·{" "}
            {postos.filter((p) => !p.status[0]).length} sem farol este mês.
          </p>
        </section>

        {/* Funil do QR */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">
            Funil de captação (QR Code)
          </h2>
          <div className="space-y-3">
            {funil.map((f) => (
              <div key={f.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">{f.label}</span>
                  <span className="font-semibold text-gray-900">{f.valor}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2.5 rounded-full bg-[var(--paz-red)]"
                    style={{ width: `${(f.valor / maxFunil) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Produção */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Produção</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Mini titulo="Pedidos abertos" valor={pedidosAbertos} href="/designer" />
            <Mini
              titulo="Atrasados"
              valor={pedidosAtrasados}
              href="/designer"
              cor="#dc2626"
            />
            <Mini titulo="Vídeos em produção" valor={videosProducao} href="/videos" />
          </div>
          <div className="mt-3 text-xs text-gray-400">
            {campanhasAtivas} campanha(s) ativa(s).
          </div>
        </section>

        {/* Integrações */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 font-semibold text-gray-900">
            Integrações externas
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            Status simulado no modo local.
          </p>
          <ul className="space-y-2">
            {integracoes.map((i) => (
              <li
                key={i.nome}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">{i.nome}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Conectado
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Kpi({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="mt-0.5 text-xl font-bold text-gray-900">{valor}</p>
    </div>
  );
}

function Mini({
  titulo,
  valor,
  href,
  cor,
}: {
  titulo: string;
  valor: number;
  href: string;
  cor?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-gray-100 px-2 py-3 hover:bg-gray-50"
    >
      <p className="text-2xl font-bold" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
      <p className="text-xs text-gray-500">{titulo}</p>
    </Link>
  );
}
