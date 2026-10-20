"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarVideo, type ProducaoState } from "@/lib/actions/producao";
import { ORIGENS_VIDEO } from "@/lib/enums";

type PostoOpt = { id: string; nome: string };
const inicial: ProducaoState = {};

export default function NovoVideoForm({ postos }: { postos: PostoOpt[] }) {
  const [state, action, pending] = useActionState(criarVideo, inicial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="titulo" required placeholder="Título do vídeo / ideia" className="cp sm:col-span-2" />
        <select name="origem" defaultValue="IDEIA" className="cp">
          {ORIGENS_VIDEO.map((o) => (
            <option key={o} value={o}>
              {o === "IDEIA" ? "Ideia da equipe" : "Pedido"}
            </option>
          ))}
        </select>
        <select name="postoId" defaultValue="" className="cp">
          <option value="">Sem posto</option>
          {postos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <input name="elenco" placeholder="Elenco" className="cp" />
        <input name="roteiro" placeholder="Roteiro / gancho" className="cp" />
      </div>
      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      {state.ok && <p className="text-sm text-green-600">Vídeo adicionado às Ideias.</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "+ Nova ideia / vídeo"}
      </button>
      <style>{`.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.9rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
