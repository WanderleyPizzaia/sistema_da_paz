import { prisma } from "@/lib/prisma";
import LandingForm from "./LandingForm";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const qr = await prisma.qRCode.findUnique({
    where: { token },
    include: { posto: true },
  });

  if (!qr || !qr.ativo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paz-navy)] p-4">
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center">
          <p className="font-semibold text-gray-900">QR Code indisponível</p>
          <p className="mt-1 text-sm text-gray-500">
            Este QR Code não existe ou foi desativado.
          </p>
        </div>
      </main>
    );
  }

  const premio = qr.premio ?? "prêmios";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paz-navy)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 text-center">
          <span className="text-2xl font-black tracking-wide text-white">
            PAZ
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="bg-[var(--paz-red)] px-6 py-5 text-white">
            <h1 className="text-xl font-bold leading-tight">
              Concorra a {premio} abastecendo na Rede Paz
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {qr.posto.nome}
              {qr.bomba ? ` · ${qr.bomba}` : ""}
            </p>
          </div>
          <div className="p-6">
            <p className="mb-4 text-sm text-gray-600">
              Cadastre-se para participar. É rápido e você recebe as ofertas no
              WhatsApp.
            </p>
            <LandingForm token={token} />
          </div>
        </div>
      </div>
    </main>
  );
}
