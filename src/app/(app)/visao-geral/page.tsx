import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Donut from "@/components/Donut";
import {
  mesRefAtual,
  formatBRL,
  FAROL_INFO,
  BANDEIRA_LABEL,
  type Farol,
} from "@/lib/enums";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Redes sociais — métricas simuladas enquanto as integrações não estão ligadas.
const REDES = [
  { nome: "Instagram", seguidores: "4.820", variacao: "+2,1%" },
  { nome: "TikTok", seguidores: "1.260", variacao: "+5,4%" },
  { nome: "YouTube", seguidores: "640", variacao: "+1,0%" },
  { nome: "WhatsApp", seguidores: "—", variacao: "base de clientes" },
];

export default async function VisaoGeralPage() {
  const u = await requireUser();
  const mes = mesRefAtual();

  // Semana atual (segunda a domingo) para o calendário editorial.
  const hoje = new Date();
  const diaSemana = (hoje.getDay() + 6) % 7; // 0 = segunda
  const inicioSemana = new Date(hoje);
  inicioSemana.setHours(0, 0, 0, 0);
  inicioSemana.setDate(hoje.getDate() - diaSemana);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 7);

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
    fotosDeAcoes,
    metricas,
    acoesSemana,
    pedidosSemana,
  ] = await Promise.all([
    prisma.posto.findMany({
      include: {
        status: { where: { mesRef: mes } },
        _count: { select: { acoes: true } },
      },
      orderBy: { nome: "asc" },
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
    prisma.acaoMarketing.count({ where: { fotoEnviada: true } }),
    prisma.metricaPosto.findMany({ where: { mes } }),
    prisma.acaoMarketing.findMany({
      where: { data: { gte: inicioSemana, lt: fimSemana } },
      include: { posto: { select: { nome: true } } },
      orderBy: { data: "asc" },
    }),
    prisma.pedidoArte.findMany({
      where: { prazo: { gte: inicioSemana, lt: fimSemana } },
      orderBy: { prazo: "asc" },
    }),
  ]);

  const porFarol = (f: Farol) =>
    postos.filter((p) => (p.status[0]?.farol as Farol) === f).length;
  const semFarol = postos.filter((p) => !p.status[0]).length;
  const precisamAcao = postos.filter(
    (p) => (p.status[0]?.farol as Farol) === "VERMELHO",
  );

  const vendasRede = metricas.reduce((s, m) => s + m.vendas, 0);
  const ticketMedio =
    metricas.length > 0
      ? metricas.reduce((s, m) => s + m.ticketMedio, 0) / metricas.length
      : 0;

  const fatias = [
    { label: FAROL_INFO.VERDE.label, valor: porFarol("VERDE"), cor: FAROL_INFO.VERDE.cor },
    { label: FAROL_INFO.AMARELO.label, valor: porFarol("AMARELO"), cor: FAROL_INFO.AMARELO.cor },
    { label: FAROL_INFO.VERMELHO.label, valor: porFarol("VERMELHO"), cor: FAROL_INFO.VERMELHO.cor },
    { label: "Sem farol", valor: semFarol, cor: "#cbd5e1" },
  ];

  const funil = [
    { label: "Cadastros pelo QR", valor: cadastros },
    { label: "Com opt-in de marketing", valor: comOptIn },
    { label: "Participações em sorteio", valor: participacoes },
  ];
  const maxFunil = Math.max(1, ...funil.map((f) => f.valor));

  // Monta os 7 dias da semana com seus eventos (ações + pedidos).
  type Evento = { titulo: string; cor: string };
  const dias = DIAS.map((rotulo, i) => {
    const data = new Date(inicioSemana);
    data.setDate(inicioSemana.getDate() + i);
    const ehHoje = data.toDateString() === new Date().toDateString();
    const eventos: Evento[] = [];
    for (const a of acoesSemana) {
      if (a.data && new Date(a.data).toDateString() === data.toDateString())
        eventos.push({
          titulo: `${a.titulo}${a.posto ? ` · ${a.posto.nome}` : ""}`,
          cor: "var(--paz-navy)",
        });
    }
    for (const p of pedidosSemana) {
      if (new Date(p.prazo).toDateString() === data.toDateString())
        eventos.push({ titulo: `Arte #${p.numero}: ${p.acao}`, cor: "var(--paz-red)" });
    }
    return { rotulo, dia: data.getDate(), ehHoje, eventos };
  });
  const totalEventos = dias.reduce((s, d) => s + d.eventos.length, 0);

  const atalhos = [
    { label: "Cadastrar posto", href: "/postos/novo" },
    { label: "Nova campanha", href: "/campanhas/novo" },
    { label: "Pedir arte", href: "/designer" },
    { label: "Ver clientes", href: "/clientes" },
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

      {/* Destaques */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi titulo="Vendas da rede (mês)" valor={formatBRL(vendasRede)} />
        <Kpi titulo="Ticket médio" valor={formatBRL(ticketMedio)} />
        <Kpi titulo="Clientes na base" valor={totalClientes} />
        <Kpi titulo="Participações" valor={participacoes} />
      </div>

      {/* Ações de marketing */}
      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Ações de marketing</h2>
          <span className="text-xs text-gray-400">Redes — simulado</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {REDES.map((r) => (
            <div key={r.nome} className="rounded-lg border border-gray-100 px-3 py-3">
              <p className="text-xs text-gray-500">{r.nome}</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">
                {r.seguidores}
              </p>
              <p className="text-xs text-gray-400">{r.variacao}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Mini titulo="Design — demandas" valor={pedidosAbertos} href="/designer" />
          <Mini titulo="Vídeos em produção" valor={videosProducao} href="/videos" />
          <Mini
            titulo="Postos que precisam de ação"
            valor={precisamAcao.length}
            href="/postos"
            cor={precisamAcao.length > 0 ? "#dc2626" : undefined}
          />
          <Mini titulo="Fotos de ações" valor={fotosDeAcoes} href="/postos" />
        </div>
      </section>

      {/* Calendário editorial */}
      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Calendário editorial</h2>
          <span className="text-xs text-gray-400">Semana atual</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {dias.map((d) => (
            <div
              key={d.rotulo}
              className={`min-h-24 rounded-lg border p-2 ${
                d.ehHoje
                  ? "border-[var(--paz-navy)] bg-[var(--paz-navy)]/5"
                  : "border-gray-100"
              }`}
            >
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs font-medium text-gray-500">
                  {d.rotulo}
                </span>
                <span className="text-sm font-bold text-gray-700">{d.dia}</span>
              </div>
              <div className="space-y-1">
                {d.eventos.map((e, i) => (
                  <p
                    key={i}
                    className="truncate rounded px-1.5 py-1 text-[11px] font-medium text-white"
                    style={{ background: e.cor }}
                    title={e.titulo}
                  >
                    {e.titulo}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        {totalEventos === 0 && (
          <p className="mt-3 text-xs text-gray-400">
            O calendário se forma conforme você agenda gravações, ações e
            pedidos de arte com data nesta semana.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Saúde dos postos — gráfico de pizza */}
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
          <div className="flex items-center gap-4">
            <Donut fatias={fatias} centro={postos.length} rotulo="postos" />
            <ul className="space-y-1.5 text-sm">
              {fatias.map((f) => (
                <li key={f.label} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: f.cor }}
                  />
                  <span className="text-gray-600">{f.label}</span>
                  <span className="ml-auto font-semibold text-gray-900">
                    {f.valor}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {precisamAcao.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                Precisam de ação
              </p>
              <div className="flex flex-wrap gap-1.5">
                {precisamAcao.map((p) => (
                  <Link
                    key={p.id}
                    href={`/postos/${p.id}`}
                    className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    {p.nome}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Atalhos */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Atalhos</h2>
          <div className="grid grid-cols-2 gap-3">
            {atalhos.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-4 text-center text-sm font-medium text-gray-700 hover:border-[var(--paz-navy)] hover:bg-gray-50"
              >
                {a.label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {campanhasAtivas} campanha(s) ativa(s) · {pedidosAtrasados} arte(s)
            atrasada(s).
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
      </div>

      {/* Postos — status e marketing */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">
          Postos — status e marketing
        </h2>
        <div className="divide-y divide-gray-100">
          {postos.map((p) => {
            const farol = p.status[0]?.farol as Farol | undefined;
            return (
              <Link
                key={p.id}
                href={`/postos/${p.id}`}
                className="flex items-center gap-3 py-3 hover:bg-gray-50"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: farol ? FAROL_INFO[farol].cor : "#cbd5e1" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{p.nome}</p>
                  <p className="text-xs text-gray-500">
                    {BANDEIRA_LABEL[p.bandeira]}
                    {p.temPaz365 ? " · PAZ365" : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {p._count.acoes}
                  </p>
                  <p className="text-xs text-gray-400">ações</p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    background: farol ? FAROL_INFO[farol].cor : "#e5e7eb",
                    color: farol ? FAROL_INFO[farol].corTexto : "#6b7280",
                  }}
                >
                  {farol ? FAROL_INFO[farol].label : "Sem farol"}
                </span>
              </Link>
            );
          })}
          {postos.length === 0 && (
            <p className="py-4 text-sm text-gray-400">
              Nenhum posto cadastrado ainda.
            </p>
          )}
        </div>
      </section>
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
      className="rounded-lg border border-gray-100 px-3 py-3 hover:bg-gray-50"
    >
      <p className="text-2xl font-bold" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
      <p className="text-xs text-gray-500">{titulo}</p>
    </Link>
  );
}
