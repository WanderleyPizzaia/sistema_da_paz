"use client";

import { useActionState } from "react";
import PostosParticipantes, { type PostoParticipante } from "./PostosParticipantes";
import PaletaCampanha from "@/components/PaletaCampanha";
import { atualizarCampanha } from "@/lib/actions/campanhas";
import { TIPOS_CAMPANHA, TIPO_CAMPANHA_LABEL } from "@/lib/enums";

type Campos = {
  id: string; nome: string; tipo: string; inicio: string; fim: string;
  premio: string | null; regulamentoUrl: string | null; corDestaque: string;
  status: string; postos: string[];
};

const campo = "mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm";

export default function EditarCampanha({ campanha, postos }: { campanha: Campos; postos: PostoParticipante[] }) {
  const [state, action, pending] = useActionState(atualizarCampanha.bind(null, campanha.id), {});
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{campanha.nome}</h2>
        <div className="flex flex-wrap gap-2">
          <button disabled={pending} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold">{campanha.status === "RASCUNHO" ? "Salvar rascunho" : "Salvar alterações"}</button>
          {campanha.status !== "ATIVA" && <button disabled={pending} name="publicar" value="sim" className="rounded-xl bg-[#be2530] px-4 py-2.5 text-sm font-semibold text-white">Publicar campanha</button>}
        </div>
      </div>
      {state.erro && <p role="alert" className="text-sm text-red-700">{state.erro}</p>}
      {state.ok && <p role="status" className="text-sm text-green-800">Campanha salva.</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Nome da campanha<input name="nome" required minLength={2} defaultValue={campanha.nome} className={campo} /></label>
        <label className="text-sm">Tipo<select name="tipo" defaultValue={campanha.tipo} className={campo}>{TIPOS_CAMPANHA.map((tipo) => <option key={tipo} value={tipo}>{TIPO_CAMPANHA_LABEL[tipo]}</option>)}</select></label>
        <label className="text-sm">Início<input name="inicio" type="date" defaultValue={campanha.inicio} className={campo} /></label>
        <label className="text-sm">Fim<input name="fim" type="date" defaultValue={campanha.fim} className={campo} /></label>
        <label className="text-sm sm:col-span-2">Prêmios<input name="premio" defaultValue={campanha.premio ?? ""} className={campo} /></label>
      </div>
      <PostosParticipantes postos={postos} selecionados={campanha.postos} />
      <PaletaCampanha selecionada={campanha.corDestaque} />
      <label className="block rounded-xl border border-dashed border-gray-300 p-3 text-sm">
        Regulamento (link do PDF)
        <input name="regulamentoUrl" type="url" placeholder="https://…" defaultValue={campanha.regulamentoUrl ?? ""} className={campo} />
      </label>
    </form>
  );
}
