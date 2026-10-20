import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  mesRefAtual,
  formatBRL,
  ETAPAS,
  ETAPA_LABEL,
} from "@/lib/enums";

const PILARES = [
  { titulo: "Perto e aberto", desc: "Loja no posto, de bairro, aberta até tarde." },
  { titulo: "Café quente e padaria", desc: "Café fresco e pão quente puxam o movimento." },
  { titulo: "Reposição rápida", desc: "Itens do dia a dia sempre na prateleira." },
  { titulo: "Combos e ofertas", desc: "Ofertas da semana e combos divulgados no WhatsApp." },
];

export default async function Paz365Page() {
  const u = await requireUser();
  void u;
  const mes = mesRefAtual();

  const [postos, mix] = await Promise.all([
    prisma.posto.findMany({
      include: { metricas: { where: { mes } } },
      orderBy: { nome: "asc" },
    }),
    prisma.mixCategoria.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  const lojas = postos.filter((p) => p.bandeira === "PAZ365");
  const emOperacao = lojas.filter((p) => p.etapa === "OPERACAO");
  const vendasSemana = lojas.reduce(
    (s, p) => s + (p.metricas[0]?.vendas ?? 0),
    0,
  );
  const comTicket = lojas.filter((p) => p.metricas[0]?.ticketMedio);
  const ticketMedio =
    comTicket.length > 0
      ? comTicket.reduce((s, p) => s + (p.metricas[0]?.ticketMedio ?? 0), 0) /
        comTicket.length
      : 0;

  const porEtapa = ETAPAS.map((e) => ({
    etapa: e,
    label: ETAPA_LABEL[e],
    postos: postos.filter((p) => p.etapa === e),
  }));
  const maxMix = Math.max(1, ...mix.map((m) => m.participacao));

  return (
    <div className="p-6 lg:p-8">
      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-[var(--paz-red)] p-6 text-white">
        <h1 className="text-2xl font-black">PAZ365</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/85">
          De loja de conveniência do posto para uma rede de mini mercados de
          bairro, perto de casa, com café quente e reposição rápida.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Hero titulo="Lojas em operação" valor={emOperacao.length} />
          <Hero titulo="Vendas no mês" valor={formatBRL(vendasSemana)} />
          <Hero titulo="Ticket médio" valor={formatBRL(ticketMedio)} />
        </div>
      </div>

      {/* Pilares */}
      <section className="mb-6">
        <h2 className="mb-3 font-semibold text-gray-900">
          Pilares do mini mercado PAZ365
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PILARES.map((p) => (
            <div
              key={p.titulo}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <h3 className="text-sm font-semibold text-gray-900">{p.titulo}</h3>
              <p className="mt-1 text-xs text-gray-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mapa de expansão */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Mapa de expansão</h2>
          <div className="space-y-3">
            {porEtapa.map((e) => (
              <div key={e.etapa}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{e.label}</span>
                  <span className="text-gray-500">{e.postos.length}</span>
                </div>
                {e.postos.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {e.postos.map((p) => p.nome).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Mix por categoria */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">
            Mix por categoria
          </h2>
          {mix.length === 0 ? (
            <p className="text-sm text-gray-500">Sem dados de mix ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {mix.map((m) => (
                <div key={m.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-700">
                      {m.categoria}
                      {m.ehNovo && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          teste
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {m.participacao.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2.5 rounded-full bg-[var(--paz-navy)]"
                      style={{ width: `${(m.participacao / maxMix) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Lojas em operação */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Lojas em operação</h2>
        {emOperacao.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma loja PAZ365 em operação.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-2 py-2 font-medium">Loja</th>
                <th className="px-2 py-2 font-medium">Vendas (mês)</th>
                <th className="px-2 py-2 font-medium">Ticket médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {emOperacao.map((p) => (
                <tr key={p.id}>
                  <td className="px-2 py-2 font-medium text-gray-900">
                    {p.nome}
                  </td>
                  <td className="px-2 py-2 text-gray-600">
                    {p.metricas[0] ? formatBRL(p.metricas[0].vendas) : "—"}
                  </td>
                  <td className="px-2 py-2 text-gray-600">
                    {p.metricas[0]
                      ? formatBRL(p.metricas[0].ticketMedio)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Hero({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-3">
      <p className="text-xs text-white/70">{titulo}</p>
      <p className="mt-0.5 text-lg font-bold">{valor}</p>
    </div>
  );
}
