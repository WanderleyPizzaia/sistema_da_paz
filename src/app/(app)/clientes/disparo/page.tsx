import Link from "next/link";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import DisparoForm from "./DisparoForm";

type Busca = { q?: string; veiculo?: string; posto?: string };

export default async function DisparoPage({
  searchParams,
}: {
  searchParams: Promise<Busca>;
}) {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const { q = "", veiculo = "", posto = "" } = await searchParams;

  const where = {
    AND: [
      q
        ? {
            OR: [
              { nome: { contains: q } },
              { whatsapp: { contains: q.replace(/\D/g, "") || q } },
            ],
          }
        : {},
      veiculo ? { tipoVeiculo: veiculo } : {},
      posto ? { postoPreferidoId: posto } : {},
      {
        consentimentos: {
          some: { finalidade: "MARKETING_WHATSAPP", aceito: true },
        },
      },
    ],
  };

  const [elegiveis, modelos] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.modeloMensagem.findMany({
      where: { statusMeta: "APROVADO" },
      select: { id: true, nome: true },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/clientes"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Clientes
        </Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">
          Enviar WhatsApp em massa
        </h1>
        <p className="text-sm text-gray-500">
          Dispara um modelo aprovado para o segmento filtrado.
        </p>
      </div>

      <DisparoForm
        modelos={modelos}
        elegiveis={elegiveis}
        filtros={{ q, veiculo, posto }}
      />
    </div>
  );
}
