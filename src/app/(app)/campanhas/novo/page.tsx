import Link from "next/link";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import NovaCampanhaForm from "./NovaCampanhaForm";

export default async function NovaCampanhaPage() {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const postos = await prisma.posto.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/campanhas"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Campanhas
        </Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Nova campanha</h1>
      </div>
      <NovaCampanhaForm postos={postos} />
    </div>
  );
}
