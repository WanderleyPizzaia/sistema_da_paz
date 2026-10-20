import "server-only";
import { prisma } from "./prisma";

// Registra no log quem fez o que. Nao deve derrubar a acao principal se falhar.
export async function registrar(params: {
  userId?: string | null;
  acao: string;
  entidade?: string;
  entidadeId?: string;
  detalhe?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        acao: params.acao,
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        detalhe: params.detalhe,
      },
    });
  } catch {
    // log e best-effort
  }
}
