import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";

const COOKIE = "paz_session";
const DIAS_VALIDADE = 30;

export type SessionUser = {
  id: string;
  nome: string;
  whatsapp: string;
  role: string;
  funcao: string | null;
  postoId: string | null;
};

// Cria sessao no banco e grava o cookie httpOnly.
export async function criarSessao(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + DIAS_VALIDADE * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiraEm } });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEm,
  });
}

// Le a sessao atual (ou null). Checa validade e usuario ativo.
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const sessao = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!sessao || sessao.expiraEm < new Date() || !sessao.user.ativo) {
    return null;
  }

  const u = sessao.user;
  return {
    id: u.id,
    nome: u.nome,
    whatsapp: u.whatsapp,
    role: u.role,
    funcao: u.funcao,
    postoId: u.postoId,
  };
}

// Exige usuario logado; redireciona para /login se nao houver.
export async function requireUser(): Promise<SessionUser> {
  const u = await getSession();
  if (!u) redirect("/login");
  return u;
}

// Encerra a sessao atual.
export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    jar.delete(COOKIE);
  }
}
