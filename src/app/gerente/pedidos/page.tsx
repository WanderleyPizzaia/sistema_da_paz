import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { STATUS_PEDIDO_LABEL } from "@/lib/enums";
import NovoPedidoGerenteForm from "./NovoPedidoGerenteForm";

export default async function GerentePedidosPage() {
  const u = await getSession();
  if (!u || !u.postoId) redirect("/login");

  const pedidos = await prisma.pedidoArte.findMany({
    where: { postoId: u.postoId },
    orderBy: { criadoEm: "desc" },
    take: 10,
  });

  return (
    <div className="p-4">
      <h1 className="mb-1 text-lg font-bold text-gray-900">
        Pedidos ao marketing
      </h1>
      <p className="mb-4 text-sm text-gray-500">
        Peça uma arte ou vídeo para o seu posto.
      </p>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <NovoPedidoGerenteForm />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-gray-700">
        Seus pedidos recentes
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
              <span className="text-sm text-gray-800">{p.acao}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {STATUS_PEDIDO_LABEL[p.status] ?? p.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
