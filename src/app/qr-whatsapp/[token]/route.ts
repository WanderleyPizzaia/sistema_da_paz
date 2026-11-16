import { prisma } from "@/lib/prisma";
import { whatsappOficial } from "@/lib/qr-whatsapp";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const qr = await prisma.qrWhatsappPosto.findUnique({
    where: { token },
    select: { posto: { select: { nome: true } } },
  });
  if (!qr) return new Response("QR Code não encontrado.", { status: 404 });

  const numero = whatsappOficial();
  if (!numero) return new Response("WhatsApp oficial ainda não configurado.", { status: 503 });

  const { count } = await prisma.qrWhatsappPosto.updateMany({
    where: { token }, data: { acessos: { increment: 1 } },
  });
  if (!count) return new Response("QR Code não encontrado.", { status: 404 });

  const texto = "Olá! Escaneei o QR Code no " + qr.posto.nome + ".";
  return new Response(null, {
    status: 302,
    headers: {
      Location: "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto),
      "Cache-Control": "no-store",
    },
  });
}

export async function HEAD() {
  return new Response(null, { status: 405, headers: { Allow: "GET" } });
}
