import Link from "next/link";
import { requireUser } from "@/lib/session";
import { podeEditarClientes } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import NovoClienteForm from "./NovoClienteForm";

export default async function NovoClientePage() {
  const u = await requireUser();
  if (!podeEditarClientes(u)) return <SemAcesso />;

  const postos = await prisma.posto.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/clientes"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Clientes
        </Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Novo cliente</h1>
      </div>
      <NovoClienteForm postos={postos} />
    </div>
  );
}
