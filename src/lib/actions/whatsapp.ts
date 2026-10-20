"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exigir, podeOperarMarketing } from "@/lib/authz";
import { registrar } from "@/lib/audit";
import { STATUS_META, GATILHOS } from "@/lib/enums";

export type WhatsState = { ok?: boolean; erro?: string };

// ----- Modelos de mensagem (templates aprovados pela Meta) -----

export async function criarModelo(
  _prev: WhatsState,
  formData: FormData,
): Promise<WhatsState> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim() || null;
  const corpo = String(formData.get("corpo") ?? "").trim();

  if (nome.length < 2) return { erro: "Informe o nome do modelo." };
  if (corpo.length < 5) return { erro: "Escreva o corpo da mensagem." };

  const modelo = await prisma.modeloMensagem.create({
    data: { nome, categoria, corpo },
  });
  await registrar({
    userId: u.id,
    acao: "modelo.criar",
    entidade: "ModeloMensagem",
    entidadeId: modelo.id,
    detalhe: nome,
  });
  revalidatePath("/whatsapp");
  return { ok: true };
}

// Simula a revisão da Meta (Aprovado / Reprovado / Pendente).
export async function definirAprovacaoModelo(
  formData: FormData,
): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const id = String(formData.get("id") ?? "");
  const statusMeta = String(formData.get("statusMeta") ?? "");
  if (!(STATUS_META as readonly string[]).includes(statusMeta)) return;

  await prisma.modeloMensagem.update({ where: { id }, data: { statusMeta } });
  await registrar({
    userId: u.id,
    acao: "modelo.status",
    entidade: "ModeloMensagem",
    entidadeId: id,
    detalhe: statusMeta,
  });
  revalidatePath("/whatsapp");
}

// ----- Automações -----

export async function criarAutomacao(
  _prev: WhatsState,
  formData: FormData,
): Promise<WhatsState> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const nome = String(formData.get("nome") ?? "").trim();
  const gatilho = String(formData.get("gatilho") ?? "");
  const modeloId = String(formData.get("modeloId") ?? "").trim() || null;
  const descricao = String(formData.get("descricao") ?? "").trim() || null;

  if (nome.length < 2) return { erro: "Informe o nome da automação." };
  if (!(GATILHOS as readonly { chave: string }[]).some((g) => g.chave === gatilho))
    return { erro: "Gatilho inválido." };

  const auto = await prisma.automacao.create({
    data: { nome, gatilho, modeloId, descricao },
  });
  await registrar({
    userId: u.id,
    acao: "automacao.criar",
    entidade: "Automacao",
    entidadeId: auto.id,
    detalhe: nome,
  });
  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function alternarAutomacao(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const id = String(formData.get("id") ?? "");
  const auto = await prisma.automacao.findUnique({ where: { id } });
  if (!auto) return;

  await prisma.automacao.update({
    where: { id },
    data: { ativo: !auto.ativo },
  });
  revalidatePath("/whatsapp");
}
