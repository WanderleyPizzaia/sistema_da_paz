"use client";

import { moverVideo } from "@/lib/actions/producao";
import { ETAPAS_VIDEO, ETAPA_VIDEO_LABEL } from "@/lib/enums";

export type CartaoVideo = {
  id: string; titulo: string; origem: string; etapa: string; formato: string | null;
  posto: string | null; elenco: string | null; prazo: string | null;
};

export default function QuadroVideos({ videos, selecionado, filtro }: { videos: CartaoVideo[]; selecionado?: string; filtro: string }) {
  return (
    <div className="grid grid-cols-[repeat(6,minmax(155px,1fr))] gap-2.5 overflow-x-auto pb-2">
      {ETAPAS_VIDEO.map((etapa, index) => {
        const coluna = videos.filter((video) => video.etapa === etapa);
        return (
          <section key={etapa} className="min-h-52 rounded-xl border border-gray-200 bg-[#f4f5fa] p-2"
            onDragOver={(event) => event.preventDefault()}
            onDrop={async (event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("application/x-crm-video");
              if (!videos.some((video) => video.id === id)) return;
              const dados = new FormData();
              dados.set("id", id);
              dados.set("etapa", etapa);
              await moverVideo(dados);
            }}>
            <h3 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold">{ETAPA_VIDEO_LABEL[etapa]} <span className="rounded-full bg-white px-2 text-xs">{coluna.length}</span></h3>
            <ul className="space-y-2">
              {coluna.map((video) => (
                <li key={video.id} draggable onDragStart={(event) => event.dataTransfer.setData("application/x-crm-video", video.id)}
                  className={`rounded-lg border bg-white p-2.5 shadow-sm ${selecionado === video.id ? "border-[#304299]" : "border-gray-200"}`}>
                  <div className="mb-2 flex flex-wrap gap-1 text-[11px]">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${video.origem === "PEDIDO" ? "bg-red-50 text-red-900" : "bg-blue-50 text-blue-900"}`}>{video.origem === "PEDIDO" ? "Pedido" : "Ideia"}</span>
                    {video.formato && <span className="rounded-full bg-gray-100 px-2 py-0.5">{video.formato}</span>}
                  </div>
                  <a href={`/videos?${new URLSearchParams({ posto: filtro, video: video.id })}#roteiro`} className="block text-sm font-bold hover:underline">{video.titulo}</a>
                  <p className="mt-1 text-xs text-gray-600">{video.posto ?? "Sem posto específico"}</p>
                  {video.elenco && <p className="text-xs text-gray-600">Elenco: {video.elenco}</p>}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[11px] text-gray-600">{video.prazo ?? "Sem data"}</span>
                    <form action={moverVideo} className="flex gap-1">
                      <input type="hidden" name="id" value={video.id} />
                      {index > 0 && <button name="dir" value="prev" aria-label="Etapa anterior" className="rounded border px-1.5 text-xs">←</button>}
                      {index < ETAPAS_VIDEO.length - 1 && <button name="dir" value="next" aria-label="Próxima etapa" className="rounded border px-1.5 text-xs">→</button>}
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
