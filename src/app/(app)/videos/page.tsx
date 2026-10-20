import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import { moverVideo, votarVideo } from "@/lib/actions/producao";
import { ETAPAS_VIDEO, ETAPA_VIDEO_LABEL } from "@/lib/enums";
import NovoVideoForm from "./NovoVideoForm";

export default async function VideosPage() {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const [videos, postos] = await Promise.all([
    prisma.video.findMany({
      include: { posto: { select: { nome: true } } },
      orderBy: [{ votos: "desc" }, { criadoEm: "asc" }],
    }),
    prisma.posto.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Produção de vídeos</h1>
        <p className="text-sm text-gray-500">
          Arraste pelas etapas (use ← →). Ideias com mais votos sobem.
        </p>
      </div>

      <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
        {ETAPAS_VIDEO.map((etapa, idx) => {
          const col = videos.filter((v) => v.etapa === etapa);
          return (
            <div
              key={etapa}
              className="flex w-64 shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
                <h2 className="text-sm font-semibold text-gray-800">
                  {ETAPA_VIDEO_LABEL[etapa]}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500">
                  {col.length}
                </span>
              </div>
              <ul className="flex-1 space-y-2 p-2">
                {col.map((v) => (
                  <li
                    key={v.id}
                    className="rounded-lg border border-gray-200 bg-white p-2.5"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {v.titulo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {[v.posto?.nome, v.elenco].filter(Boolean).join(" · ") ||
                        "—"}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <form action={votarVideo}>
                        <input type="hidden" name="id" value={v.id} />
                        <button className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200">
                          ▲ {v.votos}
                        </button>
                      </form>
                      <div className="flex gap-1">
                        {idx > 0 && (
                          <form action={moverVideo}>
                            <input type="hidden" name="id" value={v.id} />
                            <input type="hidden" name="dir" value="prev" />
                            <button className="rounded-md border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-50">
                              ←
                            </button>
                          </form>
                        )}
                        {idx < ETAPAS_VIDEO.length - 1 && (
                          <form action={moverVideo}>
                            <input type="hidden" name="id" value={v.id} />
                            <input type="hidden" name="dir" value="next" />
                            <button className="rounded-md border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-50">
                              →
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Nova ideia / vídeo</h2>
        <NovoVideoForm postos={postos} />
      </section>
    </div>
  );
}
