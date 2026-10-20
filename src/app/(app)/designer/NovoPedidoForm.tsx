"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarPedidoArte, type ProducaoState } from "@/lib/actions/producao";

type PostoOpt = { id: string; nome: string };
const inicial: ProducaoState = {};

export default function NovoPedidoForm({ postos }: { postos: PostoOpt[] }) {
  const [state, action, pending] = useActionState(criarPedidoArte, inicial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="acao" required placeholder="Ação de marketing" className="cp" />
        <select name="postoId" defaultValue="" className="cp">
          <option value="">Sem posto</option>
          {postos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <input name="formato" placeholder="Formato (ex.: Story 1080x1920)" className="cp" />
        <input name="responsavel" placeholder="Responsável" className="cp" />
      </div>
      <textarea
        name="descricao"
        rows={2}
        placeholder="Descrição / o que precisa"
        className="cp"
      />
      <input name="textoArte" placeholder="Texto que vai na arte" className="cp" />
      <input name="referencias" placeholder="Referências / links" className="cp" />
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" name="ehEStop" /> É um pedido E-Stop
      </label>
      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      {state.ok && <p className="text-sm text-green-600">Pedido criado (prazo de 24h).</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "+ Novo pedido de arte"}
      </button>
      <style>{`.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.9rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
