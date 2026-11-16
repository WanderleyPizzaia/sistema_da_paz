"use client";

import { useState } from "react";

export type PostoParticipante = { id: string; nome: string; bandeira: string };

export default function PostosParticipantes({ postos, selecionados }: {
  postos: PostoParticipante[];
  selecionados?: string[];
}) {
  const todosVinculados = selecionados && postos.length > 0 && postos.every((posto) => selecionados.includes(posto.id));
  const [modo, setModo] = useState(selecionados && !todosVinculados ? "manual" : "todos");

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        Postos participantes
        <select name="modoPostos" value={modo} onChange={(event) => setModo(event.target.value)}
          className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm">
          <option value="todos">Todos os postos</option>
          <option value="BANDEIRA_BRANCA">Só bandeira branca</option>
          <option value="IPIRANGA">Só Ipiranga</option>
          <option value="BR">Só BR</option>
          <option value="manual">Escolher postos…</option>
        </select>
      </label>
      <fieldset hidden={modo !== "manual"} disabled={modo !== "manual"} className="max-h-44 overflow-y-auto rounded-lg border border-gray-200 p-3">
        <legend className="px-1 text-xs font-semibold">Escolha os postos</legend>
        {postos.map((posto) => (
          <label key={posto.id} className="flex items-center gap-2 py-1 text-sm">
            <input type="checkbox" name="postos" value={posto.id} defaultChecked={selecionados?.includes(posto.id)} />
            {posto.nome}
          </label>
        ))}
        {postos.length === 0 && <p className="text-sm text-gray-500">Nenhum posto cadastrado.</p>}
      </fieldset>
    </div>
  );
}
