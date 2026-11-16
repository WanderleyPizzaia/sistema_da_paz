"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarVideo, type ProducaoState } from "@/lib/actions/producao";


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
      <fieldset className="flex gap-4 text-sm">
        <legend className="mb-2 font-semibold">Tipo</legend>
        <label><input type="radio" name="origem" value="PEDIDO" defaultChecked /> Pedido</label>
        <label><input type="radio" name="origem" value="IDEIA" /> Ideia</label>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Posto
          <select name="postoId" className="cp">
            <option value="">Todos os postos / sem posto específico</option>
            {postos.map((posto) => <option key={posto.id} value={posto.id}>{posto.nome}</option>)}
          </select>
        </label>
        <label className="text-sm">Ação de marketing / título
          <input name="titulo" required className="cp" />
        </label>
        <label className="text-sm">Formato
          <select name="formato" className="cp">
            <option value="">Selecione</option>
            {["Reels", "Story em sequência", "TikTok", "YouTube (vlog)"].map((formato) => <option key={formato}>{formato}</option>)}
          </select>
        </label>
        <label className="text-sm">Precisa publicar até<input name="publicarAte" type="date" className="cp" /></label>
        <label className="text-sm">Elenco desejado<input name="elenco" className="cp" /></label>
        <label className="text-sm">Quem está pedindo<input name="solicitante" className="cp" /></label>
        <label className="text-sm">Gravação (horário de São Paulo)<input name="gravacaoEm" type="datetime-local" className="cp" /></label>
        <label className="text-sm">Referência (link de outro vídeo)<input name="referenciaUrl" type="url" className="cp" /></label>
      </div>
      <label className="block text-sm">Explique bem o pedido<textarea name="roteiro" rows={4} className="cp" /></label>
      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      {state.ok && <p className="text-sm text-green-600">Vídeo adicionado às Ideias.</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Enviar para produção"}
      </button>
      <style>{`.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.9rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
