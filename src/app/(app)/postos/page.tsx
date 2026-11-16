import Link from "next/link";
import { requireUser } from "@/lib/session";
import { isAdm, isGerente } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  BANDEIRA_LABEL,
  FAROL_INFO,
  FAROIS,
  mesRefAtual,
  type Farol,
} from "@/lib/enums";
import FarolBadge from "@/components/FarolBadge";

export default async function PostosPage({ searchParams }: { searchParams: Promise<{ q?: string; bandeira?: string; status?: string; estop?: string }> }) {
  const u = await requireUser();
  const mes = mesRefAtual();
  const { q, bandeira, status, estop } = await searchParams;
  const busca = typeof q === "string" ? q.trim() : "";
  const nomeMes = new Date(mes + "-01").toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" });
  const filtro = (novoStatus: string, novoEstop = estop === "1") => {
    const params = new URLSearchParams();
    if (busca) params.set("q", busca);
    if (bandeira) params.set("bandeira", bandeira);
    if (novoStatus) params.set("status", novoStatus);
    if (novoEstop) params.set("estop", "1");
    return "/postos?" + params;
  };

  const where = isGerente(u) ? { id: u.postoId ?? "__none__" } : {};
  const postos = await prisma.posto.findMany({
    where,
    include: {
      status: { where: { mesRef: mes } },
      acoes: { orderBy: { data: { sort: "desc", nulls: "last" } } },
      pontosEStop: true,
      metricas: { where: { mes } },
    },
    orderBy: { nome: "asc" },
  });

  const normalizar = (texto: string) => texto.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
  const comFarol = postos.filter((posto) =>
    (!bandeira || posto.bandeira === bandeira) &&
    normalizar(posto.nome + " " + (posto.endereco ?? "")).includes(normalizar(busca)),
  ).map((p) => ({
    ...p,
    farol: (p.status[0]?.farol as Farol | undefined) ?? null,
    carregadores: p.pontosEStop.reduce((total, ponto) => total + ponto.numCarregadores, 0),
  }));

  const contagem = {
    total: comFarol.length,
    precisaAcao: comFarol.filter((p) => p.farol === "VERMELHO").length,
    porFarol: Object.fromEntries(
      FAROIS.map((f) => [f, comFarol.filter((p) => p.farol === f).length]),
    ) as Record<Farol, number>,
  };

  const comEstop = comFarol.filter((posto) => posto.carregadores > 0).length;
  const visiveis = comFarol.filter((posto) => (!status || posto.farol === status) && (estop !== "1" || posto.carregadores > 0));
  const rotulos = { VERDE: "Melhor que o mês anterior", AMARELO: "Normal", VERMELHO: "Precisa de ação" };
  const pill = "rounded-full border px-4 py-2 text-sm font-semibold";
  const botao = "rounded-xl border px-3 py-2 text-center text-sm font-semibold";

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      <header className="border-b border-gray-200 bg-white px-5 py-3 lg:px-8">
        <form method="get" className="flex max-w-3xl flex-wrap gap-2">
          <input name="q" aria-label="Buscar posto" placeholder="Buscar posto por nome, bairro ou rua" defaultValue={busca} className="min-w-52 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm" />
          <select name="bandeira" aria-label="Bandeira" defaultValue={bandeira ?? ""} className="rounded-xl border border-gray-300 px-3 py-2 text-sm">
            <option value="">Todas as bandeiras</option>
            {Object.entries(BANDEIRA_LABEL).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
          </select>
          {status && <input type="hidden" name="status" value={status} />}
          {estop === "1" && <input type="hidden" name="estop" value="1" />}
          <button className={botao}>Buscar</button>
        </form>
      </header>
      <div className="max-w-[1240px] space-y-5 p-5 lg:p-8">
        <section className="relative isolate overflow-hidden rounded-[20px] bg-gradient-to-br from-[#344197] to-[#1d245e] p-6 text-white shadow-[0_14px_32px_#293d8d40]">
          <span aria-hidden="true" className="absolute -right-24 -top-40 -z-10 size-80 rounded-full bg-white/5" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-blue-100">{postos.length} POSTOS DA REDE</p>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight">Postos da rede</h1>
              <p className="mt-2 text-sm text-blue-100">Status do mês, ações de marketing e fotos de cada posto</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="https://www.google.com/maps/search/?api=1&query=Postos+Rede+Paz" target="_blank" rel="noreferrer" className={botao + " border-white/25 bg-white/10 !text-white"}>Ver no mapa</a>
              {isAdm(u) && <Link href="/postos/novo" className={botao + " border-transparent bg-[#be2530] !text-white"}>+ Novo posto</Link>}
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {[["Postos cadastrados", contagem.total], ["Melhor que o mês anterior", contagem.porFarol.VERDE], ["Normal", contagem.porFarol.AMARELO], ["Precisam de ação", contagem.precisaAcao], ["Com carregador E-Stop", comEstop]].map(([titulo, valor]) => (
              <div key={titulo} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3"><dt className="text-xs text-blue-100">{titulo}</dt><dd className="mt-1 text-3xl font-semibold">{valor}</dd></div>
            ))}
          </dl>
        </section>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-xs">
          <span className="uppercase tracking-widest text-gray-600">Status do mês ({nomeMes})</span>
          {FAROIS.map((farol) => (
            <span key={farol} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: FAROL_INFO[farol].cor }} />{rotulos[farol]}
            </span>
          ))}
        </div>
        <nav aria-label="Filtros de postos" className="flex flex-wrap gap-2">
          <Link href={filtro("")} aria-current={!status ? "true" : undefined} className={pill + (!status ? " bg-[#304299] !text-white" : " bg-white")}>Todos {contagem.total}</Link>
          {FAROIS.map((farol) => <Link key={farol} href={filtro(farol)} aria-current={status === farol ? "true" : undefined} className={pill + (status === farol ? " bg-[#304299] !text-white" : " bg-white")}>{farol === "VERDE" ? "Melhor" : rotulos[farol]} {contagem.porFarol[farol]}</Link>)}
          <Link href={filtro(status ?? "", estop !== "1")} className={pill + (estop === "1" ? " bg-[#304299] !text-white" : " bg-white")}>ϟ Com carregador E-Stop {comEstop}</Link>
        </nav>

        {!visiveis.length && <p className="rounded-xl border bg-white p-6 text-sm text-gray-600">Nenhum posto encontrado.</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visiveis.map((posto) => {
            const ultima = posto.acoes.find((acao) => acao.status === "FEITA");
            const metrica = posto.metricas[0];
            const fotos = posto.acoes.filter((acao) => acao.fotoEnviada).length;
            const destino = posto.lat != null && posto.lng != null ? "ll=" + encodeURIComponent(posto.lat + "," + posto.lng) : "q=" + encodeURIComponent(posto.endereco || posto.nome);
            return (
              <article key={posto.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-t-[5px] border-gray-200 bg-white shadow-sm" style={{ borderTopColor: posto.farol ? FAROL_INFO[posto.farol]?.cor : "#a3adbb" }}>
                <div className="grid h-36 place-items-center bg-[repeating-linear-gradient(45deg,#e8eaf0_0_6px,#f2f3f6_6px_12px)] px-3 text-center text-xs text-gray-600">Foto da fachada · {fotos} ações com foto</div>
                <div className="flex flex-1 flex-col gap-2.5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-bold">{posto.nome}</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{BANDEIRA_LABEL[posto.bandeira] ?? posto.bandeira}</span>
                  </div>
                  <p className="text-xs text-gray-600">{posto.endereco || "Endereço pendente"}</p>
                  <div><FarolBadge farol={posto.farol} /></div>
                  {posto.carregadores > 0 && <Link href="/estop" className="rounded-lg bg-[#ebedf9] px-3 py-2 text-xs font-semibold !text-[#304299]">ϟ E-Stop · {posto.carregadores} {posto.carregadores === 1 ? "carregador" : "carregadores"}</Link>}
                  <p className="text-xs text-gray-600">Última ação: {ultima?.titulo ?? "Nenhuma registrada"}{ultima?.data && " · " + ultima.data.toLocaleDateString("pt-BR", { timeZone: "UTC" })}</p>
                  <div className="flex flex-wrap gap-3 rounded-lg bg-gray-100 p-2.5 text-xs">
                    <span><strong>{metrica?.pedidosRota ?? "—"}</strong> rotas no Google</span>
                    {metrica?.notaGoogle != null && <strong>★ {metrica.notaGoogle.toLocaleString("pt-BR")}</strong>}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Link href={`/postos/${posto.id}`} className={botao + " flex-1 border-gray-200"}>Abrir posto</Link>
                    <a href={`https://www.waze.com/ul?${destino}&navigate=yes`} target="_blank" rel="noreferrer" className={botao + " border-gray-200"}>Waze</a>
                    {posto.farol === "VERMELHO" && !isGerente(u) && <Link href={`/postos/${posto.id}#acoes-marketing`} className={botao + " w-full border-transparent bg-[#be2530] !text-white"}>Planejar ação</Link>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
