import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { avancarPedido, definirPastaPedido } from "@/lib/actions/producao";
import {
  STATUS_PEDIDO,
  STATUS_PEDIDO_LABEL,
  corPrazo,
} from "@/lib/enums";
import NovoPedidoForm from "./NovoPedidoForm";

export default async function DesignerPage() {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const [pedidos, postos] = await Promise.all([
    prisma.pedidoArte.findMany({
      include: { posto: { select: { nome: true } } },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.posto.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const porStatus = (s: string) => pedidos.filter((p) => p.status === s);
  const atrasados = pedidos.filter(
    (p) => p.status !== "ENTREGUE" && new Date(p.prazo) < new Date(),
  ).length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Fila do designer</h1>
        <p className="text-sm text-gray-500">
          Pedidos de arte têm prazo de 24h. {pedidos.length} no total ·{" "}
          {atrasados} atrasado(s).
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {STATUS_PEDIDO.map((s) => {
          const lista = porStatus(s);
          return (
            <div key={s} className="rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  {STATUS_PEDIDO_LABEL[s]}
                </h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {lista.length}
                </span>
              </div>
              <ul className="divide-y divide-gray-100">
                {lista.length === 0 && (
                  <li className="px-4 py-6 text-center text-xs text-gray-400">
                    Vazio
                  </li>
                )}
                {lista.map((p) => {
                  const prazo = corPrazo(p.prazo);
                  return (
                    <li key={p.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            #{p.numero} · {p.acao}
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
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: prazo.cor }}
                          >
                            {prazo.texto}
                          </span>
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

                      {/* Pasta do pedido no Google Drive */}
                      <div className="mt-2.5 border-t border-gray-100 pt-2">
                        {p.pastaUrl ? (
                          <a
                            href={p.pastaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--paz-navy)] hover:underline"
                          >
                            📁 Abrir pasta no Drive
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
                            placeholder="Colar link da pasta no Drive"
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
            </div>
          );
        })}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Novo pedido de arte</h2>
        <NovoPedidoForm postos={postos} />
      </section>
    </div>
  );
}
