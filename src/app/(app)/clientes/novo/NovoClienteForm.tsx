"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  criarClienteManual,
  type ClienteState,
} from "@/lib/actions/clientes";
import { TIPOS_VEICULO, VEICULO_LABEL } from "@/lib/enums";

type PostoOpt = { id: string; nome: string };
const inicial: ClienteState = {};

export default function NovoClienteForm({ postos }: { postos: PostoOpt[] }) {
  const [state, action, pending] = useActionState(criarClienteManual, inicial);

  return (
    <form action={action} className="max-w-lg space-y-3">
      <div>
        <label className="lbl">Nome</label>
        <input name="nome" required className="cp" />
      </div>
      <div>
        <label className="lbl">WhatsApp (com DDD)</label>
        <input name="whatsapp" inputMode="tel" required className="cp" />
      </div>
      <div>
        <label className="lbl">E-mail (opcional)</label>
        <input name="email" type="email" className="cp" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="lbl">Veículo</label>
          <select name="tipoVeiculo" defaultValue="" className="cp">
            <option value="">—</option>
            {TIPOS_VEICULO.map((v) => (
              <option key={v} value={v}>
                {VEICULO_LABEL[v]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="lbl">Posto preferido</label>
          <select name="postoPreferidoId" defaultValue="" className="cp">
            <option value="">—</option>
            {postos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="lbl">Tags (separadas por vírgula)</label>
        <input name="tags" className="cp" />
      </div>

      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--paz-navy)] px-5 py-2.5 font-semibold text-white hover:bg-[var(--paz-navy-700)] disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Cadastrar cliente"}
        </button>
        <Link
          href="/clientes"
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Link>
      </div>

      <style>{`.lbl{display:block;margin-bottom:0.25rem;font-size:0.85rem;font-weight:500;color:#374151}.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.6rem 0.75rem;font-size:0.95rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
