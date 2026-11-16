import Link from "next/link";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { mudarStatusPonto } from "@/lib/actions/producao";
import { STATUS_ESTOP, STATUS_ESTOP_INFO, STATUS_PEDIDO_LABEL, corPrazo } from "@/lib/enums";
import NovoPedidoForm from "../designer/NovoPedidoForm";
import NovoPontoForm from "./NovoPontoForm";

export default async function EStopPage({ searchParams }: { searchParams: Promise<{ q?: string; tipo?: string }> }) {
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

  const { q, tipo } = await searchParams;
  const busca = typeof q === "string" ? q.trim() : "";
  const coincide = (texto: string) => texto.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"));
  const sinalizacao = (formato: string | null) => /placa|adesivo|totem|sinaliza/i.test(formato ?? "");
  const filtrados = pedidos.filter((p) => coincide([p.acao, p.posto?.nome].join(" ")) &&
    (tipo === "sinalizacao" ? sinalizacao(p.formato) : tipo === "arte" ? !sinalizacao(p.formato) : true));
  const filtroHref = (tipo: string) => "/estop?" + new URLSearchParams({ q: busca, tipo });

  return (
    <div className="min-h-screen bg-[#f2f8f4]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-4 lg:px-8">
        <div><p className="text-xl font-bold">E-Stop</p><p className="text-xs text-gray-600">Carregamento elétrico nos postos Rede Paz</p></div>
        <form action="/estop" className="flex gap-2">
          <input name="q" aria-label="Buscar pedido ou posto" placeholder="Buscar pedido ou posto" defaultValue={busca} className="min-w-0 rounded-xl border border-gray-300 px-3 py-2 text-sm" />
          <button className="rounded-xl border px-3 py-2 text-sm font-semibold">Buscar</button>
        </form>
      </header>
      <div className="max-w-[1240px] space-y-5 p-5 lg:p-8">
        <section className="relative isolate overflow-hidden rounded-[20px] bg-gradient-to-br from-[#255a29] to-[#3b8234] p-6 text-white shadow-[0_14px_32px_#2e773845]">
          <span aria-hidden="true" className="absolute -right-24 -top-40 -z-10 size-80 rounded-full bg-white/10" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#4a9c40] text-4xl">ϟ</span>
              <div>
                <p className="text-xs tracking-widest text-green-100">CARREGAMENTO ELÉTRICO</p>
                <h1 className="mt-1 text-4xl font-semibold">E-Stop</h1>
                <p className="mt-2 text-sm text-green-100">Pedidos de marketing e pontos de recarga para carros elétricos</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="#pontos" className="rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold !text-white">Ver pontos de recarga</a>
              <a href="#novo" className="rounded-xl bg-[#244f25] px-4 py-3 text-sm font-semibold !text-white">+ Pedido E-Stop</a>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <HeroStat titulo="Pontos de recarga" valor={pontos.length} sub={`em ${postosComPonto} posto(s)`} />
            <HeroStat titulo="Recargas no mês" valor="—" sub="Dados da plataforma de recarga" />
            <HeroStat titulo="Clientes com carro elétrico" valor={clientesEletricos} sub="na base de clientes" />
            <HeroStat titulo="Pedidos E-Stop abertos" valor={pedidosAbertos} sub="artes e sinalização" />
          </div>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
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
          <nav aria-label="Filtrar pedidos" className="mb-3 flex flex-wrap gap-2">
            {[["", "Todos"], ["arte", "Arte"], ["sinalizacao", "Sinalização"]].map(([id, nome]) =>
              <Link key={id} href={filtroHref(id)} aria-current={(tipo ?? "") === id ? "true" : undefined}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${(tipo ?? "") === id ? "bg-[#2d6d31] !text-white" : "bg-white"}`}>{nome}</Link>)}
          </nav>
          {filtrados.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum pedido E-Stop encontrado.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtrados.map((p) => {
                const prazo = corPrazo(p.prazo);
                return (
                  <li key={p.id} className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-gray-600">#{p.numero} · {sinalizacao(p.formato) ? "Sinalização" : "Arte"} · {STATUS_PEDIDO_LABEL[p.status] ?? p.status}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {p.acao}
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

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold">Pautas para o E-Stop</h2>
            <p className="mt-1 text-xs text-gray-600">Ideias de conteúdo com o olhar das pessoas</p>
            <ul className="divide-y divide-gray-100">
              {[
                ["Enquanto carrega, um café quente na PAZ365", "Vídeo · como aproveitar o tempo da recarga"],
                ["Primeira vez carregando? O frentista explica", "Reels · passo a passo com a equipe"],
                ["Quem anda de elétrico em São Paulo", "Série · histórias de clientes da rede"],
                ["Onde tem E-Stop: mapa dos pontos", "Carrossel · postos com rota no Waze"],
              ].map(([titulo, formato]) => <li key={titulo} className="py-3"><p className="text-sm font-semibold">{titulo}</p><p className="mt-1 text-xs text-gray-600">{formato}</p></li>)}
            </ul>
            <Link href="/videos#ideias" className="mt-2 block rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-semibold">Abrir banco de ideias</Link>
          </section>
        </div>

        {/* Pontos de recarga */}
        <section id="pontos" className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">Pontos de recarga E-Stop</h2>
          <p className="mb-4 text-xs text-gray-500">
            A equipe atualiza manualmente o status dos pontos.
          </p>

          {pontos.length > 0 && (
            <ul className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pontos.filter((p) => coincide(p.posto.nome)).map((p) => {
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
                    <div className="mb-3 flex flex-wrap gap-2 text-xs">
                      <Link href={`/postos/${p.postoId}`} className="font-semibold underline">Abrir posto</Link>
                      <a href="#novo" className="font-semibold underline">Pedir divulgação</a>
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
            <details>
              <summary className="cursor-pointer text-sm font-semibold">+ Cadastrar ponto E-Stop</summary>
              <div className="mt-3"><NovoPontoForm postos={postos} /></div>
            </details>
          </div>
        </section>
        <section id="novo" className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Novo pedido E-Stop</h2>
          <p className="mb-4 text-sm text-gray-600">Artes e peças de sinalização entram na fila do Designer com prazo inicial de 24h.</p>
          <NovoPedidoForm postos={postos.filter((posto) => pontos.some((ponto) => ponto.postoId === posto.id))} estop />
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
    <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
      <p className="text-[11px] text-white/70">{titulo}</p>
      <p className="mt-0.5 text-2xl font-bold">{valor}</p>
      <p className="text-[11px] text-white/60">{sub}</p>
    </div>
  );
}
