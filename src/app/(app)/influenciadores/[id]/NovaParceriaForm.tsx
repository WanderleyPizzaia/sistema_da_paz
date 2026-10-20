"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarParceria, type ProducaoState } from "@/lib/actions/producao";
import { TIPOS_PARCERIA, TIPO_PARCERIA_LABEL } from "@/lib/enums";

type PostoOpt = { id: string; nome: string };
const inicial: ProducaoState = {};

export default function NovaParceriaForm({
  influenciadorId,
  postos,
}: {
  influenciadorId: string;
  postos: PostoOpt[];
}) {
  const [state, action, pending] = useActionState(criarParceria, inicial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="influenciadorId" value={influenciadorId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="tipo" defaultValue="PERMUTA" className="cp">
          {TIPOS_PARCERIA.map((t) => (
            <option key={t} value={t}>
              {TIPO_PARCERIA_LABEL[t]}
            </option>
          ))}
        </select>
        <select name="postoAtivacaoId" defaultValue="" className="cp">
          <option value="">Posto de ativação</option>
          {postos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <input name="cupom" placeholder="Cupom exclusivo" className="cp" />
        <input name="entregaveis" placeholder="Entregáveis" className="cp" />
      </div>
      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      {state.ok && <p className="text-sm text-green-600">Parceria criada.</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-[var(--paz-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-navy-700)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "+ Nova parceria"}
      </button>
      <style>{`.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.9rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
