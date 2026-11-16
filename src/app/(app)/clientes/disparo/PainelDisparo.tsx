import Link from "next/link";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import DisparoForm from "./DisparoForm";

type Busca = { q?: string; veiculo?: string; posto?: string };

export async function PainelDisparo({
  searchParams,
  dentroWhatsapp = false,
}: {
  searchParams: Promise<Busca>;
  dentroWhatsapp?: boolean;
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

  const [elegiveis, postos, modelos] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.posto.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.modeloMensagem.findMany({
      where: { statusMeta: "APROVADO" },
      select: { id: true, nome: true },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        {!dentroWhatsapp && <Link
          href="/clientes"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Clientes
        </Link>}
        <h1 className="mt-1 text-xl font-bold text-gray-900">
          Novo disparo de WhatsApp
        </h1>
        <p className="text-sm text-gray-500">
          Dispara um modelo aprovado para o segmento filtrado.
        </p>
      </div>

      {dentroWhatsapp && <form method="get" className="mb-5 flex flex-wrap gap-2">
        <input type="hidden" name="aba" value="disparos" />
        <input name="q" aria-label="Buscar cliente" defaultValue={q} placeholder="Buscar cliente por nome ou WhatsApp" className="min-w-48 rounded-lg border px-3 py-2 text-sm" />
        <select name="posto" aria-label="Filtrar por posto" defaultValue={posto} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Todos os postos</option>
          {postos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </select>
        <select name="veiculo" aria-label="Tipo de veículo" defaultValue={veiculo} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Todos os veículos</option>
          {[["CARRO", "Carro"], ["MOTO", "Moto"], ["ELETRICO", "Elétrico"], ["OUTRO", "Outro"]].map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
        </select>
        <button className="rounded-lg border px-3 py-2 text-sm font-semibold">Aplicar filtro</button>
      </form>}

      <DisparoForm
        modelos={modelos}
        elegiveis={elegiveis}
        filtros={{ q, veiculo, posto }}
      />
    </div>
  );
}
