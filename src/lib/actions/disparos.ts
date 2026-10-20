"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exigir, podeOperarMarketing } from "@/lib/authz";
import { registrar } from "@/lib/audit";

export type DisparoState = { ok?: boolean; total?: number; erro?: string };

// Monta o filtro de clientes elegíveis: segmento + opt-in de marketing.
function filtroElegiveis(q: string, veiculo: string, posto: string) {
  return {
    AND: [
      q
        ? {
            OR: [
              { nome: { contains: q } },
              { whatsapp: { contains: q.replace(/\D/g, "") || q } },
            ],
          }
        : {},
      veiculo ? { tipoVeiculo: veiculo } : {},
      posto ? { postoPreferidoId: posto } : {},
      // Respeita o opt-in (LGPD / opt-out "SAIR"): só quem aceitou marketing.
      {
        consentimentos: {
          some: { finalidade: "MARKETING_WHATSAPP", aceito: true },
        },
      },
    ],
  };
}

// Dispara (simulado) um modelo aprovado para o segmento filtrado.
export async function enviarDisparo(
  _prev: DisparoState,
  formData: FormData,
): Promise<DisparoState> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const modeloId = String(formData.get("modeloId") ?? "");
  const q = String(formData.get("q") ?? "");
  const veiculo = String(formData.get("veiculo") ?? "");
  const posto = String(formData.get("posto") ?? "");

  const modelo = await prisma.modeloMensagem.findUnique({
    where: { id: modeloId },
  });
  if (!modelo) return { erro: "Escolha um modelo de mensagem." };
  if (modelo.statusMeta !== "APROVADO")
    return { erro: "Só é possível disparar modelos aprovados pela Meta." };

  const where = filtroElegiveis(q, veiculo, posto);
  const clientes = await prisma.cliente.findMany({
    where,
    select: { id: true },
  });
  if (clientes.length === 0)
    return { erro: "Nenhum cliente elegível (com opt-in) neste segmento." };

  // Simula o envio: registra um evento de mensagem em cada cliente.
  await prisma.eventoCliente.createMany({
    data: clientes.map((c) => ({
      clienteId: c.id,
      tipo: "MENSAGEM",
      detalhe: `Disparo: ${modelo.nome}`,
    })),
  });

  await prisma.disparo.create({
    data: {
      modeloId: modelo.id,
      segmentoDescricao: [q, veiculo, posto].filter(Boolean).join(" · ") || "Todos",
      total: clientes.length,
      userId: u.id,
    },
  });
  await registrar({
    userId: u.id,
    acao: "disparo.enviar",
    entidade: "ModeloMensagem",
    entidadeId: modelo.id,
    detalhe: `${clientes.length} clientes`,
  });

  revalidatePath("/clientes");
  return { ok: true, total: clientes.length };
}
