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
    include: { posto: true, campanha: { select: { nome: true, tipo: true, premio: true, regulamentoUrl: true } } },
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

  const premio = qr.campanha?.premio ?? qr.premio;
  const titulo = premio ? `Concorra a ${premio} abastecendo na Rede Paz` : (qr.campanha?.nome ?? qr.campanhaNome ?? "Cadastre-se na Rede Paz");
  const regulamento = qr.campanha?.regulamentoUrl;


  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paz-navy)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-paz.png"
            alt="PAZ"
            className="mx-auto h-8 w-auto"
          />
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="bg-[var(--paz-red)] px-6 py-5 text-white">
            <p className="mb-2 inline-block rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">Você está no {qr.posto.nome}{qr.bomba && " · " + qr.bomba}</p>
            <h1 className="text-xl font-bold leading-tight">
              {titulo}
            </h1>

          </div>
          <div className="p-6">
            <p className="mb-4 text-sm text-gray-600">
              Preencha seus dados para participar. O aceite de ofertas por WhatsApp é opcional.
            </p>
            {regulamento && /^https?:\/\//i.test(regulamento) && <a href={regulamento} target="_blank" rel="noreferrer" className="mb-4 inline-block text-sm font-semibold underline">Ler regulamento do sorteio</a>}
            <LandingForm token={token} />
          </div>
        </div>
      </div>
    </main>
  );
}
