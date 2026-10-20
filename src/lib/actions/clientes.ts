"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exigir, podeEditarClientes } from "@/lib/authz";
import { registrar } from "@/lib/audit";
import { TIPOS_VEICULO, POLITICA_VERSAO, numeroSorte } from "@/lib/enums";

function soDigitos(v: string): string {
  return (v || "").replace(/\D/g, "");
}

function veiculoValido(v: string): string | null {
  return (TIPOS_VEICULO as readonly string[]).includes(v) ? v : null;
}

// ---------- Landing publica (tela 06) ----------

export type LandingState = {
  ok?: boolean;
  nome?: string;
  numeroSorte?: string;
  erro?: string;
};

export async function cadastroPublico(
  _prev: LandingState,
  formData: FormData,
): Promise<LandingState> {
  const token = String(formData.get("token") ?? "");
  const qr = await prisma.qRCode.findUnique({
    where: { token },
    include: { posto: true, campanha: true },
  });
  if (!qr || !qr.ativo) return { erro: "QR Code inválido ou inativo." };

  const nome = String(formData.get("nome") ?? "").trim();
  const whatsapp = soDigitos(String(formData.get("whatsapp") ?? ""));
  const email = String(formData.get("email") ?? "").trim() || null;
  const tipoVeiculo = veiculoValido(String(formData.get("tipoVeiculo") ?? ""));
  const aceitaRegulamento = formData.get("regulamento") === "on";
  const aceitaMarketing = formData.get("marketing") === "on";

  if (nome.length < 2) return { erro: "Informe seu nome." };
  if (whatsapp.length < 10)
    return { erro: "Informe um WhatsApp válido com DDD." };
  if (!aceitaRegulamento)
    return { erro: "É preciso aceitar o regulamento para participar." };

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;

  const cliente = await prisma.cliente.upsert({
    where: { whatsapp },
    create: {
      nome,
      whatsapp,
      email,
      tipoVeiculo,
      postoPreferidoId: qr.postoId,
      origem: `QR:${qr.posto.nome}`,
    },
    update: {
      nome,
      email: email ?? undefined,
      tipoVeiculo: tipoVeiculo ?? undefined,
    },
  });

  await prisma.consentimento.createMany({
    data: [
      {
        clienteId: cliente.id,
        finalidade: "REGULAMENTO",
        aceito: true,
        politicaVersao: POLITICA_VERSAO,
        ip,
      },
      {
        clienteId: cliente.id,
        finalidade: "MARKETING_WHATSAPP",
        aceito: aceitaMarketing,
        politicaVersao: POLITICA_VERSAO,
        ip,
      },
    ],
  });

  await prisma.eventoCliente.create({
    data: {
      clienteId: cliente.id,
      tipo: "CADASTRO",
      detalhe: qr.bomba ? `Bomba: ${qr.bomba}` : "Landing do QR",
      postoId: qr.postoId,
      qrCodeId: qr.id,
    },
  });

  // Se o QR está ligado a uma campanha de sorteio, gera o número da sorte.
  let numero: string | undefined;
  if (qr.campanha && qr.campanha.tipo === "SORTEIO") {
    const existente = await prisma.participacao.findUnique({
      where: {
        clienteId_campanhaId: {
          clienteId: cliente.id,
          campanhaId: qr.campanha.id,
        },
      },
    });
    if (existente) {
      numero = existente.numeroSorte;
    } else {
      const qtd = await prisma.participacao.count({
        where: { campanhaId: qr.campanha.id },
      });
      numero = numeroSorte(qtd + 1);
      await prisma.participacao.create({
        data: {
          clienteId: cliente.id,
          campanhaId: qr.campanha.id,
          numeroSorte: numero,
          canal: "QR",
        },
      });
      // Automação CADASTRO_QR ativa responde com o número da sorte (simulado).
      const auto = await prisma.automacao.findFirst({
        where: { gatilho: "CADASTRO_QR", ativo: true },
      });
      if (auto) {
        await prisma.eventoCliente.create({
          data: {
            clienteId: cliente.id,
            tipo: "MENSAGEM",
            detalhe: `Número da sorte enviado: ${numero}`,
            postoId: qr.postoId,
          },
        });
      }
    }
  }

  return { ok: true, nome, numeroSorte: numero };
}

// ---------- CRM: criar/editar/excluir (so ADM) ----------

export type ClienteState = { ok?: boolean; erro?: string };

export async function criarClienteManual(
  _prev: ClienteState,
  formData: FormData,
): Promise<ClienteState> {
  const u = await requireUser();
  exigir(podeEditarClientes(u));

  const nome = String(formData.get("nome") ?? "").trim();
  const whatsapp = soDigitos(String(formData.get("whatsapp") ?? ""));
  const email = String(formData.get("email") ?? "").trim() || null;
  const tipoVeiculo = veiculoValido(String(formData.get("tipoVeiculo") ?? ""));
  const postoPreferidoId =
    String(formData.get("postoPreferidoId") ?? "").trim() || null;
  const tags = String(formData.get("tags") ?? "").trim() || null;

  if (nome.length < 2) return { erro: "Informe o nome." };
  if (whatsapp.length < 10) return { erro: "WhatsApp inválido (com DDD)." };

  const existe = await prisma.cliente.findUnique({ where: { whatsapp } });
  if (existe) return { erro: "Já existe um cliente com esse WhatsApp." };

  const cliente = await prisma.cliente.create({
    data: {
      nome,
      whatsapp,
      email,
      tipoVeiculo,
      postoPreferidoId,
      tags,
      origem: "MANUAL",
    },
  });
  await prisma.eventoCliente.create({
    data: { clienteId: cliente.id, tipo: "CADASTRO", detalhe: "Cadastro manual" },
  });
  await registrar({
    userId: u.id,
    acao: "cliente.criar",
    entidade: "Cliente",
    entidadeId: cliente.id,
    detalhe: nome,
  });

  redirect(`/clientes/${cliente.id}`);
}

export async function editarCliente(
  _prev: ClienteState,
  formData: FormData,
): Promise<ClienteState> {
  const u = await requireUser();
  exigir(podeEditarClientes(u));

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const tipoVeiculo = veiculoValido(String(formData.get("tipoVeiculo") ?? ""));
  const postoPreferidoId =
    String(formData.get("postoPreferidoId") ?? "").trim() || null;
  const tags = String(formData.get("tags") ?? "").trim() || null;

  if (nome.length < 2) return { erro: "Informe o nome." };

  await prisma.cliente.update({
    where: { id },
    data: { nome, email, tipoVeiculo, postoPreferidoId, tags },
  });
  await prisma.eventoCliente.create({
    data: { clienteId: id, tipo: "EDICAO", detalhe: "Dados atualizados no CRM" },
  });
  await registrar({
    userId: u.id,
    acao: "cliente.editar",
    entidade: "Cliente",
    entidadeId: id,
  });

  revalidatePath(`/clientes/${id}`);
  return { ok: true };
}

export async function excluirCliente(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeEditarClientes(u));

  const id = String(formData.get("id") ?? "");
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) return;

  await prisma.cliente.delete({ where: { id } });
  await registrar({
    userId: u.id,
    acao: "cliente.excluir",
    entidade: "Cliente",
    entidadeId: id,
    detalhe: `LGPD: ${cliente.nome} (${cliente.whatsapp})`,
  });

  redirect("/clientes");
}
