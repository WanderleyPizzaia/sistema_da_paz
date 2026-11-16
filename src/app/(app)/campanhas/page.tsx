import QrWhatsappPostos from "./QrWhatsappPostos";
import EditarCampanha from "./EditarCampanha";
import { dataCampanha, diaAtualCampanhas, mesCampanhas, nomeMesCampanhas } from "@/lib/calendario-campanhas";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import {
  TIPO_CAMPANHA_LABEL,
  STATUS_CAMPANHA_INFO,
} from "@/lib/enums";

export default async function CampanhasPage({ searchParams }: { searchParams: Promise<{ mes?: string; campanha?: string; busca?: string; posto?: string }> }) {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const hoje = diaAtualCampanhas();
  const { mes, campanha, busca, posto } = await searchParams;
  const termo = typeof busca === "string" ? busca.trim() : "";
  const inicioMesAtual = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
  const fimMesAtual = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 1));
  const [todas, postos] = await Promise.all([
    prisma.campanha.findMany({
      include: {
        postos: { select: { id: true, nome: true } },
        _count: { select: { participacoes: true } },
        qrcodes: {
          select: {
            id: true, token: true, bomba: true, ativo: true, posto: { select: { nome: true } },
            eventos: {
              where: { tipo: { in: ["SCAN", "CADASTRO"] } },
              select: { tipo: true, criadoEm: true },
            },
          },
        },
      },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.posto.findMany({ select: { id: true, nome: true, bandeira: true }, orderBy: { nome: "asc" } }),
  ]);
  const campanhas = todas.filter((item) =>
    (!termo || item.nome.toLocaleLowerCase("pt-BR").includes(termo.toLocaleLowerCase("pt-BR"))) &&
    (!posto || item.postos.some((p) => p.id === posto)),
  );
  const atual = campanhas.find((item) => item.id === campanha) ?? campanhas[0];
  const eventos = (item: (typeof campanhas)[number]) => item.qrcodes.flatMap((qr) => qr.eventos);
  const contar = (item: (typeof campanhas)[number], tipo: string) => eventos(item).filter((evento) => evento.tipo === tipo).length;
  const scansMes = campanhas.flatMap(eventos).filter((evento) => evento.tipo === "SCAN" && evento.criadoEm >= inicioMesAtual && evento.criadoEm < fimMesAtual).length;
  const cadastros = campanhas.reduce((total, item) => total + contar(item, "CADASTRO"), 0);
  const scans = atual ? contar(atual, "SCAN") : 0;
  const conversoes = atual ? contar(atual, "CADASTRO") : 0;
  const filtros = new URLSearchParams();
  if (termo) filtros.set("busca", termo);
  if (posto) filtros.set("posto", posto);
  const hrefCampanha = (id: string) => "/campanhas?" + new URLSearchParams({ ...Object.fromEntries(filtros), campanha: id, ...(mes ? { mes } : {}) }) + "#gestao-campanhas";
  const chaveMes = mes && /^20\d{2}-(0[1-9]|1[0-2])$/.test(mes) ? mes : mesCampanhas(hoje);
  const primeiro = new Date(chaveMes + "-01T00:00:00Z");
  const ano = primeiro.getUTCFullYear();
  const indiceMes = primeiro.getUTCMonth();
  const deslocamento = (primeiro.getUTCDay() + 6) % 7;
  const qtdDias = new Date(Date.UTC(ano, indiceMes + 1, 0)).getUTCDate();
  const navMes = (delta: number) => "/campanhas?" + new URLSearchParams({
    ...Object.fromEntries(filtros), ...(atual ? { campanha: atual.id } : {}),
    mes: mesCampanhas(new Date(Date.UTC(ano, indiceMes + delta, 1))),
  }) + "#calendario-campanhas";
  const fmt = dataCampanha;

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      <header className="border-b border-gray-200 bg-white px-5 py-3 lg:px-8">
        <form method="get" className="flex max-w-3xl flex-wrap gap-3">
          <input name="busca" aria-label="Buscar campanha" placeholder="Buscar campanha por nome" defaultValue={termo} className="min-w-48 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm" />
          <select name="posto" aria-label="Filtrar por posto" defaultValue={posto ?? ""} className="rounded-xl border border-gray-300 px-3 text-sm">
            <option value="">Todos os postos</option>
            {postos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
          <button className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold">Buscar</button>
        </form>
      </header>
      <div className="max-w-[1240px] space-y-5 p-5 lg:p-8">
        <section className="relative isolate overflow-hidden rounded-[20px] bg-gradient-to-br from-[#344197] to-[#1d245e] p-6 text-white shadow-[0_14px_32px_#293d8d40]">
          <span aria-hidden="true" className="absolute -right-24 -top-40 -z-10 size-80 rounded-full bg-white/5" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-blue-100">QR NA BOMBA · CUPONS · OFERTAS PAZ365</p>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight">Campanhas e sorteios</h1>
              <p className="mt-2 text-sm text-blue-100">Acompanhe o que está no ar e os resultados de cada campanha.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="#qr-whatsapp" className="rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold !text-white">QR de WhatsApp</a>
              <a href="#calendario-campanhas" className="rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold !text-white">Ver calendário</a>
              <Link href="/campanhas/novo" className="rounded-xl bg-[#be2530] px-4 py-3 text-sm font-semibold !text-white">+ Nova campanha</Link>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[["Campanhas ativas", campanhas.filter((item) => item.status === "ATIVA").length], ["Scans de QR no mês", scansMes], ["Cadastros pelas campanhas", cadastros], ["Próximo sorteio", "—"]].map(([label, valor]) => (
              <div key={label} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                <dt className="text-xs text-blue-100">{label}</dt><dd className="mt-1 text-3xl font-semibold">{valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div id="gestao-campanhas" className="grid items-start gap-4 lg:grid-cols-[minmax(220px,30%)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            <nav aria-label="Todas as campanhas" className="space-y-2">
              <h2 className="text-xs tracking-widest text-gray-600 uppercase">Todas as campanhas</h2>
              {campanhas.map((item) => (
                <Link key={item.id} href={hrefCampanha(item.id)} aria-current={atual?.id === item.id ? "true" : undefined}
                  className={`block rounded-xl border p-3 ${atual?.id === item.id ? "border-[#be2530] bg-red-50" : "border-gray-200 bg-white hover:border-gray-400"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <strong className="text-sm">{item.nome}</strong>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-medium">{STATUS_CAMPANHA_INFO[item.status]?.label ?? item.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{TIPO_CAMPANHA_LABEL[item.tipo] ?? item.tipo} · {fmt(item.inicio)} a {fmt(item.fim)}</p>
                </Link>
              ))}
              {!campanhas.length && <p className="text-sm text-gray-600">Nenhuma campanha encontrada.</p>}
            </nav>
            <section className="scroll-mt-4 rounded-2xl border border-gray-200 bg-white p-3" aria-labelledby="calendario-campanhas">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="calendario-campanhas" className="text-lg font-bold">Calendário de campanhas</h2>
                  <p className="text-sm text-gray-500">Campanhas ativas no período aparecem na Visão Geral.</p>
                </div>
                <nav aria-label="Navegar pelos meses" className="flex items-center gap-3 text-sm">
                  <Link href={navMes(-1)} aria-label="Mês anterior" className="rounded border px-2 py-1">‹</Link>
                  <strong className="capitalize">{nomeMesCampanhas(primeiro)} de {ano}</strong>
                  <Link href={navMes(1)} aria-label="Próximo mês" className="rounded border px-2 py-1">›</Link>
                </nav>
              </div>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-1">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((dia) => <span key={dia} className="text-center text-xs font-semibold text-gray-500">{dia}</span>)}
                  {Array.from({ length: deslocamento }, (_, i) => <div key={"vazio-" + i} />)}
                  {Array.from({ length: qtdDias }, (_, i) => {
                    const dia = new Date(Date.UTC(ano, indiceMes, i + 1));
                    return (
                      <div key={i} className={`min-h-12 min-w-0 rounded-md border p-0.5 ${+dia === +hoje ? "border-blue-600" : "border-gray-200"}`}>
                        <span className="text-xs font-semibold">{i + 1}</span>
                        {campanhas.filter((c) => c.inicio && c.fim && c.inicio <= dia && c.fim >= dia).map((c) => (
                          <Link key={c.id} href={hrefCampanha(c.id)} title={`${c.nome} · ${STATUS_CAMPANHA_INFO[c.status]?.label ?? c.status}`} className={`mt-1 block truncate rounded px-0.5 py-0.5 text-[10px] ${c.tipo === "CAMPANHA_MES" ? "bg-pink-100 text-pink-900" : "bg-blue-50 text-blue-900"}`}>
                            {c.nome}
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
          {atual && (
            <div className="min-w-0 space-y-4">
              <EditarCampanha key={atual.id} postos={postos} campanha={{
                ...atual, inicio: atual.inicio?.toISOString().slice(0, 10) ?? "",
                fim: atual.fim?.toISOString().slice(0, 10) ?? "", postos: atual.postos.map((item) => item.id),
              }} />
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-bold">QR Codes por bomba</h2>
                <p className="mb-3 text-sm text-gray-600">Acompanhe os scans dos códigos vinculados a esta campanha.</p>
                <Link href="/postos" className="inline-block rounded-xl bg-[#be2530] px-3 py-2 text-sm font-semibold !text-white">Gerenciar QR Codes nos postos</Link>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {atual.qrcodes.map((qr) => (
                    <div key={qr.id} className="rounded-xl border border-gray-200 p-3">
                      <span className="inline-grid size-9 place-items-center rounded-lg bg-gray-100 text-xs font-bold">QR</span>
                      <p className="mt-2 text-sm font-semibold">{qr.posto.nome} · {qr.bomba || "Sem bomba"}</p>
                      <p className="text-xs text-gray-600">{qr.eventos.filter((evento) => evento.tipo === "SCAN").length} scans · {qr.ativo ? "Ativo" : "Inativo"}</p>
                      {qr.ativo && <Link href={`/qr/${qr.token}`} className="mt-2 block text-xs font-semibold underline">Abrir página do QR</Link>}
                    </div>
                  ))}
                </div>
                {!atual.qrcodes.length && <p className="text-sm text-gray-500">Nenhum QR Code vinculado.</p>}
              </section>
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-bold">Resultado da campanha</h2>
                <dl className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[["Scans", scans], ["Cadastros", conversoes], ["Conversão", scans ? new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(conversoes / scans) : "—"], ["Números da sorte", atual.tipo === "SORTEIO" ? atual._count.participacoes : "—"]].map(([label, valor]) => (
                    <div key={label} className="rounded-xl bg-[#f4f5fa] p-3"><dt className="text-xs text-gray-600">{label}</dt><dd className="text-xl font-semibold">{valor}</dd></div>
                  ))}
                </dl>
                <Link href={`/campanhas/${atual.id}`} className="inline-block rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold">
                  {atual.tipo === "SORTEIO" ? "Ver participantes e opções do sorteio" : "Ver detalhes e status"}
                </Link>
              </section>
            </div>
          )}
        </div>

      <QrWhatsappPostos />



      </div>
    </div>
  );
}
