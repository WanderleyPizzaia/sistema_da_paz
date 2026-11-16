import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { STATUS_PEDIDO_LABEL, ETAPA_VIDEO_LABEL } from "@/lib/enums";
import NovoPedidoGerenteForm from "./NovoPedidoGerenteForm";

export default async function GerentePedidosPage() {
  const u = await getSession();
  if (!u || !u.postoId) redirect("/login");

  const [artes, videos] = await Promise.all([
    prisma.pedidoArte.findMany({ where: { postoId: u.postoId }, orderBy: { criadoEm: "desc" }, take: 10 }),
    prisma.video.findMany({ where: { postoId: u.postoId, origem: "PEDIDO" }, orderBy: { criadoEm: "desc" }, take: 10 }),
  ]);
  const pedidos = [
    ...artes.map((item) => ({ id: item.id, titulo: item.acao, tipo: "Arte", data: item.criadoEm, status: STATUS_PEDIDO_LABEL[item.status] ?? item.status })),
    ...videos.map((item) => ({ id: item.id, titulo: item.titulo, tipo: "Vídeo", data: item.criadoEm, status: ETAPA_VIDEO_LABEL[item.etapa] ?? item.etapa })),
  ].sort((a, b) => +b.data - +a.data).slice(0, 10);

  return (
    <div className="p-4">
      <section className="mb-4 rounded-2xl bg-gradient-to-br from-[#344197] to-[#1d245e] p-4 text-white">
        <h1 className="text-2xl font-bold">Pedidos ao marketing</h1>
        <p className="mt-1 text-sm text-blue-100">Peça uma arte ou vídeo para o seu posto.</p>
      </section>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <NovoPedidoGerenteForm />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-gray-700">
        Meus pedidos
      </h2>
      {pedidos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum pedido ainda.</p>
      ) : (
        <ul className="space-y-2">
          {pedidos.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3"
            >
              <span className="text-sm text-gray-800">{p.tipo} · {p.titulo}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {p.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
