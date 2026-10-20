"use client";

import { useActionState } from "react";
import { editarCliente, type ClienteState } from "@/lib/actions/clientes";
import { TIPOS_VEICULO, VEICULO_LABEL } from "@/lib/enums";

type PostoOpt = { id: string; nome: string };
type Cliente = {
  id: string;
  nome: string;
  email: string | null;
  tipoVeiculo: string | null;
  postoPreferidoId: string | null;
  tags: string | null;
};

const inicial: ClienteState = {};

export default function EditarClienteForm({
  cliente,
  postos,
}: {
  cliente: Cliente;
  postos: PostoOpt[];
}) {
  const [state, action, pending] = useActionState(editarCliente, inicial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={cliente.id} />
      <div>
        <label className="lbl">Nome</label>
        <input name="nome" defaultValue={cliente.nome} required className="cp" />
      </div>
      <div>
        <label className="lbl">E-mail</label>
        <input
          name="email"
          type="email"
          defaultValue={cliente.email ?? ""}
          className="cp"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="lbl">Veículo</label>
          <select
            name="tipoVeiculo"
            defaultValue={cliente.tipoVeiculo ?? ""}
            className="cp"
          >
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
          <select
            name="postoPreferidoId"
            defaultValue={cliente.postoPreferidoId ?? ""}
            className="cp"
          >
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
        <input name="tags" defaultValue={cliente.tags ?? ""} className="cp" />
      </div>

      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      {state.ok && <p className="text-sm text-green-600">Salvo.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--paz-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-navy-700)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar"}
      </button>

      <style>{`.lbl{display:block;margin-bottom:0.25rem;font-size:0.8rem;font-weight:500;color:#374151}.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.5rem 0.7rem;font-size:0.9rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
