import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { aprovarFoto, pedirRefazer, cobrarPosto } from "@/lib/actions/gerente";

type Acao = {
  id: string;
  status: string;
  data: Date | null;
  fotoEnviada: boolean;
  fotoAprovada: boolean;
};

function statusPosto(acoes: Acao[]): { label: string; cor: string } {
  if (acoes.length === 0) return { label: "Sem ações", cor: "#9ca3af" };
  const feitas = acoes.filter((a) => a.status === "FEITA").length;
  const atrasadas = acoes.filter(
    (a) => a.status !== "FEITA" && a.data && new Date(a.data) < new Date(),
  ).length;
  if (feitas === acoes.length) return { label: "Funcionando", cor: "#16a34a" };
  if (atrasadas > 0) return { label: "Atrasado", cor: "#dc2626" };
  return { label: "Sem retorno", cor: "#eab308" };
}

export default async function OperacaoPage() {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const postos = await prisma.posto.findMany({
    include: { acoes: true },
    orderBy: { nome: "asc" },
  });

  const todas = postos.flatMap((p) => p.acoes);
  const totalAcoes = todas.length;
  const feitasComFoto = todas.filter(
    (a) => a.status === "FEITA" && a.fotoEnviada,
  ).length;
  const pct = totalAcoes ? Math.round((feitasComFoto / totalAcoes) * 100) : 0;
  const atrasadas = todas.filter(
    (a) => a.status !== "FEITA" && a.data && new Date(a.data) < new Date(),
  ).length;
  const semRetorno = postos.filter(
    (p) => statusPosto(p.acoes).label === "Sem retorno",
  ).length;

  const aguardandoAprovacao = postos.flatMap((p) =>
    p.acoes
      .filter((a) => a.status === "FEITA" && a.fotoEnviada && !a.fotoAprovada)
      .map((a) => ({ ...a, postoNome: p.nome })),
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          As ações locais estão rodando?
        </h1>
        <p className="text-sm text-gray-500">
          Execução das ações nos postos, calculada automaticamente.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat titulo="Concluídas (c/ foto)" valor={`${pct}%`} />
        <Stat titulo="Ações atrasadas" valor={atrasadas} cor="#dc2626" />
        <Stat titulo="Postos sem retorno" valor={semRetorno} cor="#eab308" />
        <Stat titulo="Postos" valor={postos.length} />
      </div>

      {/* Por posto */}
      <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Posto</th>
              <th className="px-4 py-3 font-medium">Ações feitas</th>
              <th className="px-4 py-3 font-medium">Fotos</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {postos.map((p) => {
              const sp = statusPosto(p.acoes);
              const feitas = p.acoes.filter((a) => a.status === "FEITA").length;
              const fotos = p.acoes.filter((a) => a.fotoEnviada).length;
              const precisaCobrar =
                sp.label === "Sem retorno" || sp.label === "Atrasado";
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.nome}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {feitas}/{p.acoes.length}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fotos}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: sp.cor }}
                    >
                      {sp.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {precisaCobrar && (
                      <form action={cobrarPosto}>
                        <input type="hidden" name="postoId" value={p.id} />
                        <button className="text-xs font-medium text-[var(--paz-navy)] hover:underline">
                          Cobrar no WhatsApp
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Fotos aguardando aprovação */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">
          Fotos aguardando aprovação
        </h2>
        {aguardandoAprovacao.length === 0 ? (
          <p className="text-sm text-gray-500">Nada para aprovar agora.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {aguardandoAprovacao.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {a.titulo}
                  </p>
                  <p className="text-xs text-gray-500">{a.postoNome}</p>
                </div>
                <div className="flex gap-2">
                  <form action={aprovarFoto}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
                      Aprovar foto
                    </button>
                  </form>
                  <form action={pedirRefazer}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      Pedir para refazer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string | number;
  cor?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="text-2xl font-bold" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
    </div>
  );
}
