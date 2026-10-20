"use client";

import { useActionState } from "react";
import Link from "next/link";
import { criarCampanha, type CampanhaState } from "@/lib/actions/campanhas";
import { TIPOS_CAMPANHA, TIPO_CAMPANHA_LABEL } from "@/lib/enums";

type PostoOpt = { id: string; nome: string };
const inicial: CampanhaState = {};

export default function NovaCampanhaForm({ postos }: { postos: PostoOpt[] }) {
  const [state, action, pending] = useActionState(criarCampanha, inicial);

  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className="lbl">Nome da campanha</label>
        <input name="nome" required placeholder="Promo de inauguração" className="cp" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="lbl">Tipo</label>
          <select name="tipo" defaultValue="SORTEIO" className="cp">
            {TIPOS_CAMPANHA.map((t) => (
              <option key={t} value={t}>
                {TIPO_CAMPANHA_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="lbl">Prêmio (opcional)</label>
          <input name="premio" placeholder="Vale-combustível de R$100" className="cp" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="lbl">Início</label>
          <input name="inicio" type="date" className="cp text-gray-600" />
        </div>
        <div>
          <label className="lbl">Fim</label>
          <input name="fim" type="date" className="cp text-gray-600" />
        </div>
      </div>

      <div>
        <label className="lbl">Postos participantes</label>
        <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
          {postos.length === 0 && (
            <p className="text-sm text-gray-400">Nenhum posto cadastrado.</p>
          )}
          {postos.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="postos" value={p.id} />
              {p.nome}
            </label>
          ))}
        </div>
      </div>

      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--paz-navy)] px-5 py-2.5 font-semibold text-white hover:bg-[var(--paz-navy-700)] disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Criar campanha"}
        </button>
        <Link
          href="/campanhas"
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Link>
      </div>

      <style>{`.lbl{display:block;margin-bottom:0.25rem;font-size:0.85rem;font-weight:500;color:#374151}.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.6rem 0.75rem;font-size:0.95rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
