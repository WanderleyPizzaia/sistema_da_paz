"use client";

import { useActionState } from "react";
import {
  solicitarCodigo,
  verificarCodigo,
  type LoginState,
} from "@/lib/actions/auth";

const inicialW: LoginState = { step: "whatsapp" };
const inicialC: LoginState = { step: "codigo" };

export default function LoginForm() {
  const [s1, enviarWhatsapp, p1] = useActionState(solicitarCodigo, inicialW);
  const [s2, enviarCodigo, p2] = useActionState(verificarCodigo, inicialC);

  const mostrarCodigo = s1.step === "codigo";
  const whatsapp = s2.whatsapp ?? s1.whatsapp ?? "";

  return (
    <div className="w-full">
      {!mostrarCodigo ? (
        <form action={enviarWhatsapp} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Seu WhatsApp
            </label>
            <input
              name="whatsapp"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 90000-0000"
              defaultValue={s1.whatsapp}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-[var(--paz-navy)]"
            />
          </div>
          {s1.erro && <p className="text-sm text-[var(--paz-red)]">{s1.erro}</p>}
          <button
            type="submit"
            disabled={p1}
            className="w-full rounded-lg bg-[var(--paz-navy)] py-2.5 font-semibold text-white hover:bg-[var(--paz-navy-700)] disabled:opacity-60"
          >
            {p1 ? "Enviando…" : "Receber código"}
          </button>
          <p className="text-xs text-gray-500">
            Enviamos um código de 6 dígitos. No modo local, ele aparece aqui na
            tela.
          </p>
        </form>
      ) : (
        <form action={enviarCodigo} className="space-y-4">
          <input type="hidden" name="whatsapp" value={whatsapp} />
          {s1.codigoDemo && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Código (modo local):{" "}
              <strong className="tracking-widest">{s1.codigoDemo}</strong>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Código de 6 dígitos
            </label>
            <input
              name="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-xl tracking-[0.4em] outline-none focus:border-[var(--paz-navy)]"
            />
          </div>
          {s2.erro && <p className="text-sm text-[var(--paz-red)]">{s2.erro}</p>}
          <button
            type="submit"
            disabled={p2}
            className="w-full rounded-lg bg-[var(--paz-red)] py-2.5 font-semibold text-white hover:bg-[var(--paz-red-600)] disabled:opacity-60"
          >
            {p2 ? "Entrando…" : "Entrar"}
          </button>
          <a
            href="/login"
            className="block text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Usar outro WhatsApp
          </a>
        </form>
      )}
    </div>
  );
}
