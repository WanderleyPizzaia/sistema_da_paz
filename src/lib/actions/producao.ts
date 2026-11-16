"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarPedidoNaFila } from "@/lib/pedidos-arte";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exigir, podeOperarMarketing } from "@/lib/authz";
import { registrar } from "@/lib/audit";
import {
  STATUS_PEDIDO,
  ETAPAS_VIDEO,
  ORIGENS_VIDEO,
  STATUS_ESTOP,
  TIPOS_PARCERIA,
  STATUS_PARCERIA,
} from "@/lib/enums";

export type ProducaoState = { ok?: boolean; erro?: string };

async function exigirMkt() {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));
  return u;
}

function num(v: FormDataEntryValue | null): number {
  const n = parseInt(String(v ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

// ---------- Designer (pedidos de arte) ----------

function dadosPedidoArte(formData: FormData) {
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim() || null;
  return {
    postoId: texto("postoId"),
    formato: texto("formato"),
    descricao: texto("descricao"),
    textoArte: texto("textoArte"),
    referencias: texto("referencias"),
    responsavel: texto("responsavel"),
    ehEStop: formData.get("ehEStop") === "on",
  };
}

export async function editarPedidoArte(
  id: string,
  _prev: ProducaoState,
  formData: FormData,
): Promise<ProducaoState> {
  const u = await exigirMkt();
  const acao = String(formData.get("acao") ?? "").trim();
  if (acao.length < 2) return { erro: "Descreva a ação de marketing." };
  const dados = dadosPedidoArte(formData);
  if (dados.postoId && !await prisma.posto.findUnique({ where: { id: dados.postoId }, select: { id: true } })) {
    return { erro: "Selecione um posto válido." };
  }
  const pedido = await prisma.pedidoArte.updateMany({
    where: { id },
    data: { acao, ...dados },
  });
  if (!pedido.count) return { erro: "Pedido não encontrado." };
  await registrar({
    userId: u.id,
    acao: "pedido.editar",
    entidade: "PedidoArte",
    entidadeId: id,
    detalhe: acao,
  });
  revalidatePath("/designer");
  revalidatePath("/visao-geral");
  return { ok: true };
}

export async function criarPedidoArte(
  _prev: ProducaoState,
  formData: FormData,
): Promise<ProducaoState> {
  const u = await exigirMkt();

  const acao = String(formData.get("acao") ?? "").trim();
  if (acao.length < 2) return { erro: "Descreva a ação de marketing." };

  const pedido = await criarPedidoNaFila({ acao, ...dadosPedidoArte(formData) });
  await registrar({
    userId: u.id,
    acao: "pedido.criar",
    entidade: "PedidoArte",
    entidadeId: pedido.id,
    detalhe: acao,
  });
  revalidatePath("/designer");
  return { ok: true };
}

// Salva (ou limpa) o link da pasta do pedido no Google Drive.
export async function definirPastaPedido(formData: FormData): Promise<void> {
  const u = await exigirMkt();
  const id = String(formData.get("id") ?? "");
  let pastaUrl = String(formData.get("pastaUrl") ?? "").trim() || null;
  if (pastaUrl && !/^https?:\/\//i.test(pastaUrl)) {
    pastaUrl = `https://${pastaUrl}`;
  }

  await prisma.pedidoArte.update({ where: { id }, data: { pastaUrl } });
  await registrar({
    userId: u.id,
    acao: "pedido.pasta",
    entidade: "PedidoArte",
    entidadeId: id,
    detalhe: pastaUrl ?? "pasta removida",
  });
  revalidatePath("/designer");
}

export async function avancarPedido(formData: FormData): Promise<void> {
  const u = await exigirMkt();
  const id = String(formData.get("id") ?? "");
  const pedido = await prisma.pedidoArte.findUnique({ where: { id } });
  if (!pedido) return;

  const i = STATUS_PEDIDO.indexOf(pedido.status as (typeof STATUS_PEDIDO)[number]);
  const proximo = STATUS_PEDIDO[Math.min(i + 1, STATUS_PEDIDO.length - 1)];
  await prisma.pedidoArte.update({
    where: { id },
    data: {
      status: proximo,
      entregueEm: proximo === "ENTREGUE" ? new Date() : pedido.entregueEm,
    },
  });
  await registrar({
    userId: u.id,
    acao: "pedido.status",
    entidade: "PedidoArte",
    entidadeId: id,
    detalhe: proximo,
  });
  revalidatePath("/designer");
}

// ---------- Vídeos (kanban) ----------

export async function criarVideo(
  _prev: ProducaoState,
  formData: FormData,
): Promise<ProducaoState> {
  const u = await exigirMkt();
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (titulo.length < 2) return { erro: "Informe o título do vídeo." };

  const origem = String(formData.get("origem") ?? "IDEIA");
  const postoId = String(formData.get("postoId") ?? "").trim() || null;

  const gravacao = String(formData.get("gravacaoEm") ?? "");
  const publicacao = String(formData.get("publicarAte") ?? "");
  const gravacaoEm = gravacao ? new Date(gravacao + "-03:00") : null;
  const publicarAte = publicacao ? new Date(publicacao + "T12:00:00-03:00") : null;
  if ((gravacaoEm && !Number.isFinite(+gravacaoEm)) || (publicarAte && !Number.isFinite(+publicarAte))) {
    return { erro: "Confira as datas da gravação e da publicação." };
  }

  const video = await prisma.video.create({
    data: {
      titulo,
      origem: (ORIGENS_VIDEO as readonly string[]).includes(origem)
        ? origem
        : "IDEIA",
      postoId,
      gravacaoEm,
      publicarAte,
      formato: String(formData.get("formato") ?? "").trim() || null,
      solicitante: String(formData.get("solicitante") ?? "").trim() || null,
      referenciaUrl: String(formData.get("referenciaUrl") ?? "").trim() || null,
      roteiro: String(formData.get("roteiro") ?? "").trim() || null,
      elenco: String(formData.get("elenco") ?? "").trim() || null,
    },
  });
  await registrar({
    userId: u.id,
    acao: "video.criar",
    entidade: "Video",
    entidadeId: video.id,
    detalhe: titulo,
  });
  revalidatePath("/videos");
  return { ok: true };
}

export async function moverVideo(formData: FormData): Promise<void> {
  const u = await exigirMkt();
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return;

  const i = ETAPAS_VIDEO.indexOf(video.etapa as (typeof ETAPAS_VIDEO)[number]);
  const j = dir === "prev" ? i - 1 : i + 1;
  const destino = String(formData.get("etapa") ?? "");
  const nova = ETAPAS_VIDEO.find((etapa) => etapa === destino) ??
    ETAPAS_VIDEO[Math.max(0, Math.min(j, ETAPAS_VIDEO.length - 1))];
  if (nova === video.etapa) return;
  await prisma.video.update({
    where: { id },
    data: { etapa: nova, publicadoEm: nova === "PUBLICADO" ? new Date() : null },
  });
  await registrar({
    userId: u.id,
    acao: "video.mover",
    entidade: "Video",
    entidadeId: id,
    detalhe: nova,
  });
  revalidatePath("/videos");
}

export async function votarVideo(formData: FormData): Promise<void> {
  await exigirMkt();
  const id = String(formData.get("id") ?? "");
  await prisma.video.update({
    where: { id },
    data: { votos: { increment: 1 } },
  });
  revalidatePath("/videos");
}

// ---------- E-Stop (pontos de recarga) ----------

export async function criarPonto(
  _prev: ProducaoState,
  formData: FormData,
): Promise<ProducaoState> {
  const u = await exigirMkt();
  const postoId = String(formData.get("postoId") ?? "").trim();
  if (!postoId) return { erro: "Escolha o posto." };

  const potenciaKw = parseFloat(String(formData.get("potenciaKw") ?? ""));
  const ponto = await prisma.pontoEStop.create({
    data: {
      postoId,
      numCarregadores: num(formData.get("numCarregadores")) || 1,
      potenciaKw: Number.isFinite(potenciaKw) ? potenciaKw : null,
      conector: String(formData.get("conector") ?? "").trim() || null,
      horario: String(formData.get("horario") ?? "").trim() || null,
    },
  });
  await registrar({
    userId: u.id,
    acao: "estop.criar",
    entidade: "PontoEStop",
    entidadeId: ponto.id,
  });
  revalidatePath("/estop");
  return { ok: true };
}

export async function mudarStatusPonto(formData: FormData): Promise<void> {
  await exigirMkt();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!(STATUS_ESTOP as readonly string[]).includes(status)) return;
  await prisma.pontoEStop.update({ where: { id }, data: { status } });
  revalidatePath("/estop");
}

// ---------- Influenciadores e parcerias ----------

export async function criarInfluenciador(
  _prev: ProducaoState,
  formData: FormData,
): Promise<ProducaoState> {
  const u = await exigirMkt();
  const nome = String(formData.get("nome") ?? "").trim();
  if (nome.length < 2) return { erro: "Informe o nome." };

  const inf = await prisma.influenciador.create({
    data: {
      nome,
      arroba: String(formData.get("arroba") ?? "").trim() || null,
      nicho: String(formData.get("nicho") ?? "").trim() || null,
      seguidores: num(formData.get("seguidores")),
      whatsapp:
        String(formData.get("whatsapp") ?? "").replace(/\D/g, "") || null,
      regiao: String(formData.get("regiao") ?? "").trim() || null,
      quemIndicou: String(formData.get("quemIndicou") ?? "").trim() || null,
    },
  });
  await registrar({
    userId: u.id,
    acao: "influenciador.criar",
    entidade: "Influenciador",
    entidadeId: inf.id,
    detalhe: nome,
  });
  redirect(`/influenciadores/${inf.id}`);
}

export async function criarParceria(
  _prev: ProducaoState,
  formData: FormData,
): Promise<ProducaoState> {
  const u = await exigirMkt();
  const influenciadorId = String(formData.get("influenciadorId") ?? "");
  const tipo = String(formData.get("tipo") ?? "PERMUTA");
  if (!influenciadorId) return { erro: "Influenciador inválido." };
  if (!(TIPOS_PARCERIA as readonly string[]).includes(tipo))
    return { erro: "Tipo inválido." };

  const parceria = await prisma.parceria.create({
    data: {
      influenciadorId,
      tipo,
      entregaveis: String(formData.get("entregaveis") ?? "").trim() || null,
      postoAtivacaoId:
        String(formData.get("postoAtivacaoId") ?? "").trim() || null,
      cupom: String(formData.get("cupom") ?? "").trim() || null,
    },
  });
  await registrar({
    userId: u.id,
    acao: "parceria.criar",
    entidade: "Parceria",
    entidadeId: parceria.id,
  });
  revalidatePath(`/influenciadores/${influenciadorId}`);
  return { ok: true };
}

export async function mudarStatusParceria(formData: FormData): Promise<void> {
  await exigirMkt();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const influenciadorId = String(formData.get("influenciadorId") ?? "");
  if (!(STATUS_PARCERIA as readonly string[]).includes(status)) return;
  await prisma.parceria.update({ where: { id }, data: { status } });
  revalidatePath(`/influenciadores/${influenciadorId}`);
}
