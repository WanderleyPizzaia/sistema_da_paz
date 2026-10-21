import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { isAdm } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import EditarPostoForm from "./EditarPostoForm";

export default async function EditarPostoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await requireUser();
  if (!isAdm(u)) return <SemAcesso />;

  const posto = await prisma.posto.findUnique({ where: { id } });
  if (!posto) notFound();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href={`/postos/${posto.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {posto.nome}
        </Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Editar posto</h1>
      </div>
      <EditarPostoForm
        posto={{
          id: posto.id,
          nome: posto.nome,
          bandeira: posto.bandeira,
          etapa: posto.etapa,
          endereco: posto.endereco,
        }}
      />
    </div>
  );
}
