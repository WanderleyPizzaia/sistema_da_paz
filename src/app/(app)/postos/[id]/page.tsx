import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing, podeVerPosto } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { criarQR, alternarQR } from "@/lib/actions/qrcodes";
import {
  ETAPA_LABEL,
  FAROIS,
  FAROL_INFO,
  mesRefAtual,
  mesRefAnterior,
  farolAutomatico,
  formatBRL,
  type Farol,
} from "@/lib/enums";
import {
  definirFarol,
  criarAcao,
  alternarAcao,
  aplicarFarolAuto,
} from "@/lib/actions/postos";
import FarolBadge from "@/components/FarolBadge";
import SemAcesso from "@/components/SemAcesso";

export default async function PostoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await requireUser();

  const posto = await prisma.posto.findUnique({
    where: { id },
    include: {
      status: { where: { mesRef: mesRefAtual() } },
      acoes: { orderBy: { criadoEm: "desc" } },
      qrcodes: {
        orderBy: { criadoEm: "desc" },
        include: { campanha: { select: { nome: true } } },
      },
      metricas: { where: { mes: { in: [mesRefAtual(), mesRefAnterior()] } } },
    },
  });
  if (!posto) notFound();
  if (!podeVerPosto(u, posto.id)) return <SemAcesso />;

  const editavel = podeOperarMarketing(u);
  const h = await headers();
  const origem = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  const campanhas = editavel
    ? await prisma.campanha.findMany({
        select: { id: true, nome: true, tipo: true },
        orderBy: { criadoEm: "desc" },
      })
    : [];
  const farolAtual = (posto.status[0]?.farol as Farol | undefined) ?? null;
  const obsAtual = posto.status[0]?.observacao ?? "";
  const mes = mesRefAtual();
  const metAtual = posto.metricas.find((m) => m.mes === mes) ?? null;
  const metAnterior =
    posto.metricas.find((m) => m.mes === mesRefAnterior()) ?? null;
  const farolSugerido = farolAutomatico(
    metAtual?.vendas,
    metAnterior?.vendas,
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/postos"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Postos
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{posto.nome}</h1>
          <FarolBadge farol={farolAtual} />
        </div>
        <p className="text-sm text-gray-500">
          {posto.bandeira} · {ETAPA_LABEL[posto.etapa] ?? posto.etapa}
          {posto.endereco ? ` · ${posto.endereco}` : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Farol do mês */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 font-semibold text-gray-900">
            Status do mês ({mes})
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Verde = vendas melhores que o mês anterior · Amarelo = normal ·
            Vermelho = abaixo da meta.
          </p>

          {editavel ? (
            <form action={definirFarol} className="space-y-3">
              <input type="hidden" name="postoId" value={posto.id} />
              <div className="flex flex-wrap gap-2">
                {FAROIS.map((f) => {
                  const info = FAROL_INFO[f];
                  const ativo = farolAtual === f;
                  return (
                    <label
                      key={f}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: ativo ? info.cor : "#e5e7eb",
                        backgroundColor: ativo ? info.cor + "18" : "#fff",
                      }}
                    >
                      <input
                        type="radio"
                        name="farol"
                        value={f}
                        defaultChecked={ativo}
                        required
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: info.cor }}
                      />
                      {info.label}
                    </label>
                  );
                })}
              </div>
              <textarea
                name="observacao"
                defaultValue={obsAtual}
                placeholder="Observação (opcional)"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--paz-navy)]"
              />
              <button className="rounded-lg bg-[var(--paz-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-navy-700)]">
                Salvar status
              </button>
            </form>
          ) : null}

          {editavel && farolSugerido && (
            <form action={aplicarFarolAuto} className="mt-3 border-t border-gray-100 pt-3">
              <input type="hidden" name="postoId" value={posto.id} />
              <p className="mb-2 text-xs text-gray-500">
                Pelas vendas (PDV), o farol sugerido é{" "}
                <span
                  className="font-semibold"
                  style={{ color: FAROL_INFO[farolSugerido].cor }}
                >
                  {FAROL_INFO[farolSugerido].label}
                </span>
                .
              </p>
              <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                Definir automaticamente
              </button>
            </form>
          )}

          {!editavel && (
            <div className="text-sm text-gray-600">
              <FarolBadge farol={farolAtual} texto />
              {obsAtual && <p className="mt-2 text-gray-500">{obsAtual}</p>}
            </div>
          )}
        </section>

        {/* Ações de marketing */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">
            Ações de marketing
          </h2>

          {posto.acoes.length === 0 ? (
            <p className="mb-4 text-sm text-gray-500">
              Nenhuma ação registrada ainda.
            </p>
          ) : (
            <ul className="mb-4 divide-y divide-gray-100">
              {posto.acoes.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        a.status === "FEITA"
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {a.titulo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {[
                        a.tipo,
                        a.responsavel,
                        a.data
                          ? new Date(a.data).toLocaleDateString("pt-BR")
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  {editavel ? (
                    <form action={alternarAcao}>
                      <input type="hidden" name="acaoId" value={a.id} />
                      <button
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          a.status === "FEITA"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {a.status === "FEITA" ? "Feita ✓" : "Marcar feita"}
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {a.status === "FEITA" ? "Feita" : "Planejada"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {editavel && (
            <form
              action={criarAcao}
              className="space-y-2 border-t border-gray-100 pt-4"
            >
              <input type="hidden" name="postoId" value={posto.id} />
              <input
                name="titulo"
                required
                placeholder="Nova ação (ex.: Degustação de café PAZ365)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--paz-navy)]"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  name="tipo"
                  placeholder="Tipo"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--paz-navy)]"
                />
                <input
                  name="responsavel"
                  placeholder="Responsável"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--paz-navy)]"
                />
                <input
                  name="data"
                  type="date"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 outline-none focus:border-[var(--paz-navy)]"
                />
              </div>
              <button className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)]">
                + Adicionar ação
              </button>
            </form>
          )}
        </section>
      </div>

      {/* Google Meu Negócio e vendas (tela 08) */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-gray-900">
          Google Meu Negócio e vendas
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Dados do mês (simulados a partir do Google Business Profile e do PDV).
        </p>
        {metAtual ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metrica titulo="Vendas" valor={formatBRL(metAtual.vendas)} />
            <Metrica titulo="Ticket médio" valor={formatBRL(metAtual.ticketMedio)} />
            <Metrica
              titulo="Nota Google"
              valor={metAtual.notaGoogle ? `★ ${metAtual.notaGoogle}` : "—"}
            />
            <Metrica titulo="Avaliações" valor={metAtual.avaliacoes} />
            <Metrica titulo="Pedidos de rota" valor={metAtual.pedidosRota} />
            <Metrica titulo="Visualizações" valor={metAtual.visualizacoes} />
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Sem métricas para este mês ainda.
          </p>
        )}
      </section>

      {/* Captação por QR Code (tela 06 na bomba) */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-gray-900">
          Captação por QR Code
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Gere um QR para colar na bomba. Quem escaneia abre a landing e se
          cadastra.
        </p>

        {editavel && (
          <form
            action={criarQR}
            className="mb-5 grid gap-2 sm:grid-cols-4"
          >
            <input type="hidden" name="postoId" value={posto.id} />
            <input
              name="bomba"
              placeholder="Bomba (ex.: Bomba 3)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--paz-navy)]"
            />
            <select
              name="campanhaId"
              defaultValue=""
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 outline-none focus:border-[var(--paz-navy)]"
            >
              <option value="">Sem campanha</option>
              {campanhas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <input
              name="premio"
              placeholder="Prêmio (ex.: vale-combustível)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--paz-navy)]"
            />
            <button className="rounded-lg bg-[var(--paz-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-navy-700)]">
              + Gerar QR
            </button>
          </form>
        )}

        {posto.qrcodes.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum QR Code gerado ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {posto.qrcodes.map((q) => {
              const url = `${origem}/qr/${q.token}`;
              return (
                <li
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {[q.bomba, q.campanha?.nome ?? q.campanhaNome, q.premio]
                        .filter(Boolean)
                        .join(" · ") || "QR Code"}
                    </p>
                    <a
                      href={url}
                      target="_blank"
                      className="break-all text-xs text-[var(--paz-navy)] underline"
                    >
                      {url}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        q.ativo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {q.ativo ? "Ativo" : "Inativo"}
                    </span>
                    {editavel && (
                      <form action={alternarQR}>
                        <input type="hidden" name="qrId" value={q.id} />
                        <button className="text-xs font-medium text-gray-500 hover:text-[var(--paz-red)]">
                          {q.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metrica({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="rounded-lg border border-gray-100 px-3 py-2.5">
      <p className="text-[11px] text-gray-500">{titulo}</p>
      <p className="mt-0.5 text-base font-bold text-gray-900">{valor}</p>
    </div>
  );
}
