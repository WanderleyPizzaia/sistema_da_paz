"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { criarSessao, encerrarSessao } from "@/lib/session";
import { registrar } from "@/lib/audit";

// Normaliza WhatsApp para somente digitos.
function soDigitos(v: string): string {
  return (v || "").replace(/\D/g, "");
}

function novoCodigo(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const codigosVisiveis = process.env.LOGIN_CODES_VISIVEIS === "true";

export type LoginState = {
  step: "whatsapp" | "codigo";
  whatsapp?: string;
  codigoDemo?: string;
  erro?: string;
};

// Passo 1: gera o codigo de 6 digitos. Em modo local, mostra o codigo na tela.
export async function solicitarCodigo(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const whatsapp = soDigitos(String(formData.get("whatsapp") ?? ""));
  if (whatsapp.length < 10) {
    return { step: "whatsapp", erro: "Informe um WhatsApp válido com DDD." };
  }

  const user = await prisma.user.findUnique({ where: { whatsapp } });
  if (!user || !user.ativo) {
    return {
      step: "whatsapp",
      whatsapp,
      erro: "Nenhum usuário ativo com esse WhatsApp.",
    };
  }

  const codigo = novoCodigo();
  const expiraEm = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.loginCode.create({ data: { whatsapp, codigo, expiraEm } });
  await registrar({ userId: user.id, acao: "login.codigo.solicitado" });

  // Em producao, aqui entraria o envio via WhatsApp Business API.
  console.log(`\n[LOGIN] Código para ${whatsapp}: ${codigo}\n`);

  return {
    step: "codigo",
    whatsapp,
    codigoDemo: codigosVisiveis ? codigo : undefined,
  };
}

// Passo 2: valida o codigo e abre a sessao.
export async function verificarCodigo(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const whatsapp = soDigitos(String(formData.get("whatsapp") ?? ""));
  const codigo = String(formData.get("codigo") ?? "").trim();

  const registro = await prisma.loginCode.findFirst({
    where: { whatsapp, codigo, usadoEm: null, expiraEm: { gt: new Date() } },
    orderBy: { criadoEm: "desc" },
  });

  if (!registro) {
    return { step: "codigo", whatsapp, erro: "Código inválido ou expirado." };
  }

  const user = await prisma.user.findUnique({ where: { whatsapp } });
  if (!user || !user.ativo) {
    return { step: "whatsapp", erro: "Usuário não encontrado ou inativo." };
  }

  await prisma.loginCode.update({
    where: { id: registro.id },
    data: { usadoEm: new Date() },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { ultimoAcesso: new Date() },
  });
  await criarSessao(user.id);
  await registrar({ userId: user.id, acao: "login.sucesso" });

  redirect("/");
}

export async function logout(): Promise<void> {
  await encerrarSessao();
  redirect("/login");
}
