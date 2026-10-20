import { requireUser } from "@/lib/session";
import { podeExportarClientes } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { registrar } from "@/lib/audit";

// Exporta todos os dados do cliente em JSON (direito LGPD). Só ADM.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const u = await requireUser();
  if (!podeExportarClientes(u)) {
    return new Response("Sem permissão.", { status: 403 });
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { consentimentos: true, eventos: true, postoPreferido: true },
  });
  if (!cliente) return new Response("Não encontrado.", { status: 404 });

  await registrar({
    userId: u.id,
    acao: "cliente.exportar",
    entidade: "Cliente",
    entidadeId: id,
  });

  return new Response(JSON.stringify(cliente, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="cliente-${id}.json"`,
    },
  });
}
