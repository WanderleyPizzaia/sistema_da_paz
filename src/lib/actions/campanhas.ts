"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exigir, podeOperarMarketing } from "@/lib/authz";
import { registrar } from "@/lib/audit";
import { corCampanha } from "@/lib/cores-campanha";
import { TIPOS_CAMPANHA, STATUS_CAMPANHA } from "@/lib/enums";

export type CampanhaState = { erro?: string };

function dataOuNull(v: string): Date | null {
  const s = v.trim();
  return s ? new Date(s) : null;
}

async function postosParticipantes(formData: FormData) {
  const modo = String(formData.get("modoPostos") ?? "manual");
  if (modo === "todos" || ["BANDEIRA_BRANCA", "IPIRANGA", "BR"].includes(modo)) {
    return prisma.posto.findMany({
      where: modo === "todos" ? {} : { bandeira: modo },
      select: { id: true },
    });
  }
  const ids = [...new Set(formData.getAll("postos").map(String).filter(Boolean))];
  return prisma.posto.findMany({ where: { id: { in: ids } }, select: { id: true } });
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

  if (nome.length < 2) return { erro: "Informe o nome da campanha." };
  if (!(TIPOS_CAMPANHA as readonly string[]).includes(tipo))
    return { erro: "Tipo inválido." };

  if ((inicio && !Number.isFinite(+inicio)) || (fim && !Number.isFinite(+fim)))
    return { erro: "Informe datas válidas." };
  if (inicio && fim && inicio > fim) return { erro: "O fim deve ser igual ou posterior ao início." };
  if (tipo === "CAMPANHA_MES" && (!inicio || !fim))
    return { erro: "Informe o início e o fim da campanha do mês." };

  const campanha = await prisma.campanha.create({
    data: {
      nome,
      tipo,
      corDestaque: corCampanha(String(formData.get("corDestaque")))?.id ?? "rosa",
      premio,
      inicio,
      fim,
      postos: { connect: await postosParticipantes(formData) },
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

export async function definirCorCampanha(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const id = String(formData.get("id") ?? "");
  const cor = corCampanha(String(formData.get("corDestaque")));
  if (!id || !cor) return;

  await prisma.campanha.update({ where: { id }, data: { corDestaque: cor.id } });
  await registrar({
    userId: u.id,
    acao: "campanha.cor",
    entidade: "Campanha",
    entidadeId: id,
    detalhe: cor.nome,
  });
  revalidatePath(`/campanhas/${id}`);
  revalidatePath("/visao-geral");
}

export async function atualizarCampanha(
  id: string,
  _prev: { erro?: string; ok?: boolean },
  formData: FormData,
): Promise<{ erro?: string; ok?: boolean }> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));
  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const inicio = dataOuNull(String(formData.get("inicio") ?? ""));
  const fim = dataOuNull(String(formData.get("fim") ?? ""));
  const premio = String(formData.get("premio") ?? "").trim() || null;
  const regulamentoUrl = String(formData.get("regulamentoUrl") ?? "").trim() || null;
  if (nome.length < 2 || !TIPOS_CAMPANHA.some((valor) => valor === tipo)) return { erro: "Confira o nome e o tipo da campanha." };
  if ((inicio && !Number.isFinite(+inicio)) || (fim && !Number.isFinite(+fim)) || (inicio && fim && inicio > fim))
    return { erro: "Confira o período informado." };
  if (tipo === "CAMPANHA_MES" && (!inicio || !fim)) return { erro: "Informe as duas datas da campanha do mês." };
  if (regulamentoUrl && !/^https?:\/\//i.test(regulamentoUrl)) return { erro: "Informe um link válido para o regulamento." };
  const publicar = formData.get("publicar") === "sim";
  const cor = corCampanha(String(formData.get("corDestaque")));
  await prisma.campanha.update({
    where: { id },
    data: {
      nome, tipo, inicio, fim, premio, regulamentoUrl,
      corDestaque: cor?.id,
      postos: { set: await postosParticipantes(formData) },
      ...(publicar ? { status: "ATIVA" } : {}),
    },
  });
  await registrar({ userId: u.id, acao: "campanha.editar", entidade: "Campanha", entidadeId: id, detalhe: nome });
  revalidatePath("/campanhas");
  revalidatePath(`/campanhas/${id}`);
  revalidatePath("/visao-geral");
  return { ok: true };
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
  revalidatePath("/campanhas");
  revalidatePath("/visao-geral");
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
