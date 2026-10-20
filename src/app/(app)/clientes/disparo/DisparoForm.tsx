"use client";

import { useActionState } from "react";
import Link from "next/link";
import { enviarDisparo, type DisparoState } from "@/lib/actions/disparos";

type ModeloOpt = { id: string; nome: string };
const inicial: DisparoState = {};

export default function DisparoForm({
  modelos,
  elegiveis,
  filtros,
}: {
  modelos: ModeloOpt[];
  elegiveis: number;
  filtros: { q: string; veiculo: string; posto: string };
}) {
  const [state, action, pending] = useActionState(enviarDisparo, inicial);

  if (state.ok) {
    return (
      <div className="max-w-lg rounded-xl bg-green-50 p-6">
        <p className="text-lg font-semibold text-green-800">
          Disparo registrado 🎉
        </p>
        <p className="mt-1 text-sm text-green-700">
          {state.total} mensagem(ns) enviada(s) (simulado no modo local). Cada
          cliente ganhou um evento na linha do tempo.
        </p>
        <Link
          href="/clientes"
          className="mt-4 inline-block rounded-lg bg-[var(--paz-navy)] px-4 py-2 text-sm font-semibold text-white"
        >
          Voltar aos clientes
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="max-w-lg space-y-4">
      <input type="hidden" name="q" value={filtros.q} />
      <input type="hidden" name="veiculo" value={filtros.veiculo} />
      <input type="hidden" name="posto" value={filtros.posto} />

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Clientes elegíveis (com opt-in)</p>
        <p className="text-3xl font-bold text-gray-900">{elegiveis}</p>
        <p className="mt-1 text-xs text-gray-400">
          Só entram clientes que aceitaram receber marketing no WhatsApp.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Modelo de mensagem (aprovado)
        </label>
        {modelos.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Nenhum modelo aprovado. Crie e aprove um modelo em{" "}
            <Link href="/whatsapp" className="underline">
              WhatsApp
            </Link>
            .
          </p>
        ) : (
          <select
            name="modeloId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--paz-navy)]"
          >
            <option value="" disabled>
              Selecione…
            </option>
            {modelos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending || modelos.length === 0 || elegiveis === 0}
          className="rounded-lg bg-[var(--paz-red)] px-5 py-2.5 font-semibold text-white hover:bg-[var(--paz-red-600)] disabled:opacity-50"
        >
          {pending ? "Enviando…" : `Disparar para ${elegiveis}`}
        </button>
        <Link
          href="/clientes"
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
