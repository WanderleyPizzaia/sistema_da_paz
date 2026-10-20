"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarPedidoGerente, type GerenteState } from "@/lib/actions/gerente";

const inicial: GerenteState = {};

export default function NovoPedidoGerenteForm() {
  const [state, action, pending] = useActionState(criarPedidoGerente, inicial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          O que você precisa?
        </label>
        <select name="tipo" defaultValue="ARTE" className="cp">
          <option value="ARTE">Arte / imagem</option>
          <option value="VIDEO">Vídeo</option>
        </select>
      </div>
      <input name="material" placeholder="Material (ex.: oferta do café)" className="cp" />
      <textarea
        name="descricao"
        required
        rows={4}
        placeholder="Explique bem o pedido: o que é, para quando, detalhes…"
        className="cp"
      />
      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      {state.ok && (
        <p className="text-sm text-green-600">
          Pedido enviado ao marketing (prazo de 24h).
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-lg bg-[var(--paz-red)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar pedido"}
      </button>
      <style>{`.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.6rem 0.75rem;font-size:0.95rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
