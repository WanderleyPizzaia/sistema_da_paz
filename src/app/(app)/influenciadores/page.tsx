import Link from "next/link";
import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { STATUS_PARCERIA, STATUS_PARCERIA_LABEL, TIPO_PARCERIA_LABEL } from "@/lib/enums";
import NovoInfluenciadorForm from "./NovoInfluenciadorForm";

const painel = "rounded-2xl border border-gray-200 bg-white p-5";
const botao = "rounded-xl border px-4 py-2.5 text-sm font-semibold";
const numero = new Intl.NumberFormat("pt-BR");

function iniciais(nome: string) {
  return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}

export default async function InfluenciadoresPage({ searchParams }: {
  searchParams: Promise<{ q?: string; perfil?: string; etapa?: string }>;
}) {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const { q, perfil, etapa } = await searchParams;
  const busca = typeof q === "string" ? q.trim() : "";
  const funil = STATUS_PARCERIA.filter((status) => status !== "ENCERRADO");
  const filtro = funil.find((status) => status === etapa);
  const influenciadores = await prisma.influenciador.findMany({
    include: { parcerias: { include: { posto: { select: { nome: true } } }, orderBy: { criadoEm: "desc" } } },
    orderBy: [{ criadoEm: "desc" }, { id: "asc" }],
  });
  const parcerias = influenciadores.flatMap((item) => item.parcerias);
  const encontrados = influenciadores.filter((item) =>
    [item.nome, item.arroba, item.nicho].join(" ").toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")) &&
    (!filtro || item.parcerias.some((parceria) => parceria.status === filtro)),
  );
  const atual = encontrados.find((item) => item.id === perfil) ?? encontrados[0];
  const parceria = atual?.parcerias.find((item) => !filtro || item.status === filtro);
  const ativos = parcerias.filter((item) => ["CONFIRMADO", "EM_GRAVACAO", "PUBLICADO"].includes(item.status)).length;
  const link = (opcoes: { perfil?: string; etapa?: string } = {}) => {
    const params = new URLSearchParams();
    if (busca) params.set("q", busca);
    const status = opcoes.etapa ?? filtro;
    if (status) params.set("etapa", status);
    if (opcoes.perfil) params.set("perfil", opcoes.perfil);
    return "/influenciadores?" + params + "#parcerias";
  };

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-4 lg:px-8">
        <div><p className="font-bold">Influenciadores</p><p className="text-xs text-gray-600">Parcerias, permutas e resultados de cada influenciador</p></div>
        <form action="/influenciadores" className="flex flex-wrap gap-2">
          <input name="q" aria-label="Buscar influenciador" placeholder="Buscar influenciador" defaultValue={busca} className="rounded-xl border border-gray-300 px-3 py-2 text-sm" />
          {filtro && <input type="hidden" name="etapa" value={filtro} />}
          <button className={botao}>Buscar</button>
        </form>
      </header>
      <div className="max-w-[1240px] space-y-5 p-5 lg:p-8">
        <section className="relative isolate overflow-hidden rounded-[20px] bg-gradient-to-br from-[#344197] to-[#1d245e] p-6 text-white shadow-[0_14px_32px_#293d8d40]">
          <span aria-hidden="true" className="absolute -right-24 -top-40 -z-10 size-80 rounded-full bg-white/5" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-blue-100">PARCERIAS COM CRIADORES</p>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight">Influenciadores</h1>
              <p className="mt-2 text-sm text-blue-100">Quem fala da Rede Paz, o que foi combinado e quanto cada parceria trouxe</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="#cadastro" className={botao + " border-white/30 bg-white/10 !text-white"}>Cadastrar influenciador</a>
              <Link href={atual ? `/influenciadores/${atual.id}#nova-parceria` : "#cadastro"} className={botao + " border-transparent bg-[#be2530] !text-white"}>+ Nova parceria</Link>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[["Parcerias ativas", numero.format(ativos)], ["Alcance das publicações (mês)", "—"], ["Cupons usados", "—"], ["Cadastros pelo QR exclusivo", "—"]].map(([titulo, valor]) => (
              <div key={titulo} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3"><dt className="text-xs text-blue-100">{titulo}</dt><dd className="mt-1 text-3xl font-semibold">{valor}</dd></div>
            ))}
          </dl>
        </section>

        <nav aria-label="Funil de parcerias" className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4">
          <span className="mr-1 text-xs tracking-widest text-gray-600 uppercase">Funil de parcerias</span>
          {funil.map((status) => <Link key={status} href={link({ etapa: filtro === status ? "" : status })}
            aria-current={filtro === status ? "true" : undefined}
            className={`rounded-full border px-3 py-2 text-xs font-semibold ${filtro === status ? "border-[#304299] bg-[#304299] !text-white" : "border-gray-200 bg-white"}`}>
            {STATUS_PARCERIA_LABEL[status]} · {parcerias.filter((item) => item.status === status).length}
          </Link>)}
        </nav>

        <div id="parcerias" className="grid items-start gap-4 lg:grid-cols-[minmax(230px,30%)_minmax(0,1fr)]">
          <nav aria-label="Selecionar influenciador" className="space-y-2">
            <h2 className="text-sm font-semibold">Influenciadores</h2>
            {encontrados.map((item) => {
              const status = item.parcerias.find((p) => !filtro || p.status === filtro)?.status;
              return <Link key={item.id} href={link({ perfil: item.id })} aria-current={item.id === atual?.id ? "true" : undefined}
                className={`flex items-center gap-3 rounded-xl border p-3 ${item.id === atual?.id ? "border-[#be2530] bg-red-50" : "border-gray-200 bg-white"}`}>
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8ecfb] text-xs font-bold text-[#304299]">{iniciais(item.nome)}</span>
                <span className="min-w-0 flex-1"><strong className="block text-sm">{item.nome}</strong><span className="block text-xs text-gray-600">{[item.arroba, item.nicho].filter(Boolean).join(" · ")}</span></span>
                {status && <span className="rounded-full bg-white px-2 py-1 text-[11px]">{STATUS_PARCERIA_LABEL[status] ?? status}</span>}
              </Link>;
            })}
            {!encontrados.length && <p className="text-sm text-gray-600">Nenhum influenciador encontrado.</p>}
          </nav>

          {atual && <section className={painel}>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e8ecfb] font-bold text-[#304299]">{iniciais(atual.nome)}</span>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold">{atual.nome}</h2>
                <p className="text-sm text-gray-600">{[atual.arroba, numero.format(atual.seguidores) + " seguidores", atual.nicho].filter(Boolean).join(" · ")}</p>
              </div>
              {parceria && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900">{STATUS_PARCERIA_LABEL[parceria.status] ?? parceria.status}</span>}
            </div>
            {parceria ? <>
              <dl className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["Acordo", TIPO_PARCERIA_LABEL[parceria.tipo] ?? parceria.tipo], ["Posto da ativação", parceria.posto?.nome ?? "—"], ["Cupom exclusivo", parceria.cupom ?? "—"], ["Próxima data", "—"]].map(([titulo, valor]) => (
                  <div key={titulo} className="rounded-xl bg-[#f4f5fa] p-3"><dt className="text-[11px] text-gray-600 uppercase">{titulo}</dt><dd className="mt-1 text-sm font-semibold">{valor}</dd></div>
                ))}
              </dl>
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="text-xs font-semibold tracking-wide uppercase">Entregas combinadas</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{parceria.entregaveis || "Nenhuma entrega registrada."}</p>
              </div>
              <h3 className="mt-5 text-xs font-semibold tracking-wide uppercase">Resultados da parceria</h3>
              <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["Views", "Novos seguidores", "Cupons usados", "Cadastros pelo QR"].map((titulo) => <div key={titulo} className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-600">{titulo}</dt><dd className="text-lg font-semibold">—</dd></div>)}
              </dl>
            </> : <p className="mt-4 text-sm text-gray-600">Nenhuma parceria registrada.</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {parceria?.contratoUrl && /^https?:\/\//i.test(parceria.contratoUrl) && <a href={parceria.contratoUrl} target="_blank" rel="noreferrer" className={botao}>Abrir contrato</a>}
              <Link href="/videos#pedido" className={botao}>Agendar gravação</Link>
              <Link href={`/influenciadores/${atual.id}`} className={botao + " border-transparent bg-[#304299] !text-white"}>Gerenciar parcerias</Link>
            </div>
          </section>}
        </div>
        <section id="cadastro" className={painel}>
          <h2 className="mb-4 text-xl font-bold">Cadastrar influenciador</h2>
          <NovoInfluenciadorForm />
        </section>
      </div>
    </div>
  );
}
