"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarPonto, type ProducaoState } from "@/lib/actions/producao";
import { CONECTORES } from "@/lib/enums";

type PostoOpt = { id: string; nome: string };
const inicial: ProducaoState = {};

export default function NovoPontoForm({ postos }: { postos: PostoOpt[] }) {
  const [state, action, pending] = useActionState(criarPonto, inicial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="postoId" required defaultValue="" className="cp">
          <option value="" disabled>
            Posto…
          </option>
          {postos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <input
          name="numCarregadores"
          type="number"
          min={1}
          defaultValue={1}
          placeholder="Nº de carregadores"
          className="cp"
        />
        <input
          name="potenciaKw"
          type="number"
          step="any"
          placeholder="Potência (kW)"
          className="cp"
        />
        <select name="conector" defaultValue="" className="cp">
          <option value="">Conector</option>
          {CONECTORES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input name="horario" placeholder="Horário (ex.: 24h)" className="cp" />
      </div>
      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      {state.ok && <p className="text-sm text-green-600">Ponto de recarga criado.</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "+ Novo ponto E-Stop"}
      </button>
      <style>{`.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.9rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
