"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exigir, podeOperarMarketing } from "@/lib/authz";
import { registrar } from "@/lib/audit";
import { TIPOS_CAMPANHA, STATUS_CAMPANHA } from "@/lib/enums";

export type CampanhaState = { erro?: string };

function dataOuNull(v: string): Date | null {
  const s = v.trim();
  return s ? new Date(s) : null;
}

// Criar campanha (ADM e Marketing).
export async function criarCampanha(
  _prev: CampanhaState,
  formData: FormData,
): Promise<CampanhaState> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const premio = String(formData.get("premio") ?? "").trim() || null;
  const inicio = dataOuNull(String(formData.get("inicio") ?? ""));
  const fim = dataOuNull(String(formData.get("fim") ?? ""));
  const postoIds = formData.getAll("postos").map(String).filter(Boolean);

  if (nome.length < 2) return { erro: "Informe o nome da campanha." };
  if (!(TIPOS_CAMPANHA as readonly string[]).includes(tipo))
    return { erro: "Tipo inválido." };

  const campanha = await prisma.campanha.create({
    data: {
      nome,
      tipo,
      premio,
      inicio,
      fim,
      postos: postoIds.length
        ? { connect: postoIds.map((id) => ({ id })) }
        : undefined,
    },
  });
  await registrar({
    userId: u.id,
    acao: "campanha.criar",
    entidade: "Campanha",
    entidadeId: campanha.id,
    detalhe: nome,
  });

  redirect(`/campanhas/${campanha.id}`);
}

// Mudar o status (Rascunho / Ativa / Encerrada).
export async function definirStatusCampanha(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!(STATUS_CAMPANHA as readonly string[]).includes(status)) return;

  await prisma.campanha.update({ where: { id }, data: { status } });
  await registrar({
    userId: u.id,
    acao: "campanha.status",
    entidade: "Campanha",
    entidadeId: id,
    detalhe: status,
  });
  revalidatePath(`/campanhas/${id}`);
}

// Sortear um ganhador entre as participações.
export async function sortear(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const campanhaId = String(formData.get("id") ?? "");
  const participacoes = await prisma.participacao.findMany({
    where: { campanhaId },
    select: { id: true },
  });
  if (participacoes.length === 0) return;

  const sorteada =
    participacoes[Math.floor(Math.random() * participacoes.length)];
  await prisma.campanha.update({
    where: { id: campanhaId },
    data: { ganhadorParticipacaoId: sorteada.id },
  });
  await registrar({
    userId: u.id,
    acao: "campanha.sortear",
    entidade: "Campanha",
    entidadeId: campanhaId,
    detalhe: sorteada.id,
  });
  revalidatePath(`/campanhas/${campanhaId}`);
}
