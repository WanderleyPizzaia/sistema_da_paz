import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { criarVideo, moverVideo, votarVideo } from "@/lib/actions/producao";
import { ETAPA_VIDEO_LABEL } from "@/lib/enums";
import NovoVideoForm from "./NovoVideoForm";
import QuadroVideos from "./QuadroVideos";

const painel = "rounded-2xl border border-gray-200 bg-white p-5";
const botao = "inline-block rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-50";
const fuso = "America/Sao_Paulo";
const dataHora = new Intl.DateTimeFormat("pt-BR", { timeZone: fuso, dateStyle: "short", timeStyle: "short" });
const data = new Intl.DateTimeFormat("pt-BR", { timeZone: fuso, dateStyle: "short" });
const dia = new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" });

async function adicionarIdeia(formData: FormData) {
  "use server";
  formData.set("origem", "IDEIA");
  await criarVideo({}, formData);
}

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ posto?: string; video?: string }> }) {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const [todos, postos, params] = await Promise.all([
    prisma.video.findMany({ include: { posto: { select: { nome: true } } }, orderBy: [{ votos: "desc" }, { criadoEm: "asc" }] }),
    prisma.posto.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    searchParams,
  ]);
  const filtro = postos.find((posto) => posto.id === params.posto)?.id ?? "";
  const videos = filtro ? todos.filter((video) => video.postoId === filtro) : todos;
  const ideias = videos.filter((video) => video.origem === "IDEIA" && video.etapa === "IDEIA");
  const selecionado = videos.find((video) => video.id === params.video) ?? videos.find((video) => video.etapa === "ROTEIRO");
  const hoje = dia.format(new Date());
  const segunda = new Date(hoje + "T00:00:00Z");
  segunda.setUTCDate(segunda.getUTCDate() - (segunda.getUTCDay() + 6) % 7);
  const fim = new Date(segunda);
  fim.setUTCDate(fim.getUTCDate() + 7);
  const inicioSemana = segunda.toISOString().slice(0, 10);
  const fimSemana = fim.toISOString().slice(0, 10);
  const gravacoes = videos.filter((video) => {
    if (!video.gravacaoEm) return false;
    const chave = dia.format(video.gravacaoEm);
    return chave >= inicioSemana && chave < fimSemana;
  }).sort((a, b) => Number(a.gravacaoEm) - Number(b.gravacaoEm));
  const indicadores = [
    ["Ideias no banco", ideias.length],
    ["Roteiros para aprovar", videos.filter((video) => video.etapa === "APROVAR").length],
    ["Gravações nesta semana", gravacoes.length],
    ["Publicados no mês", videos.filter((video) => video.publicadoEm && dia.format(video.publicadoEm).slice(0, 7) === hoje.slice(0, 7)).length],
  ];

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-4 lg:px-8">
        <div><h1 className="text-2xl font-bold tracking-tight">Vídeos</h1><p className="text-sm text-gray-600">Ideias, roteiros e pedidos de vídeo</p></div>
        <div className="flex gap-2"><a href="#ideias" className={botao}>+ Nova ideia</a><a href="#pedido" className="rounded-lg bg-[#c32630] px-3 py-2 text-sm font-semibold !text-white">+ Pedido de vídeo</a></div>
      </header>
      <div className="max-w-[1240px] space-y-5 p-5 lg:p-8">
        <section className="rounded-[20px] bg-gradient-to-br from-[#344197] to-[#1d245e] p-6 text-white shadow-[0_14px_32px_#293d8d40]">
          <p className="text-xs tracking-widest text-blue-100">IDEIAS · ROTEIROS · PEDIDOS</p>
          <h2 className="mt-1 text-4xl font-semibold tracking-tight">Produção de vídeos</h2>
          <dl className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {indicadores.map(([titulo, valor]) => <div key={titulo} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3"><dt className="text-xs text-blue-100">{titulo}</dt><dd className="mt-1 text-3xl font-semibold">{valor}</dd></div>)}
          </dl>
        </section>
        <section className={painel}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-xl font-bold">Quadro de produção</h2><p className="text-sm text-gray-600">Arraste o cartão para mudar de etapa ou clique no título para abrir o roteiro.</p></div>
            <form className="flex gap-2">
              <select name="posto" aria-label="Filtrar por posto" defaultValue={filtro} className="rounded-lg border border-gray-200 px-3 text-sm">
                <option value="">Todos os postos</option>
                {postos.map((posto) => <option key={posto.id} value={posto.id}>{posto.nome}</option>)}
              </select>
              <button className={botao}>Filtrar</button>
            </form>
          </div>
          <QuadroVideos selecionado={selecionado?.id} filtro={filtro} videos={videos.map((video) => ({
            id: video.id, titulo: video.titulo, origem: video.origem, etapa: video.etapa,
            formato: video.formato, posto: video.posto?.nome ?? null, elenco: video.elenco,
            prazo: video.publicadoEm ? "Publicado " + data.format(video.publicadoEm)
              : video.gravacaoEm ? "Gravar " + dataHora.format(video.gravacaoEm)
              : video.publicarAte ? "Publicar até " + data.format(video.publicarAte) : null,
          }))} />
        </section>
        <section id="roteiro" className={painel}>
          <p className="text-xs tracking-widest text-[#304299]">ROTEIRO{selecionado && " · " + (ETAPA_VIDEO_LABEL[selecionado.etapa] ?? selecionado.etapa)}</p>
          <h2 className="mt-1 text-xl font-bold">{selecionado?.titulo ?? "Roteiro"}</h2>
          {selecionado ? (
            <>
              <p className="mt-1 text-sm text-gray-600">{[selecionado.posto?.nome, selecionado.formato, selecionado.elenco && "Elenco: " + selecionado.elenco].filter(Boolean).join(" · ")}</p>
              <p className="my-4 whitespace-pre-wrap rounded-xl bg-[#f4f5fa] p-4 text-sm">{selecionado.roteiro || "Roteiro ainda não informado."}</p>
              {selecionado.etapa === "APROVAR" && <form action={moverVideo} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={selecionado.id} /><button name="dir" value="prev" className={botao}>Pedir ajuste</button><button name="dir" value="next" className="rounded-lg bg-[#304299] px-3 py-2 text-sm font-semibold text-white">Aprovar roteiro</button></form>}
            </>
          ) : <p className="mt-2 text-sm text-gray-600">Selecione um vídeo no quadro para ver o roteiro.</p>}
        </section>
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <section id="ideias" className={painel}>
            <h2 className="mb-3 text-xl font-bold">Banco de ideias</h2>
            <form action={adicionarIdeia} className="flex flex-wrap gap-2">
              <input type="hidden" name="postoId" value={filtro} />
              <input name="titulo" aria-label="Nova ideia" placeholder="Nova ideia" required minLength={2} className="min-w-40 flex-1 rounded-lg border px-3 py-2 text-sm" />
              <button className={botao}>Adicionar</button>
            </form>
            <ul className="mt-3 divide-y divide-gray-100">
              {ideias.map((ideia) => <li key={ideia.id} className="flex items-center gap-3 py-3 text-sm">
                <form action={votarVideo}><input type="hidden" name="id" value={ideia.id} /><button className={botao} aria-label={`Votar em ${ideia.titulo}`}>▲ {ideia.votos}</button></form>
                <span>{ideia.titulo}</span>
              </li>)}
            </ul>
            {ideias[0] ? <form action={moverVideo} className="mt-3"><input type="hidden" name="id" value={ideias[0].id} /><input type="hidden" name="etapa" value="ROTEIRO" /><button className={botao}>Transformar a mais votada em roteiro</button></form> : <p className="mt-3 text-sm text-gray-600">Nenhuma ideia na fila.</p>}
          </section>
          <section className={painel}>
            <h2 className="text-xl font-bold">Gravações da semana</h2>
            <ul className="my-3 space-y-2 text-sm">
              {gravacoes.map((video) => <li key={video.id} className="rounded-lg bg-[#f4f5fa] p-3"><strong>{video.titulo}</strong><p>{[video.gravacaoEm && dataHora.format(video.gravacaoEm), video.posto?.nome, video.elenco].filter(Boolean).join(" · ")}</p></li>)}
            </ul>
            {!gravacoes.length && <p className="mb-3 text-sm text-gray-600">Nenhuma gravação agendada nesta semana.</p>}
            <a href="#pedido" className={botao}>+ Agendar gravação</a>
          </section>
        </div>
        <section id="pedido" className={painel}>
          <h2 className="text-xl font-bold">Pedido de vídeo</h2>
          <p className="mb-4 text-sm text-gray-600">O pedido entra no quadro em Ideias com a data limite informada.</p>
          <NovoVideoForm postos={postos} />
        </section>
      </div>
    </div>
  );
}
