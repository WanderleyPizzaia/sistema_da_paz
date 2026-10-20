"use client";

import { useActionState } from "react";
import Link from "next/link";
import { criarPosto, type PostoState } from "@/lib/actions/postos";
import { BANDEIRAS, BANDEIRA_LABEL, ETAPAS, ETAPA_LABEL } from "@/lib/enums";

const inicial: PostoState = {};

export default function NovoPostoForm() {
  const [state, action, pending] = useActionState(criarPosto, inicial);

  return (
    <form action={action} className="max-w-lg space-y-4">
      <Campo label="Nome do posto">
        <input
          name="nome"
          required
          placeholder="Posto Mykonos"
          className="input"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Bandeira">
          <select name="bandeira" defaultValue="IPIRANGA" className="input">
            {BANDEIRAS.map((b) => (
              <option key={b} value={b}>
                {BANDEIRA_LABEL[b]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Etapa">
          <select name="etapa" defaultValue="OPERACAO" className="input">
            {ETAPAS.map((e) => (
              <option key={e} value={e}>
                {ETAPA_LABEL[e]}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo label="Endereço (opcional)">
        <input
          name="endereco"
          placeholder="Av. Exemplo, 123 — São Paulo"
          className="input"
        />
      </Campo>

      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--paz-navy)] px-5 py-2.5 font-semibold text-white hover:bg-[var(--paz-navy-700)] disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Cadastrar posto"}
        </button>
        <Link
          href="/postos"
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Link>
      </div>

      <style>{`.input{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.625rem 0.75rem;font-size:0.95rem;outline:none;background:#fff}.input:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}
