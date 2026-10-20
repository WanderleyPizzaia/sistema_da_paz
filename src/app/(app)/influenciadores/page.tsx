import Link from "next/link";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import NovoInfluenciadorForm from "./NovoInfluenciadorForm";

export default async function InfluenciadoresPage() {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const influs = await prisma.influenciador.findMany({
    include: { _count: { select: { parcerias: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Influenciadores</h1>
        <p className="text-sm text-gray-500">
          Parcerias com creators. Cada parceria tem cupom/QR para medir
          resultado.
        </p>
      </div>

      {influs.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {influs.map((i) => (
            <Link
              key={i.id}
              href={`/influenciadores/${i.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-[var(--paz-navy)]"
            >
              <h3 className="font-semibold text-gray-900">{i.nome}</h3>
              <p className="text-xs text-gray-500">
                {[i.arroba, i.nicho].filter(Boolean).join(" · ") || "—"}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <span>{i.seguidores.toLocaleString("pt-BR")} seguidores</span>
                <span>· {i._count.parcerias} parceria(s)</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">
          Novo influenciador
        </h2>
        <NovoInfluenciadorForm />
      </section>
    </div>
  );
}
