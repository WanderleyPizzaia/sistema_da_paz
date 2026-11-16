import Link from "next/link";
import { PainelDisparo } from "../clientes/disparo/PainelDisparo";
import { whatsappOficial } from "@/lib/qr-whatsapp";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import {
  definirAprovacaoModelo,
  alternarAutomacao,
  registrarFunilQr,
} from "@/lib/actions/whatsapp";
import { STATUS_META_INFO, GATILHO_LABEL } from "@/lib/enums";
import NovoModeloForm from "./NovoModeloForm";
import NovaAutomacaoForm from "./NovaAutomacaoForm";

export default async function WhatsappPage({ searchParams }: { searchParams: Promise<{ aba?: string; automacao?: string; q?: string; veiculo?: string; posto?: string }> }) {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const params = await searchParams;
  const abas = [["automacoes", "Automações"], ["disparos", "Disparos"], ["modelos", "Modelos de mensagem"], ["conversas", "Conversas"]];
  const aba = abas.find(([id]) => id === params.aba)?.[0] ?? "automacoes";
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const [modelos, automacoes, contatos, disparos] = await Promise.all([
    prisma.modeloMensagem.findMany({ orderBy: { criadoEm: "desc" } }),
    prisma.automacao.findMany({ include: { modelo: true }, orderBy: { criadoEm: "desc" } }),
    prisma.cliente.count({ where: { consentimentos: { some: { finalidade: "MARKETING_WHATSAPP", aceito: true } } } }),
    prisma.disparo.findMany({ include: { modelo: { select: { nome: true } } }, where: { criadoEm: { gte: inicioMes } }, orderBy: { criadoEm: "desc" } }),
  ]);
  const ativa = automacoes.find((item) => item.id === params.automacao) ?? automacoes[0];
  const salvo = ativa?.funilQr;
  const config = salvo && typeof salvo === "object" && !Array.isArray(salvo) ? salvo : {};
  const dias = typeof config.dias === "number" ? config.dias : 3;
  const condicao = typeof config.condicao === "string" ? config.condicao : "Voltou a algum posto?";
  const sim = typeof config.sim === "string" ? config.sim : "Marcar como cliente recorrente e encerrar";
  const nao = typeof config.nao === "string" ? config.nao : "Enviar cupom PAZ365 com a rota no Waze";
  const numero = whatsappOficial();
  const aprovados = modelos
    .filter((m) => m.statusMeta === "APROVADO")
    .map((m) => ({ id: m.id, nome: m.nome }));

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      <div className="max-w-[1240px] space-y-5 p-5 lg:p-8">
        <section className="relative isolate overflow-hidden rounded-[20px] bg-gradient-to-br from-[#344197] to-[#1d245e] p-6 text-white shadow-[0_14px_32px_#293d8d40]">
          <span aria-hidden="true" className="absolute -right-24 -top-40 -z-10 size-80 rounded-full bg-white/5" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-blue-100">WHATSAPP BUSINESS{numero && " · +" + numero}</p>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight">WhatsApp</h1>
              <p className="mt-2 text-sm text-blue-100">Automações, disparos e conversas com quem aceitou receber mensagens</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/whatsapp?aba=disparos#novo-disparo" className="rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold !text-white">Novo disparo</Link>
              <Link href="/whatsapp?aba=automacoes#nova-automacao" className="rounded-xl bg-[#be2530] px-4 py-3 text-sm font-semibold !text-white">+ Nova automação</Link>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[["Contatos com aceite", contatos], ["Destinatários em disparos no mês", disparos.reduce((total, disparo) => total + disparo.total, 0)], ["Taxa de leitura", "—"], ["Pediram para sair", "—"]].map(([label, valor]) => (
              <div key={label} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                <dt className="text-xs text-blue-100">{label}</dt><dd className="mt-1 text-3xl font-semibold">{valor}</dd>
              </div>
            ))}
          </dl>
        </section>
        <nav aria-label="Seções do WhatsApp" className="flex flex-wrap gap-2">
          {abas.map(([id, label]) => (
            <Link key={id} href={`/whatsapp?aba=${id}`} aria-current={aba === id ? "page" : undefined}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${aba === id ? "border-[#304299] bg-[#304299] !text-white" : "border-gray-200 bg-white"}`}>{label}</Link>
          ))}
        </nav>
        {aba === "modelos" && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">
            Modelos de mensagem
          </h2>

          {modelos.length === 0 ? (
            <p className="mb-4 text-sm text-gray-500">Nenhum modelo ainda.</p>
          ) : (
            <ul className="mb-5 space-y-3">
              {modelos.map((m) => {
                const info = STATUS_META_INFO[m.statusMeta];
                return (
                  <li
                    key={m.id}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {m.nome}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: info?.cor ?? "#6b7280" }}
                      >
                        {info?.label ?? m.statusMeta}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{m.corpo}</p>
                    <div className="mt-2 flex gap-2">
                      {m.statusMeta !== "APROVADO" && (
                        <Botao
                          id={m.id}
                          status="APROVADO"
                          label="Marcar aprovado"
                          action={definirAprovacaoModelo}
                        />
                      )}
                      {m.statusMeta !== "REPROVADO" && (
                        <Botao
                          id={m.id}
                          status="REPROVADO"
                          label="Reprovar"
                          action={definirAprovacaoModelo}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Novo modelo
            </p>
            <NovoModeloForm />
          </div>
        </section>

        )}
        {aba === "automacoes" && (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(220px,30%)_minmax(0,1fr)]">
            <section className="space-y-2">
              <h2 className="text-xs tracking-widest text-gray-600 uppercase">Automações</h2>
              {automacoes.map((item) => (
                <Link key={item.id} href={`/whatsapp?automacao=${item.id}`} aria-current={ativa?.id === item.id ? "true" : undefined}
                  className={`block rounded-xl border p-3 ${ativa?.id === item.id ? "border-[#be2530] bg-red-50" : "border-gray-200 bg-white"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm">{item.nome}</strong>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${item.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>{item.ativo ? "Ligada" : "Desligada"}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{GATILHO_LABEL[item.gatilho] ?? item.gatilho}</p>
                </Link>
              ))}
              {!automacoes.length && <p className="text-sm text-gray-600">Nenhuma automação cadastrada.</p>}
            </section>
            <div className="space-y-4">
              {ativa && <>
                <section className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-bold">{ativa.nome}</h2>
                    <form action={alternarAutomacao}>
                      <input type="hidden" name="id" value={ativa.id} />
                      <button className="rounded-lg border px-3 py-2 text-sm font-semibold">{ativa.ativo ? "Desligar automação" : "Ligar automação"}</button>
                    </form>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-[#f4f5fa] p-4 sm:p-6">
                    <div className="mx-auto max-w-sm">
                      <EtapaFluxo tipo="Gatilho" titulo={GATILHO_LABEL[ativa.gatilho] ?? ativa.gatilho} cor="border-blue-200 bg-blue-50 text-blue-950" />
                      <ConectorFluxo />
                      <EtapaFluxo tipo="Mensagem" titulo={ativa.modelo?.nome ?? "Sem modelo vinculado"} detalhe={ativa.modelo ? "Modelo vinculado · envio imediato" : undefined} cor="border-green-200 bg-green-50 text-green-950" />
                    </div>
                    {ativa.gatilho === "CADASTRO_QR" && (
                      <div className="mt-5 rounded-xl border border-dashed border-indigo-300 bg-white/60 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold tracking-wide text-indigo-900">
                            {ativa.funilQrRegistradoEm ? "FUNIL REGISTRADO · RASCUNHO" : "ACOMPANHAMENTO PROPOSTO"}
                          </p>
                          <details key={ativa.id} className="w-full">
                            <summary className="w-fit cursor-pointer rounded-lg bg-[#304299] px-3 py-2 text-sm font-semibold text-white">
                              {ativa.funilQrRegistradoEm ? "Editar funil" : "Criar funil"}
                            </summary>
                            <form action={registrarFunilQr} className="mt-3 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
                              <input type="hidden" name="id" value={ativa.id} />
                              <label className="text-sm">Espera (dias)<input name="dias" type="number" min={1} max={365} required defaultValue={dias} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
                              <label className="text-sm">Condição<input name="condicao" required maxLength={300} defaultValue={condicao} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
                              <label className="text-sm">Se sim<textarea name="sim" required maxLength={300} defaultValue={sim} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
                              <label className="text-sm">Se não<textarea name="nao" required maxLength={300} defaultValue={nao} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
                              <button className="w-fit rounded-lg bg-[#304299] px-3 py-2 text-sm font-semibold text-white">Salvar rascunho</button>
                            </form>
                          </details>
                        </div>
                        <div className="mx-auto max-w-sm">
                          <EtapaFluxo tipo="Espera" titulo={dias + (dias === 1 ? " dia" : " dias")} cor="border-amber-200 bg-amber-50 text-amber-950" />
                          <ConectorFluxo />
                          <EtapaFluxo tipo="Condição" titulo={condicao} cor="border-indigo-200 bg-indigo-50 text-indigo-950" />
                        </div>
                        <div className="mx-auto grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <ConectorFluxo rotulo="SIM" />
                            <EtapaFluxo tipo="Tag" titulo={sim} cor="border-green-200 bg-green-50 text-green-950" />
                          </div>
                          <div>
                            <ConectorFluxo rotulo="NÃO" />
                            <EtapaFluxo tipo="Mensagem" titulo={nao} cor="border-blue-200 bg-blue-50 text-blue-950" />
                          </div>
                        </div>
                      </div>
                    )}
                    {ativa.descricao && <p className="mt-4 text-sm text-gray-600">{ativa.descricao}</p>}
                  </div>
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-5">
                  <h2 className="mb-3 text-lg font-bold">Prévia da mensagem</h2>
                  <p className="max-w-xl whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-green-100 bg-[#e5f6dc] p-4 text-sm leading-relaxed text-green-950 shadow-sm">{ativa.modelo?.corpo ?? "Vincule um modelo para mostrar a prévia."}</p>
                  <p className="mt-3 text-xs text-gray-600">{ativa.modelo ? `Aprovação da Meta · ${STATUS_META_INFO[ativa.modelo.statusMeta]?.label ?? ativa.modelo.statusMeta} · ` : ""}Só envia para quem aceitou WhatsApp</p>
                </section>
              </>}
              <section id="nova-automacao" className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="mb-3 text-lg font-bold">Nova automação</h2>
                <NovaAutomacaoForm modelos={aprovados} />
              </section>
            </div>
          </div>
        )}
        {aba === "disparos" && (
          <>
            <section id="novo-disparo" className="rounded-2xl border border-gray-200 bg-white">
              <PainelDisparo searchParams={Promise.resolve(params)} dentroWhatsapp />
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-bold">Disparos do mês</h2>
              {disparos.length ? <ul className="mt-2 divide-y divide-gray-100">
                {disparos.map((disparo) => <li key={disparo.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <div><strong>{disparo.modelo?.nome ?? "Modelo removido"}</strong><p>{disparo.segmentoDescricao}</p></div>
                  <span>{disparo.total} destinatários · {disparo.status}</span>
                </li>)}
              </ul> : <p className="mt-2 text-sm text-gray-600">Nenhum disparo neste mês.</p>}
            </section>
          </>
        )}
        {aba === "conversas" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold">Conversas</h2>
            <p className="mt-2 text-sm text-gray-600">Atenda as mensagens no WhatsApp Web. O histórico de conversas ainda não está conectado ao CRM.</p>
            <a href="https://web.whatsapp.com/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-xl bg-green-800 px-4 py-2.5 text-sm font-semibold !text-white">Abrir WhatsApp Web</a>
          </section>
        )}
      </div>
    </div>
  );
}

function EtapaFluxo({ tipo, titulo, detalhe, cor }: {
  tipo: string;
  titulo: string;
  detalhe?: string;
  cor: string;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-center shadow-sm ${cor}`}>
      <p className="text-[10px] font-bold tracking-widest uppercase">{tipo}</p>
      <p className="mt-1 text-sm font-semibold">{titulo}</p>
      {detalhe && <p className="mt-1 text-xs">{detalhe}</p>}
    </div>
  );
}

function ConectorFluxo({ rotulo }: { rotulo?: string }) {
  return (
    <div aria-hidden="true" className="flex min-h-7 items-center justify-center gap-1 text-xs font-semibold text-indigo-800">
      <span>↓</span>{rotulo && <span>{rotulo}</span>}
    </div>
  );
}

function Botao({
  id,
  status,
  label,
  action,
}: {
  id: string;
  status: string;
  label: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="statusMeta" value={status} />
      <button className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
        {label}
      </button>
    </form>
  );
}
