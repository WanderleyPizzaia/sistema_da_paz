"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exigir, podeOperarMarketing } from "@/lib/authz";
import { registrar } from "@/lib/audit";

function novoToken(): string {
  return randomBytes(6).toString("hex"); // 12 caracteres
}

// Criar QR Code de captacao para um posto (ADM e Marketing).
export async function criarQR(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const postoId = String(formData.get("postoId") ?? "");
  const bomba = String(formData.get("bomba") ?? "").trim() || null;
  const campanhaId = String(formData.get("campanhaId") ?? "").trim() || null;
  const campanhaNome = String(formData.get("campanhaNome") ?? "").trim() || null;
  const premio = String(formData.get("premio") ?? "").trim() || null;
  if (!postoId) return;

  const qr = await prisma.qRCode.create({
    data: { postoId, bomba, campanhaId, campanhaNome, premio, token: novoToken() },
  });
  await registrar({
    userId: u.id,
    acao: "qr.criar",
    entidade: "QRCode",
    entidadeId: qr.id,
    detalhe: bomba ?? "",
  });

  revalidatePath(`/postos/${postoId}`);
}

// Ativar/desativar QR Code.
export async function alternarQR(formData: FormData): Promise<void> {
  const u = await requireUser();
  exigir(podeOperarMarketing(u));

  const qrId = String(formData.get("qrId") ?? "");
  const qr = await prisma.qRCode.findUnique({ where: { id: qrId } });
  if (!qr) return;

  await prisma.qRCode.update({
    where: { id: qrId },
    data: { ativo: !qr.ativo },
  });
  revalidatePath(`/postos/${qr.postoId}`);
}
