import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { mudarStatusPonto } from "@/lib/actions/producao";
import { STATUS_ESTOP, STATUS_ESTOP_INFO } from "@/lib/enums";
import NovoPontoForm from "./NovoPontoForm";

export default async function EStopPage() {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const [pontos, postos] = await Promise.all([
    prisma.pontoEStop.findMany({
      include: { posto: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.posto.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          E-Stop · carregamento elétrico
        </h1>
        <p className="text-sm text-gray-500">
          Pontos de recarga da rede. Clientes com carro elétrico viram segmento
          para disparos.
        </p>
      </div>

      {pontos.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pontos.map((p) => {
            const info = STATUS_ESTOP_INFO[p.status];
            return (
              <div
                key={p.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {p.posto?.nome ?? "—"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {[
                        `${p.numCarregadores} carregador(es)`,
                        p.potenciaKw ? `${p.potenciaKw} kW` : null,
                        p.conector,
                        p.horario,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: info?.cor ?? "#6b7280" }}
                  >
                    {info?.label ?? p.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_ESTOP.map((s) => (
                    <form key={s} action={mudarStatusPonto}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value={s} />
                      <button
                        disabled={p.status === s}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          p.status === s
                            ? "bg-gray-200 text-gray-500"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {STATUS_ESTOP_INFO[s].label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Novo ponto de recarga</h2>
        <NovoPontoForm postos={postos} />
      </section>
    </div>
  );
}
