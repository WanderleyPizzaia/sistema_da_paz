"use client";

import { useActionState } from "react";
import { cadastroPublico, type LandingState } from "@/lib/actions/clientes";
import { TIPOS_VEICULO, VEICULO_LABEL } from "@/lib/enums";

const inicial: LandingState = {};

export default function LandingForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(cadastroPublico, inicial);

  if (state.ok) {
    return (
      <div className="rounded-xl bg-green-50 p-6 text-center">
        <p className="text-lg font-semibold text-green-800">
          Pronto, {state.nome?.split(" ")[0]}! 🎉
        </p>
        <p className="mt-1 text-sm text-green-700">
          Seu cadastro foi feito. Fique de olho no WhatsApp.
        </p>
        {state.numeroSorte && (
          <div className="mt-3 rounded-lg bg-white px-4 py-3">
            <p className="text-xs text-gray-500">Seu número da sorte</p>
            <p className="text-2xl font-black tracking-widest text-[var(--paz-navy)]">
              {state.numeroSorte}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <input name="nome" required placeholder="Seu nome" className="campo" />
      <input
        name="whatsapp"
        inputMode="tel"
        required
        placeholder="WhatsApp com DDD"
        className="campo"
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail (opcional)"
        className="campo"
      />
      <select name="tipoVeiculo" defaultValue="" className="campo text-gray-600">
        <option value="">Tipo de veículo (opcional)</option>
        {TIPOS_VEICULO.map((v) => (
          <option key={v} value={v}>
            {VEICULO_LABEL[v]}
          </option>
        ))}
      </select>

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input type="checkbox" name="regulamento" className="mt-1" required />
        <span>Li e aceito o regulamento da promoção.</span>
      </label>
      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input type="checkbox" name="marketing" className="mt-1" defaultChecked />
        <span>Quero receber ofertas da Rede Paz no WhatsApp.</span>
      </label>

      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--paz-red)] py-3 font-semibold text-white hover:bg-[var(--paz-red-600)] disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Quero participar"}
      </button>
      <p className="text-center text-[11px] text-gray-400">
        Seus dados são usados conforme a LGPD. Você pode sair quando quiser.
      </p>

      <style>{`.campo{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.7rem 0.85rem;font-size:0.95rem;outline:none;background:#fff}.campo:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
