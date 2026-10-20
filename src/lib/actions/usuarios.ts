"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exigir, podeGerenciarUsuarios } from "@/lib/authz";
import { registrar } from "@/lib/audit";
import { ROLES, FUNCOES_MARKETING } from "@/lib/enums";

function soDigitos(v: string): string {
  return (v || "").replace(/\D/g, "");
}

export type UsuarioState = { ok?: boolean; erro?: string };

// Criar usuario (so ADM).
export async function criarUsuario(
  _prev: UsuarioState,
  formData: FormData,
): Promise<UsuarioState> {
  const u = await requireUser();
  exigir(podeGerenciarUsuarios(u));

  const nome = String(formData.get("nome") ?? "").trim();
  const whatsapp = soDigitos(String(formData.get("whatsapp") ?? ""));
  const role = String(formData.get("role") ?? "MARKETING");
  const funcao = String(formData.get("funcao") ?? "").trim() || null;
  const postoId = String(formData.get("postoId") ?? "").trim() || null;

  if (nome.length < 2) return { erro: "Informe o nome." };
  if (whatsapp.length < 10) return { erro: "WhatsApp inválido (com DDD)." };
  if (!(ROLES as readonly string[]).includes(role))
    return { erro: "Perfil inválido." };
  if (role === "GERENTE" && !postoId)
    return { erro: "Gerente precisa estar vinculado a um posto." };
  if (
    role === "MARKETING" &&
    funcao &&
    !(FUNCOES_MARKETING as readonly string[]).includes(funcao)
  )
    return { erro: "Função de marketing inválida." };

  const jaExiste = await prisma.user.findUnique({ where: { whatsapp } });
  if (jaExiste) return { erro: "Já existe um usuário com esse WhatsApp." };

  const novo = await prisma.user.create({
    data: {
      nome,
      whatsapp,
      role,
      funcao: role === "MARKETING" ? funcao : null,
      postoId: role === "GERENTE" ? postoId : null,
    },
  });
  await registrar({
    userId: u.id,
    acao: "usuario.criar",
    entidade: "User",
    entidadeId: novo.id,
    detalhe: `${nome} (${role})`,
  });

  revalidatePath("/usuarios");
  return { ok: true };
}

// Ativar/desativar usuario (so ADM). Nao permite desativar a si mesmo.
export async function alternarAtivo(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeGerenciarUsuarios(u));

  const userId = String(formData.get("userId") ?? "");
  if (userId === u.id) return; // nao se auto-desativa

  const alvo = await prisma.user.findUnique({ where: { id: userId } });
  if (!alvo) return;

  await prisma.user.update({
    where: { id: userId },
    data: { ativo: !alvo.ativo },
  });

  if (alvo.ativo) {
    // Desativou: derruba as sessoes ativas na hora.
    await prisma.session.deleteMany({ where: { userId } });
  }
  await registrar({
    userId: u.id,
    acao: alvo.ativo ? "usuario.desativar" : "usuario.reativar",
    entidade: "User",
    entidadeId: userId,
    detalhe: alvo.nome,
  });

  revalidatePath("/usuarios");
}
