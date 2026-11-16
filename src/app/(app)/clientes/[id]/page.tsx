import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { podeVerClientes, podeEditarClientes } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { excluirCliente } from "@/lib/actions/clientes";
import { VEICULO_LABEL, FINALIDADE_LABEL, EVENTO_LABEL } from "@/lib/enums";
import EditarClienteForm from "./EditarClienteForm";

export default async function FichaClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await requireUser();
  if (!podeVerClientes(u)) return <SemAcesso />;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      postoPreferido: { select: { nome: true } },
      consentimentos: { orderBy: { criadoEm: "desc" } },
      eventos: { orderBy: { criadoEm: "desc" }, include: { posto: true } },
    },
  });
  if (!cliente) notFound();

  const podeEditar = podeEditarClientes(u);
  const postos = podeEditar
    ? await prisma.posto.findMany({
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      })
    : [];

  const fmt = (d: Date) =>
    new Date(d).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="min-h-screen bg-[#f4f5fa] p-5 lg:p-8">
      <div className="max-w-[1176px]">
      <Link href="/clientes" className="mb-4 inline-block text-sm font-semibold hover:underline">← Clientes</Link>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-gradient-to-br from-[#344197] to-[#1d245e] p-6 text-white shadow-[0_14px_32px_#293d8d40]">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl font-bold">{cliente.nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase()}</span>
          <div>
            <p className="text-xs tracking-widest text-blue-100">FICHA DO CLIENTE</p>
            <h1 className="text-3xl font-semibold">{cliente.nome}</h1>
            <p className="mt-1 text-sm text-blue-100">{[cliente.whatsapp, cliente.origem, cliente.postoPreferido?.nome].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {podeEditar && <a href="#dados-cliente" className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold !text-white">Editar</a>}
          {cliente.consentimentos.some((item) => item.finalidade === "MARKETING_WHATSAPP" && item.aceito) && (
            <Link href={`/clientes/disparo?q=${encodeURIComponent(cliente.whatsapp)}`} className="rounded-xl bg-[#be2530] px-4 py-2.5 text-sm font-semibold !text-white">Enviar WhatsApp</Link>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dados */}
        <section id="dados-cliente" className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Dados do cliente</h2>
          {podeEditar ? (
            <EditarClienteForm
              cliente={{
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
                tipoVeiculo: cliente.tipoVeiculo,
                postoPreferidoId: cliente.postoPreferidoId,
                tags: cliente.tags,
              }}
              postos={postos}
            />
          ) : (
            <dl className="space-y-2 text-sm">
              <Linha rotulo="WhatsApp" valor={cliente.whatsapp} />
              <Linha rotulo="E-mail" valor={cliente.email ?? "—"} />
              <Linha
                rotulo="Veículo"
                valor={
                  cliente.tipoVeiculo
                    ? (VEICULO_LABEL[cliente.tipoVeiculo] ?? "—")
                    : "—"
                }
              />
              <Linha
                rotulo="Posto preferido"
                valor={cliente.postoPreferido?.nome ?? "—"}
              />
              <Linha rotulo="Tags" valor={cliente.tags ?? "—"} />
            </dl>
          )}
        </section>

        {/* Linha do tempo */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Linha do tempo</h2>
          {cliente.eventos.length === 0 ? (
            <p className="text-sm text-gray-500">Sem eventos ainda.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-gray-200 pl-4">
              {cliente.eventos.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--paz-navy)]" />
                  <p className="text-sm font-medium text-gray-900">
                    {EVENTO_LABEL[e.tipo] ?? e.tipo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {fmt(e.criadoEm)}
                    {e.posto ? ` · ${e.posto.nome}` : ""}
                    {e.detalhe ? ` · ${e.detalhe}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Consentimentos + LGPD */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">
            Consentimentos (LGPD)
          </h2>
          {cliente.consentimentos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum consentimento.</p>
          ) : (
            <ul className="mb-4 space-y-3">
              {cliente.consentimentos.map((c) => (
                <li key={c.id} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-700">
                      {FINALIDADE_LABEL[c.finalidade] ?? c.finalidade}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.aceito
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {c.aceito ? "Aceito" : "Recusado"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    v{c.politicaVersao} · {fmt(c.criadoEm)}
                    {c.ip ? ` · ${c.ip}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {podeEditar && (
            <div className="border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Direitos do titular
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/clientes/${cliente.id}/export`}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Exportar dados
                </a>
                <form action={excluirCliente}>
                  <input type="hidden" name="id" value={cliente.id} />
                  <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-[var(--paz-red)] hover:bg-red-50">
                    Excluir dados
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{rotulo}</dt>
      <dd className="text-right font-medium text-gray-800">{valor}</dd>
    </div>
  );
}
