"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exigir, podeOperarMarketing } from "@/lib/authz";
import { registrar } from "@/lib/audit";

export type GerenteState = { ok?: boolean; erro?: string };

// Garante que o usuário é GERENTE e retorna o postoId dele.
async function exigirGerente() {
  const u = await requireUser();
  exigir(u.role === "GERENTE" && !!u.postoId);
  return u;
}

// ---------- Gerente: ações locais ----------

// Marca uma ação do próprio posto como feita (com foto simulada).
export async function marcarAcaoFeita(formData: FormData): Promise<void> {
  const u = await exigirGerente();
  const id = String(formData.get("id") ?? "");
  const acao = await prisma.acaoMarketing.findUnique({ where: { id } });
  if (!acao || acao.postoId !== u.postoId) return;

  await prisma.acaoMarketing.update({
    where: { id },
    data: { status: "FEITA", fotoEnviada: true, feitaEm: new Date() },
  });
  await registrar({
    userId: u.id,
    acao: "gerente.acao.feita",
    entidade: "AcaoMarketing",
    entidadeId: id,
    detalhe: acao.titulo,
  });
  revalidatePath("/gerente");
}

// ---------- Gerente: pedido ao marketing ----------

export async function criarPedidoGerente(
  _prev: GerenteState,
  formData: FormData,
): Promise<GerenteState> {
  const u = await exigirGerente();
  const tipo = String(formData.get("tipo") ?? "ARTE");
  const material = String(formData.get("material") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();

  if (descricao.length < 3) return { erro: "Explique o pedido." };
  const titulo = material || descricao.slice(0, 60);

  if (tipo === "VIDEO") {
    await prisma.video.create({
      data: {
        titulo,
        origem: "PEDIDO",
        etapa: "IDEIA",
        postoId: u.postoId,
        roteiro: descricao,
      },
    });
  } else {
    const qtd = await prisma.pedidoArte.count();
    await prisma.pedidoArte.create({
      data: {
        numero: qtd + 1,
        postoId: u.postoId,
        acao: titulo,
        descricao,
        prazo: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }
  await registrar({
    userId: u.id,
    acao: "gerente.pedido.criar",
    entidade: tipo === "VIDEO" ? "Video" : "PedidoArte",
    detalhe: titulo,
  });

  revalidatePath("/gerente");
  return { ok: true };
}

// ---------- Admin / Marketing: operação das ações locais (tela 19) ----------

export async function aprovarFoto(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));
  const id = String(formData.get("id") ?? "");
  await prisma.acaoMarketing.update({
    where: { id },
    data: { fotoAprovada: true },
  });
  await registrar({
    userId: u.id,
    acao: "foto.aprovar",
    entidade: "AcaoMarketing",
    entidadeId: id,
  });
  revalidatePath("/operacao");
}

export async function pedirRefazer(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));
  const id = String(formData.get("id") ?? "");
  await prisma.acaoMarketing.update({
    where: { id },
    data: {
      status: "PLANEJADA",
      fotoEnviada: false,
      fotoAprovada: false,
      feitaEm: null,
    },
  });
  await registrar({
    userId: u.id,
    acao: "foto.refazer",
    entidade: "AcaoMarketing",
    entidadeId: id,
  });
  revalidatePath("/operacao");
}

// Cobrança no WhatsApp (simulada) para um posto sem retorno.
export async function cobrarPosto(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));
  const postoId = String(formData.get("postoId") ?? "");
  await registrar({
    userId: u.id,
    acao: "posto.cobrar",
    entidade: "Posto",
    entidadeId: postoId,
    detalhe: "Cobrança simulada no WhatsApp",
  });
  revalidatePath("/operacao");
}
