import Link from "next/link";
import { mesRefAtual } from "@/lib/enums";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { avancarPedido, definirPastaPedido } from "@/lib/actions/producao";
import {
  STATUS_PEDIDO_LABEL,
  corPrazo,
} from "@/lib/enums";
import NovoPedidoForm from "./NovoPedidoForm";

export default async function DesignerPage({ searchParams }: { searchParams: Promise<{ fila?: string }> }) {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const [pedidos, postos] = await Promise.all([
    prisma.pedidoArte.findMany({
      include: { posto: { select: { nome: true } } },
      orderBy: [{ prazo: "asc" }, { numero: "asc" }],
    }),
    prisma.posto.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const filtros = [
    { id: "abertos", nome: "Abertos" },
    { id: "aprovar", nome: "Para aprovar" },
    { id: "entregues", nome: "Entregues" },
    { id: "todos", nome: "Todos" },
  ];
  const { fila } = await searchParams;
  const filtro = filtros.find((item) => item.id === fila)?.id ?? "abertos";
  const statusFiltro: Record<string, string> = { abertos: "ABERTO", aprovar: "PARA_APROVAR", entregues: "ENTREGUE" };
  const lista = pedidos.filter((pedido) => filtro === "todos" || pedido.status === statusFiltro[filtro]);
  const abertos = pedidos.filter((pedido) => pedido.status !== "ENTREGUE");
  const agora = +new Date();
  const entreguesMes = pedidos.filter((pedido) => pedido.entregueEm?.toISOString().slice(0, 7) === mesRefAtual());
  const noPrazo = entreguesMes.filter((pedido) => pedido.entregueEm && pedido.entregueEm <= pedido.prazo).length;
  const pedidosComPasta = pedidos.filter((pedido) => pedido.pastaUrl);
  const gruposPastas = [
    { titulo: "Pedidos em aberto", pedidos: pedidosComPasta.filter((pedido) => pedido.status !== "ENTREGUE") },
    { titulo: "Entregues", pedidos: pedidosComPasta.filter((pedido) => pedido.status === "ENTREGUE") },
  ];

  const indicadores = [
    { titulo: "Pedidos abertos", valor: abertos.length },
    { titulo: "Vencem em menos de 6h", valor: abertos.filter((pedido) => +pedido.prazo >= agora && +pedido.prazo - agora < 21600000).length },
    { titulo: "Pedidos atrasados", valor: abertos.filter((pedido) => +pedido.prazo < agora).length },
    { titulo: "Entregues no prazo (mês)", valor: entreguesMes.length ? Math.round(100 * noPrazo / entreguesMes.length) + "%" : "—" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-4 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Designer</h1>
          <p className="text-sm text-gray-600">Pedidos de arte · prazo inicial de 24h</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="#pastas" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50">Pastas dos pedidos</a>
          <a href="#novo" className="rounded-xl bg-[#c32630] px-4 py-3 text-sm font-semibold !text-white">+ Novo pedido de arte</a>
        </div>
      </header>

      <div className="max-w-[1240px] space-y-5 p-5 lg:p-8">
        <section className="relative isolate overflow-hidden rounded-[20px] bg-gradient-to-br from-[#344197] to-[#1d245e] p-6 text-white shadow-[0_14px_32px_#293d8d40]">
          <span aria-hidden="true" className="absolute -right-24 -top-40 -z-10 size-80 rounded-full bg-white/5" />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-blue-100">PEDIDOS DE ARTE · PRAZO DE 24H</p>
              <h2 className="mt-1 text-4xl font-semibold tracking-tight">Fila do designer</h2>
              <p className="mt-2 text-sm text-blue-100">Os vencimentos dos pedidos em aberto têm pelo menos 2h de intervalo.</p>
            </div>
            <a href="#novo" className="rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold !text-white hover:bg-white/20">+ Novo pedido de arte</a>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {indicadores.map(({ titulo, valor }) => (
              <div key={titulo} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                <dt className="text-xs text-blue-100">{titulo}</dt>
                <dd className="mt-1 text-3xl font-semibold">{valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="pedidos" className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Pedidos e prazos</h2>
              <p className="text-sm text-gray-600">Ordenados pelo prazo mais próximo</p>
            </div>
            <nav aria-label="Filtrar pedidos" className="flex flex-wrap gap-2">
              {filtros.map(({ id, nome }) => (
                <Link key={id} href={`/designer?fila=${id}#pedidos`} aria-current={filtro === id ? "true" : undefined}
                  className={`rounded-full border px-3 py-2 text-sm font-medium ${filtro === id ? "border-[#304299] bg-[#304299] !text-white" : "border-gray-200 hover:bg-gray-50"}`}>
                  {nome}
                </Link>
              ))}
            </nav>
          </div>
          <ul className="space-y-3">
            {lista.length === 0 && <li className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">Nenhum pedido neste filtro.</li>}
                {lista.map((p) => {
                  const prazo = corPrazo(p.prazo);
                  const mensagem = [
                    `*Pedido de arte #${String(p.numero).padStart(4, "0")}*`,
                    `Ação: ${p.acao}`,
                    p.posto?.nome && `Posto: ${p.posto.nome}`,
                    p.formato && `Formato: ${p.formato}`,
                    p.responsavel && `Solicitante: ${p.responsavel}`,
                    `Prazo: ${p.prazo.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}`,
                    p.descricao && `Detalhes: ${p.descricao}`,
                    p.textoArte && `Texto da arte: ${p.textoArte}`,
                    p.referencias && `Referências: ${p.referencias}`,
                    p.pastaUrl && `Pasta do pedido: ${p.pastaUrl}`,
                  ].filter(Boolean).join("\n");
                  return (
                    <li key={p.id} className="rounded-xl border border-l-4 border-gray-200 bg-white px-4 py-4 shadow-sm" style={{ borderLeftColor: p.status === "ENTREGUE" ? "#4d9a60" : prazo.cor }}>
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold tracking-wide text-gray-500">PEDIDO #{String(p.numero).padStart(4, "0")}</span>
                        <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-900">{STATUS_PEDIDO_LABEL[p.status] ?? p.status}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            {p.acao}
                          </p>
                          <p className="text-xs text-gray-500">
                            {[p.posto?.nome, p.formato, p.responsavel]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </p>
                        </div>
                        {p.ehEStop && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                            E-Stop
                          </span>
                        )}
                      </div>
                      {p.status !== "ENTREGUE" ? (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: prazo.cor }}
                          >
                            {prazo.texto}
                          </span>
                          <span className="text-xs text-gray-600">Prazo: {p.prazo.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}</span>
                          <form action={avancarPedido}>
                            <input type="hidden" name="id" value={p.id} />
                            <button className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                              {p.status === "ABERTO"
                                ? "Enviar p/ aprovação"
                                : "Marcar entregue"}
                            </button>
                          </form>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-gray-400">
                          Entregue
                          {p.entregueEm
                            ? ` em ${new Date(p.entregueEm).toLocaleDateString("pt-BR")}`
                            : ""}
                        </p>
                      )}

                      <details className="mt-3">
                        <summary className="w-fit cursor-pointer rounded-lg bg-green-800 px-3 py-1.5 text-sm font-semibold text-white">
                          Disparar pedido no WhatsApp
                        </summary>
                        <div className="mt-3 space-y-3 rounded-xl border border-gray-200 p-4">
                          <p className="text-sm text-gray-600">Confira a mensagem e escolha o destinatário no WhatsApp.</p>
                          <pre className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 font-sans text-sm">{mensagem}</pre>
                          <a href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`} target="_blank" rel="noopener noreferrer"
                            className="inline-block rounded-lg bg-green-800 px-3 py-2 text-sm font-semibold !text-white">
                            Abrir WhatsApp
                          </a>
                        </div>
                      </details>

                      <details className="mt-3">
                        <summary className="w-fit cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                          Editar
                        </summary>
                        <div className="mt-3 rounded-xl border border-gray-200 p-4">
                          <NovoPedidoForm postos={postos} pedido={p} />
                        </div>
                      </details>

                      {/* Pasta do pedido */}
                      <div className="mt-2.5 border-t border-gray-100 pt-2">
                        {p.pastaUrl ? (
                          <a
                            href={p.pastaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--paz-navy)] hover:underline"
                          >
                            📁 Abrir pasta do pedido
                          </a>
                        ) : (
                          <p className="text-[11px] text-gray-400">
                            Pasta sugerida:{" "}
                            <span className="font-medium text-gray-500">
                              Pedido #{String(p.numero).padStart(4, "0")}
                            </span>
                          </p>
                        )}
                        <form
                          action={definirPastaPedido}
                          className="mt-1.5 flex gap-1.5"
                        >
                          <input type="hidden" name="id" value={p.id} />
                          <input
                            name="pastaUrl"
                            defaultValue={p.pastaUrl ?? ""}
                            placeholder="Colar link da pasta do OneDrive"
                            className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 outline-none focus:border-[var(--paz-navy)]"
                          />
                          <button className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                            Salvar
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
          </ul>
        </section>

        <section id="novo" className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Novo pedido de arte</h2>
              <p className="text-sm text-gray-600">Quanto mais detalhe, menos retrabalho</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">Prazo inicial de 24h · carência de 2h na fila</span>
          </div>
          <NovoPedidoForm postos={postos} />
        </section>
        <section id="pastas" aria-labelledby="titulo-pastas" className="scroll-mt-4 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4">
            <h2 id="titulo-pastas" className="text-xl font-bold">Pastas no OneDrive</h2>
            <p className="text-sm text-gray-600">Vincule a pasta no cartão do pedido. Abra a pasta para enviar ou consultar arquivos.</p>
          </div>
          {pedidosComPasta.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {gruposPastas.map((grupo) => (
                <div key={grupo.titulo} className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 text-sm font-semibold">{grupo.titulo}</h3>
                  {grupo.pedidos.length ? (
                    <ul className="space-y-2">
                      {grupo.pedidos.map((pedido) => (
                        <li key={pedido.id}>
                          <a href={pedido.pastaUrl ?? undefined} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 hover:bg-blue-50">
                            <span aria-hidden="true" className="text-lg">📁</span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs text-gray-600">Pedido #{String(pedido.numero).padStart(4, "0")}</span>
                              <span className="block break-words text-sm font-semibold">{pedido.acao}</span>
                            </span>
                            <span aria-hidden="true">↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-gray-500">Nenhuma pasta vinculada.</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-600">
              Nenhuma pasta vinculada. <a href="#pedidos" className="font-semibold underline">Ver pedidos</a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
