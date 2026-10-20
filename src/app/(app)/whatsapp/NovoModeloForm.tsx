"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarModelo, type WhatsState } from "@/lib/actions/whatsapp";
import { CATEGORIAS_MODELO } from "@/lib/enums";

const inicial: WhatsState = {};

export default function NovoModeloForm() {
  const [state, action, pending] = useActionState(criarModelo, inicial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input name="nome" required placeholder="Nome do modelo" className="cp" />
      <select name="categoria" defaultValue="MARKETING" className="cp">
        {CATEGORIAS_MODELO.map((c) => (
          <option key={c} value={c}>
            {c === "MARKETING" ? "Marketing" : "Utilidade"}
          </option>
        ))}
      </select>
      <textarea
        name="corpo"
        required
        rows={3}
        placeholder="Olá {{nome}}, a Rede Paz tem uma oferta pra você…"
        className="cp"
      />
      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      {state.ok && (
        <p className="text-sm text-green-600">
          Modelo criado (entra como Pendente na Meta).
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-lg bg-[var(--paz-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-navy-700)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Criar modelo"}
      </button>
      <style>{`.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.9rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
