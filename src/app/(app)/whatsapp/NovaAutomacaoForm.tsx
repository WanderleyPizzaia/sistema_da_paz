"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarAutomacao, type WhatsState } from "@/lib/actions/whatsapp";
import { GATILHOS } from "@/lib/enums";

type ModeloOpt = { id: string; nome: string };
const inicial: WhatsState = {};

export default function NovaAutomacaoForm({
  modelos,
}: {
  modelos: ModeloOpt[];
}) {
  const [state, action, pending] = useActionState(criarAutomacao, inicial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input name="nome" required placeholder="Nome da automação" className="cp" />
      <select name="gatilho" defaultValue="CADASTRO_QR" className="cp">
        {GATILHOS.map((g) => (
          <option key={g.chave} value={g.chave}>
            {g.label}
          </option>
        ))}
      </select>
      <select name="modeloId" defaultValue="" className="cp">
        <option value="">Sem modelo (só registra)</option>
        {modelos.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
          </option>
        ))}
      </select>
      <input
        name="descricao"
        placeholder="Descrição (opcional)"
        className="cp"
      />
      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      {state.ok && <p className="text-sm text-green-600">Automação criada.</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-[var(--paz-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-navy-700)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Criar automação"}
      </button>
      <style>{`.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.9rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
