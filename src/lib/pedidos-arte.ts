import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const HORA = 60 * 60 * 1000;
const CARENCIA = 2 * HORA;

export function criarPedidoNaFila(data: Omit<Prisma.PedidoArteUncheckedCreateInput, "numero" | "prazo">) {
  return prisma.$transaction(async (tx) => {
    // Calcula e reserva o prazo em sequência, inclusive para pedidos simultâneos.
    await tx.$executeRaw`LOCK TABLE "PedidoArte" IN SHARE ROW EXCLUSIVE MODE`;
    let vencimento = Date.now() + 24 * HORA;
    const pedidos = await tx.pedidoArte.findMany({
      where: { status: { not: "ENTREGUE" }, prazo: { gt: new Date(vencimento - CARENCIA) } },
      orderBy: { prazo: "asc" },
      select: { prazo: true },
    });

    for (const pedido of pedidos) {
      const prazo = pedido.prazo.getTime();
      if (prazo >= vencimento + CARENCIA) break;
      if (prazo > vencimento - CARENCIA) vencimento = prazo + CARENCIA;
    }

    const { _max } = await tx.pedidoArte.aggregate({ _max: { numero: true } });
    return tx.pedidoArte.create({
      data: { ...data, numero: (_max.numero ?? 0) + 1, prazo: new Date(vencimento) },
    });
  });
}
