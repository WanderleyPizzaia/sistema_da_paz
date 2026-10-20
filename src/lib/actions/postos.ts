"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exigir, podeEditarRegistroPosto, podeOperarMarketing } from "@/lib/authz";
import { registrar } from "@/lib/audit";
import {
  BANDEIRAS,
  ETAPAS,
  FAROIS,
  mesRefAtual,
  mesRefAnterior,
  farolAutomatico,
  type Farol,
} from "@/lib/enums";

export type PostoState = { erro?: string };

// Criar posto (so ADM).
export async function criarPosto(
  _prev: PostoState,
  formData: FormData,
): Promise<PostoState> {
  const u = await requireUser();
  exigir(podeEditarRegistroPosto(u));

  const nome = String(formData.get("nome") ?? "").trim();
  const bandeira = String(formData.get("bandeira") ?? "IPIRANGA");
  const etapa = String(formData.get("etapa") ?? "OPERACAO");
  const endereco = String(formData.get("endereco") ?? "").trim() || null;
  const temPaz365 = formData.get("temPaz365") === "on";

  if (nome.length < 2) return { erro: "Informe o nome do posto." };
  if (!(BANDEIRAS as readonly string[]).includes(bandeira))
    return { erro: "Bandeira inválida." };
  if (!(ETAPAS as readonly string[]).includes(etapa))
    return { erro: "Etapa inválida." };

  const posto = await prisma.posto.create({
    data: { nome, bandeira, etapa, endereco, temPaz365 },
  });
  await registrar({
    userId: u.id,
    acao: "posto.criar",
    entidade: "Posto",
    entidadeId: posto.id,
    detalhe: nome,
  });

  redirect(`/postos/${posto.id}`);
}

// Definir o farol do mes atual (ADM e Marketing).
export async function definirFarol(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const postoId = String(formData.get("postoId") ?? "");
  const farol = String(formData.get("farol") ?? "") as Farol;
  const observacao = String(formData.get("observacao") ?? "").trim() || null;
  if (!(FAROIS as readonly string[]).includes(farol)) return;

  const mesRef = mesRefAtual();
  await prisma.postoStatus.upsert({
    where: { postoId_mesRef: { postoId, mesRef } },
    create: { postoId, mesRef, farol, observacao },
    update: { farol, observacao },
  });
  await registrar({
    userId: u.id,
    acao: "farol.definir",
    entidade: "Posto",
    entidadeId: postoId,
    detalhe: `${mesRef}: ${farol}`,
  });

  revalidatePath(`/postos/${postoId}`);
  revalidatePath("/postos");
}

// Define o farol do mês automaticamente, a partir das vendas (PDV).
export async function aplicarFarolAuto(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const postoId = String(formData.get("postoId") ?? "");
  const mes = mesRefAtual();
  const anterior = mesRefAnterior(mes);

  const [mAtual, mAnterior] = await Promise.all([
    prisma.metricaPosto.findUnique({
      where: { postoId_mes: { postoId, mes } },
    }),
    prisma.metricaPosto.findUnique({
      where: { postoId_mes: { postoId, mes: anterior } },
    }),
  ]);

  const farol = farolAutomatico(mAtual?.vendas, mAnterior?.vendas);
  if (!farol) return;

  await prisma.postoStatus.upsert({
    where: { postoId_mesRef: { postoId, mesRef: mes } },
    create: {
      postoId,
      mesRef: mes,
      farol,
      observacao: "Definido automaticamente pelas vendas.",
    },
    update: { farol, observacao: "Definido automaticamente pelas vendas." },
  });
  await registrar({
    userId: u.id,
    acao: "farol.automatico",
    entidade: "Posto",
    entidadeId: postoId,
    detalhe: `${mes}: ${farol}`,
  });

  revalidatePath(`/postos/${postoId}`);
  revalidatePath("/postos");
}

// Criar acao de marketing do posto (ADM e Marketing).
export async function criarAcao(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const postoId = String(formData.get("postoId") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim() || null;
  const responsavel = String(formData.get("responsavel") ?? "").trim() || null;
  const dataStr = String(formData.get("data") ?? "").trim();
  const data = dataStr ? new Date(dataStr) : null;
  if (titulo.length < 2) return;

  await prisma.acaoMarketing.create({
    data: { postoId, titulo, tipo, responsavel, data },
  });
  await registrar({
    userId: u.id,
    acao: "acao.criar",
    entidade: "Posto",
    entidadeId: postoId,
    detalhe: titulo,
  });

  revalidatePath(`/postos/${postoId}`);
}

// Marcar acao como feita / planejada.
export async function alternarAcao(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const acaoId = String(formData.get("acaoId") ?? "");
  const acao = await prisma.acaoMarketing.findUnique({ where: { id: acaoId } });
  if (!acao) return;

  const novo = acao.status === "FEITA" ? "PLANEJADA" : "FEITA";
  await prisma.acaoMarketing.update({
    where: { id: acaoId },
    data: { status: novo },
  });
  await registrar({
    userId: u.id,
    acao: "acao.status",
    entidade: "AcaoMarketing",
    entidadeId: acaoId,
    detalhe: novo,
  });

  revalidatePath(`/postos/${acao.postoId}`);
}
