import Link from "next/link";
import { requireUser } from "@/lib/session";
import { isAdm } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import NovoPostoForm from "./NovoPostoForm";

export default async function NovoPostoPage() {
  const u = await requireUser();
  if (!isAdm(u)) return <SemAcesso />;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/postos"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Postos
        </Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Novo posto</h1>
      </div>
      <NovoPostoForm />
    </div>
  );
}
