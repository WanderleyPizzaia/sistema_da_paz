import { dataCampanha, diaAtualCampanhas } from "@/lib/calendario-campanhas";
import { CORES_CAMPANHA, corCampanha } from "@/lib/cores-campanha";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Donut from "@/components/Donut";
import {
  mesRefAtual,
  TIPO_CAMPANHA_LABEL,
  FAROL_INFO,
  BANDEIRA_LABEL,
  type Farol,
} from "@/lib/enums";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default async function VisaoGeralPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const u = await requireUser();
  const mes = mesRefAtual();
  const diaCampanha = diaAtualCampanhas();
  const periodo = (await searchParams).periodo === "mes" ? "mes" : "semana";
  const ano = diaCampanha.getUTCFullYear();
  const mesAtual = diaCampanha.getUTCMonth();
  const segunda = diaCampanha.getUTCDate() - (diaCampanha.getUTCDay() + 6) % 7;
  const inicioDestaque = new Date(Date.UTC(ano, mesAtual, periodo === "mes" ? 1 : segunda));
  const fimDestaque = periodo === "mes"
    ? new Date(Date.UTC(ano, mesAtual + 1, 1))
    : new Date(Date.UTC(ano, mesAtual, segunda + 7));
  const rotuloPeriodo = periodo === "mes" ? "este mês" : "esta semana";

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
    comOptIn,
    cadastros,
    participacoes,
    emAndamento,
    pedidosAbertos,
    pedidosAtrasados,
    fotosDeAcoes,
    acoesSemana,
    pedidosSemana,
  ] = await Promise.all([
    prisma.posto.findMany({
      include: {
        status: { where: { mesRef: mes } },
        metricas: { where: { mes }, select: { pedidosRota: true } },
        _count: {
          select: {
            eventos: { where: {
              tipo: "CADASTRO",
              qrCodeId: { not: null },
              criadoEm: { gte: inicioSemana, lt: fimSemana },
            } },
          },
        },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.cliente.count({
      where: {
        consentimentos: {
          some: { finalidade: "MARKETING_WHATSAPP", aceito: true },
        },
      },
    }),
    prisma.eventoCliente.count({ where: { tipo: "CADASTRO" } }),
    prisma.participacao.count(),
    prisma.campanha.findMany({
      where: { status: "ATIVA", inicio: { lt: fimDestaque }, fim: { gte: inicioDestaque } },
      orderBy: [{ inicio: "desc" }, { criadoEm: "desc" }, { id: "asc" }],
    }),
    prisma.pedidoArte.count({ where: { status: { not: "ENTREGUE" } } }),
    prisma.pedidoArte.count({
      where: { status: { not: "ENTREGUE" }, prazo: { lt: new Date() } },
    }),
    prisma.acaoMarketing.count({ where: { fotoEnviada: true } }),
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
  const semFarol = postos.filter((p) => !p.status[0]);
  const precisamAcao = postos.filter(
    (p) => (p.status[0]?.farol as Farol) === "VERMELHO",
  );

  const principal = emAndamento.find((campanha) => campanha.tipo === "CAMPANHA_MES") ?? emAndamento[0];
  const paleta = corCampanha(principal?.corDestaque ?? "") ?? CORES_CAMPANHA[0];
  const outrosDestaques = emAndamento.filter((campanha) => campanha.id !== principal?.id).slice(0, 3);
  const dataHoje = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(hoje);
  const feitas = acoesSemana.filter((acao) => acao.status === "FEITA").length;
  const percentual = (valor: number, total: number) => total ? Math.round(100 * valor / total) : 0;
  const cards = [
    { icone: "◁", valor: acoesSemana.length, titulo: "Ações de marketing", legenda: "nesta semana", selo: feitas + " feitas", barra: "Concluídas", progresso: percentual(feitas, acoesSemana.length), cor: "#304299" },
    { icone: "✎", valor: pedidosAbertos, titulo: "Designer · demandas de arte", legenda: "pedidos em aberto", selo: pedidosAtrasados + " atrasadas", barra: "Pedidos atrasados", progresso: percentual(pedidosAtrasados, pedidosAbertos), cor: "#304299", href: "/designer" },
    { icone: "⚠", valor: precisamAcao.length, titulo: "Postos precisam de ação", legenda: "não bateram a meta do mês", selo: "no vermelho", barra: "Postos no verde", progresso: percentual(porFarol("VERDE"), postos.length), cor: "#2b9a59" },
    { icone: "▣", valor: fotosDeAcoes, titulo: "Fotos de ações", legenda: "enviadas pelos postos", selo: "Rede Paz", barra: "Ações da semana com foto", progresso: percentual(acoesSemana.filter((acao) => acao.fotoEnviada).length, acoesSemana.length), cor: "#d51224" },
  ];

  const fatias = [
    { label: FAROL_INFO.VERDE.label, valor: porFarol("VERDE"), cor: FAROL_INFO.VERDE.cor },
    { label: FAROL_INFO.AMARELO.label, valor: porFarol("AMARELO"), cor: FAROL_INFO.AMARELO.cor },
    { label: FAROL_INFO.VERMELHO.label, valor: porFarol("VERMELHO"), cor: FAROL_INFO.VERMELHO.cor },
    { label: "Sem farol", valor: semFarol.length, cor: "#cbd5e1" },
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
    { titulo: "Registrar ação", detalhe: "Em um posto", href: "/postos", icone: "+", cor: "bg-[#304299] !text-white" },
    { titulo: "Subir fotos", detalhe: "Das ações feitas", href: "/operacao", icone: "▣", cor: "bg-[#be1528] !text-white" },
    { titulo: "Nova campanha", detalhe: "Sorteio, cupom ou oferta", href: "/campanhas/novo", icone: "↗", cor: "bg-[#253477] !text-white" },
    { titulo: "Enviar WhatsApp", detalhe: "Para um segmento", href: "/clientes/disparo", icone: "whatsapp", cor: "border border-gray-200 bg-white !text-gray-900" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5fa] text-[#171922]">
      <header className="border-b border-gray-200 bg-white px-5 py-4 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>
        <p className="text-sm text-gray-600">Marketing dos postos Rede Paz e lojas PAZ365</p>
      </header>
      <div className="max-w-[1240px] p-5 lg:px-8 lg:py-7">
        <section className="relative isolate mb-6 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#30439b] to-[#1e2962] p-5 text-white shadow-[0_14px_32px_#293d8d40] lg:p-7" aria-labelledby="destaques">
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-24 -z-10 size-80 rounded-full bg-white/5" />
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">Olá, {u.nome.split(" ")[0]}</h2>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold capitalize">{dataHoje}</span>
            <nav aria-label="Período do destaque" className="flex rounded-xl border border-white/25 bg-white/10 p-1 text-sm lg:ml-auto">
              {([{ id: "semana", titulo: "Esta semana" }, { id: "mes", titulo: "Este mês" }] as const).map((opcao) => (
                <Link key={opcao.id} href={`/visao-geral?periodo=${opcao.id}`} scroll={false}
                  aria-current={periodo === opcao.id ? "true" : undefined}
                  className={`rounded-lg !px-3 py-2 font-semibold ${periodo === opcao.id ? "bg-white !text-[#304299]" : "!text-white hover:bg-white/10"}`}>
                  {opcao.titulo}
                </Link>
              ))}
            </nav>
          </div>
          <p className="mt-1 text-sm text-blue-100">O trabalho de marketing do mês nos postos, PAZ365 e E-Stop</p>

          <div className="mt-5 mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.13em] text-blue-100">AÇÕES QUE ESTAMOS TRABALHANDO</p>
              <h3 id="destaques" className="text-2xl font-semibold tracking-tight">Em destaque {rotuloPeriodo}</h3>
            </div>
            <Link href="/campanhas" className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20">Ver calendário</Link>
          </div>

          {principal ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Link href={`/campanhas/${principal.id}`} style={{ background: `linear-gradient(135deg, ${paleta.inicio}, ${paleta.fim})` }} className="relative overflow-hidden rounded-2xl p-[18px] shadow-lg hover:brightness-105">
                <span aria-hidden="true" className="absolute -top-10 -right-8 size-40 rounded-full bg-white/10" />
                <p className="relative text-xs font-semibold">{TIPO_CAMPANHA_LABEL[principal.tipo] ?? principal.tipo}</p>
                <h4 className="relative mt-2 text-2xl font-semibold">{principal.nome}</h4>
                <p className="relative mt-2 text-sm">{dataCampanha(principal.inicio)} a {dataCampanha(principal.fim)}</p>
                <p className="relative mt-4 text-xs font-semibold">Ver campanha →</p>
              </Link>
              {outrosDestaques.map((campanha) => (
                <Link key={campanha.id} href={`/campanhas/${campanha.id}`} className="rounded-2xl border border-l-4 border-white/25 bg-white/10 p-4 hover:bg-white/15">
                  <p className="text-xs font-semibold text-blue-100">{TIPO_CAMPANHA_LABEL[campanha.tipo] ?? campanha.tipo}</p>
                  <h4 className="mt-2 font-bold">{campanha.nome}</h4>
                  <p className="mt-2 text-xs text-blue-100">{dataCampanha(campanha.inicio)} a {dataCampanha(campanha.fim)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-sm">
              Nenhuma campanha ativa {rotuloPeriodo}. <Link href="/campanhas/novo" className="font-semibold underline">Cadastrar campanha</Link>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/20 pt-4 text-xs">
            <span className="mr-1 tracking-widest text-blue-100">REDES NESTA SEMANA</span>
            {[["◎", "Instagram", "—"], ["♪", "TikTok", "—"], ["▸", "YouTube", "—"], ["◉", "WhatsApp", comOptIn + " contatos"], ["⌖", "Google", "—"]].map(([icone, rede, valor]) => (
              <span key={rede} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-blue-100">
                <span aria-hidden="true" className="mr-2 text-white">{icone}</span>{rede} <strong className="ml-1 text-white">{valor}</strong>
              </span>
            ))}
          </div>
        </section>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <section key={card.titulo} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl bg-[#ebedf9] text-xl font-bold text-[#304299]">{card.icone}</span>
                <span className="rounded-full bg-[#ebedf9] px-2.5 py-1 text-xs font-semibold text-[#304299]">{card.selo}</span>
              </div>
              <p className="mt-3 text-3xl font-bold">{card.valor}</p>
              <h3 className="mt-1 text-sm font-medium">{card.titulo}</h3>
              <p className="text-xs text-gray-500">{card.legenda}</p>
              <div className="mt-3 flex justify-between gap-2 text-xs"><span className="text-gray-600">{card.barra}</span><strong>{card.progresso}%</strong></div>
              <div className="mt-2.5 h-2 rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: card.progresso + "%", background: card.cor }} />
              </div>
              {card.href && <Link href={card.href} className="mt-2 inline-block text-sm text-[#304299] underline">Ver fila do designer</Link>}
            </section>
          ))}
        </div>

      {/* Calendário editorial */}
      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest text-gray-600">AÇÕES DE MARKETING · TODOS OS POSTOS</p>
            <h2 className="text-2xl font-semibold text-gray-900">Calendário editorial</h2>
          </div>
          <Link href="/postos" className="rounded-xl bg-[#304299] px-4 py-2.5 text-sm font-semibold text-white">+ Registrar ação</Link>
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
          <div className="mt-4 border-t border-gray-100 pt-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Precisam de atenção
            </h3>
            <ul className="space-y-2">
              {[...precisamAcao, ...semFarol].map((posto) => {
                const vermelho = posto.status[0]?.farol === "VERMELHO";
                return (
                  <li key={posto.id}>
                    <Link
                      href={`/postos/${posto.id}`}
                      className={`block rounded-lg px-3 py-2 text-sm hover:underline ${vermelho ? "bg-red-50 text-red-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      <span className="block font-semibold">{posto.nome}</span>
                      <span className="block text-xs">{vermelho ? "Não bateu a meta do mês" : "Farol do mês ainda não informado"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {!precisamAcao.length && !semFarol.length && (
              <p className="text-xs text-gray-500">Nenhum posto precisa de atenção este mês.</p>
            )}
          </div>
        </section>

        {/* Atalhos */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Atalhos</h2>
          <p className="mb-4 text-xs text-gray-600">O que a equipe mais faz no dia a dia</p>
          <div className="grid grid-cols-2 gap-2.5">
            {atalhos.map((atalho) => (
              <Link
                key={atalho.href}
                href={atalho.href}
                className={`flex min-h-24 flex-col items-start rounded-xl p-3 shadow-sm transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 ${atalho.cor}`}
              >
                <span aria-hidden="true" className="mb-1 text-lg leading-none">
                  {atalho.icone === "whatsapp" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L4 20l1-3.8a8.5 8.5 0 1 1 15.5-4.6Z" />
                      <path d="M9.5 8.1c-.4-.4-1.3 0-1.4.8-.3 2.5 3.6 6.4 6.2 6.3.9 0 1.5-.9 1.1-1.3l-1.6-1c-.3-.2-.6.1-1 .6-1.2-.5-2.3-1.6-2.8-2.8.5-.4.8-.7.6-1Z" />
                    </svg>
                  ) : atalho.icone}
                </span>
                <span className="text-sm leading-tight font-semibold">{atalho.titulo}</span>
                <span className="mt-1 text-xs leading-snug opacity-90">{atalho.detalhe}</span>
              </Link>
            ))}
          </div>
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

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5" aria-labelledby="postos-marketing">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="postos-marketing" className="text-lg font-semibold text-gray-900">Postos — status e marketing</h2>
              <p className="text-xs text-gray-600">Esta semana · farol e rotas referentes ao mês</p>
            </div>
            <Link href="/postos" className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-50">
              Ver todos os postos
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm" aria-labelledby="postos-marketing">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs tracking-wide text-gray-600 uppercase">
                <tr>
                  {["Posto", "Bandeira", "Status do mês", "Ações", "Fotos", "Rotas no Google", "Cadastros QR"].map((titulo) => (
                    <th key={titulo} scope="col" className="px-3 py-3 font-semibold">{titulo}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {postos.map((posto) => {
                  const farol = posto.status[0]?.farol as Farol | undefined;
                  const status = farol ? FAROL_INFO[farol] : undefined;
                  const rotulo = farol === "VERDE" ? "Melhor que o mês anterior"
                    : farol === "VERMELHO" ? "Precisa de ação"
                    : farol === "AMARELO" ? "Normal" : "Farol pendente";
                  const acoes = acoesSemana.filter((acao) => acao.postoId === posto.id);
                  return (
                    <tr key={posto.id} className="hover:bg-gray-50">
                      <th scope="row" className="px-3 py-3 font-semibold">
                        <Link href={`/postos/${posto.id}`} className="hover:underline">{posto.nome}</Link>
                      </th>
                      <td className="px-3 py-3">{BANDEIRA_LABEL[posto.bandeira] ?? posto.bandeira}{posto.temPaz365 && " · PAZ365"}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                          <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: status?.cor ?? "#94a3b8" }} />
                          {rotulo}
                        </span>
                      </td>
                      <td className="px-3 py-3 tabular-nums">{acoes.length}</td>
                      <td className="px-3 py-3 tabular-nums">{acoes.filter((acao) => acao.fotoEnviada).length}</td>
                      <td className="px-3 py-3 tabular-nums">{posto.metricas[0]?.pedidosRota ?? "—"}</td>
                      <td className="px-3 py-3 tabular-nums">{posto._count.eventos}</td>
                    </tr>
                  );
                })}
                {postos.length === 0 && <tr><td colSpan={7} className="px-3 py-4 text-gray-500">Nenhum posto cadastrado ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
