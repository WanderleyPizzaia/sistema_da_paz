import Image from "next/image";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { gerarQrWhatsappPosto } from "@/lib/actions/qrcodes";
import { origemQrWhatsapp, whatsappOficial } from "@/lib/qr-whatsapp";

export default async function QrWhatsappPostos() {
  const origem = origemQrWhatsapp();
  const pronto = Boolean(origem && whatsappOficial());
  const postos = await prisma.posto.findMany({
    select: { id: true, nome: true, qrWhatsapp: true },
    orderBy: { nome: "asc" },
  });

  return (
    <section id="qr-whatsapp" className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="text-xl font-bold">QR Codes de WhatsApp por posto</h2>
      <p className="mt-1 text-sm text-gray-600">Cada posto tem seu próprio código. O contador registra quantas vezes o link abriu o WhatsApp oficial.</p>
      {!pronto && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Configure o número oficial e o endereço do CRM para liberar os QR Codes para uso.</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {await Promise.all(postos.map(async (posto) => {
          const qr = posto.qrWhatsapp;
          const imagem = qr && pronto
            ? await QRCode.toDataURL(origem + "/qr-whatsapp/" + qr.token, { width: 600, margin: 4, errorCorrectionLevel: "M" })
            : null;
          return (
            <article key={posto.id} className="rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold">{posto.nome}</h3>
              {qr ? (
                <>
                  <p className="text-sm text-gray-600">{qr.acessos.toLocaleString("pt-BR")} {qr.acessos === 1 ? "acesso" : "acessos"}</p>
                  {imagem && <>
                    <Image src={imagem} width={144} height={144} unoptimized alt={`QR Code de WhatsApp de ${posto.nome}`} />
                    <a href={imagem} download={`qr-whatsapp-${posto.id}.png`} className="text-sm font-semibold underline">Baixar QR Code (PNG)</a>
                  </>}
                </>
              ) : (
                <form action={gerarQrWhatsappPosto} className="mt-3">
                  <input type="hidden" name="postoId" value={posto.id} />
                  <button className="rounded-lg bg-[#304299] px-3 py-2 text-sm font-semibold text-white">Gerar QR Code</button>
                </form>
              )}
            </article>
          );
        }))}
      </div>
      {!postos.length && <p className="text-sm text-gray-500">Nenhum posto cadastrado.</p>}
    </section>
  );
}
