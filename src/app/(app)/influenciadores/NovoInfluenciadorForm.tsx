"use client";

import { useActionState } from "react";
import { criarInfluenciador, type ProducaoState } from "@/lib/actions/producao";

const inicial: ProducaoState = {};

export default function NovoInfluenciadorForm() {
  const [state, action, pending] = useActionState(criarInfluenciador, inicial);

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="nome" required placeholder="Nome" className="cp" />
        <input name="arroba" placeholder="@ (Instagram/TikTok)" className="cp" />
        <input name="nicho" placeholder="Nicho" className="cp" />
        <input name="seguidores" type="number" min={0} placeholder="Seguidores" className="cp" />
        <input name="whatsapp" placeholder="WhatsApp" className="cp" />
        <input name="regiao" placeholder="Região" className="cp" />
        <input name="quemIndicou" placeholder="Quem indicou" className="cp sm:col-span-2" />
      </div>
      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "+ Cadastrar influenciador"}
      </button>
      <style>{`.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.9rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
