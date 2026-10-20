"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { criarUsuario, type UsuarioState } from "@/lib/actions/usuarios";
import {
  ROLES,
  ROLE_LABEL,
  FUNCOES_MARKETING,
  FUNCAO_LABEL,
  type Role,
} from "@/lib/enums";

type PostoOpt = { id: string; nome: string };
const inicial: UsuarioState = {};

export default function NovoUsuarioForm({ postos }: { postos: PostoOpt[] }) {
  const [state, action, pending] = useActionState(criarUsuario, inicial);
  const [role, setRole] = useState<Role>("MARKETING");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setRole("MARKETING");
    }
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-xl border border-gray-200 bg-white p-5"
    >
      <h2 className="mb-4 font-semibold text-gray-900">Novo usuário</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input name="nome" required className="inp" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            WhatsApp (com DDD)
          </label>
          <input name="whatsapp" inputMode="tel" required className="inp" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Perfil
          </label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="inp"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>

        {role === "MARKETING" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Função
            </label>
            <select name="funcao" className="inp" defaultValue="">
              <option value="">—</option>
              {FUNCOES_MARKETING.map((f) => (
                <option key={f} value={f}>
                  {FUNCAO_LABEL[f]}
                </option>
              ))}
            </select>
          </div>
        )}

        {role === "GERENTE" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Posto vinculado
            </label>
            <select name="postoId" required className="inp" defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {postos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {state.erro && (
        <p className="mt-3 text-sm text-[var(--paz-red)]">{state.erro}</p>
      )}
      {state.ok && (
        <p className="mt-3 text-sm text-green-600">Usuário criado.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-[var(--paz-navy)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--paz-navy-700)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Cadastrar usuário"}
      </button>

      <style>{`.inp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.55rem 0.75rem;font-size:0.9rem;outline:none;background:#fff}.inp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
