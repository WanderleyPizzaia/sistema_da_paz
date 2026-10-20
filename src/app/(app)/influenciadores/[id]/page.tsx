import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { mudarStatusParceria } from "@/lib/actions/producao";
import {
  TIPO_PARCERIA_LABEL,
  STATUS_PARCERIA,
  STATUS_PARCERIA_LABEL,
} from "@/lib/enums";
import NovaParceriaForm from "./NovaParceriaForm";

export default async function InfluenciadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const inf = await prisma.influenciador.findUnique({
    where: { id },
    include: {
      parcerias: {
        include: { posto: { select: { nome: true } } },
        orderBy: { criadoEm: "desc" },
      },
    },
  });
  if (!inf) notFound();

  const postos = await prisma.posto.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/influenciadores"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Influenciadores
        </Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">{inf.nome}</h1>
        <p className="text-sm text-gray-500">
          {[
            inf.arroba,
            inf.nicho,
            `${inf.seguidores.toLocaleString("pt-BR")} seguidores`,
            inf.regiao,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Parcerias</h2>
          {inf.parcerias.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma parceria ainda.</p>
          ) : (
            <ul className="space-y-3">
              {inf.parcerias.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-gray-100 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {TIPO_PARCERIA_LABEL[p.tipo] ?? p.tipo}
                      {p.posto ? ` · ${p.posto.nome}` : ""}
                    </span>
                    {p.cupom && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        {p.cupom}
                      </span>
                    )}
                  </div>
                  {p.entregaveis && (
                    <p className="mt-1 text-xs text-gray-500">{p.entregaveis}</p>
                  )}
                  <form
                    action={mudarStatusParceria}
                    className="mt-2 flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="hidden"
                      name="influenciadorId"
                      value={inf.id}
                    />
                    <select
                      name="status"
                      defaultValue={p.status}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700"
                    >
                      {STATUS_PARCERIA.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_PARCERIA_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      Salvar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Nova parceria</h2>
          <NovaParceriaForm influenciadorId={inf.id} postos={postos} />
        </section>
      </div>
    </div>
  );
}
