"use client";

import { useActionState, useEffect, useRef } from "react";
import type { PedidoArte } from "@prisma/client";
import { criarPedidoArte, editarPedidoArte, type ProducaoState } from "@/lib/actions/producao";

type PostoOpt = { id: string; nome: string };
const inicial: ProducaoState = {};

type PedidoEditavel = Pick<PedidoArte, "id" | "acao" | "postoId" | "formato" | "responsavel" | "descricao" | "textoArte" | "referencias" | "ehEStop">;

export default function NovoPedidoForm({ postos, pedido, estop = false }: { postos: PostoOpt[]; pedido?: PedidoEditavel; estop?: boolean }) {
  const [state, action, pending] = useActionState(pedido ? editarPedidoArte.bind(null, pedido.id) : criarPedidoArte, inicial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !pedido) ref.current?.reset();
  }, [state.ok, pedido]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Posto
          <select name="postoId" defaultValue={pedido?.postoId ?? ""} className="cp">
            <option value="">Sem posto</option>
            {postos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <label className="text-sm">Ação de marketing
          <input name="acao" required defaultValue={pedido?.acao} className="cp" />
        </label>
        <label className="text-sm">Formato
          <input name="formato" placeholder="Ex.: Story 1080 × 1920" defaultValue={pedido?.formato ?? ""} className="cp" />
        </label>
        <label className="text-sm">Quem está pedindo
          <input name="responsavel" defaultValue={pedido?.responsavel ?? ""} className="cp" />
        </label>
      </div>
      <label className="block text-sm">Explique bem o pedido
        <textarea name="descricao" rows={3} defaultValue={pedido?.descricao ?? ""} className="cp" />
      </label>
      <label className="block text-sm">Texto que vai na arte
        <textarea name="textoArte" rows={2} defaultValue={pedido?.textoArte ?? ""} className="cp" />
      </label>
      <label className="block text-sm">Referências e fotos
        <input name="referencias" placeholder="Cole um link do Drive, Instagram ou Pinterest" defaultValue={pedido?.referencias ?? ""} className="cp" />
      </label>
      {estop ? <input type="hidden" name="ehEStop" value="on" /> : <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" name="ehEStop" defaultChecked={pedido?.ehEStop} /> É um pedido E-Stop
      </label>}
      {state.erro && <p className="text-sm text-[var(--paz-red)]">{state.erro}</p>}
      {state.ok && <p role="status" className="text-sm text-green-600">{pedido ? "Alterações salvas." : "Pedido criado. Confira o vencimento na fila."}</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-[var(--paz-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--paz-red-600)] disabled:opacity-60"
      >
        {pending ? "Salvando…" : pedido ? "Salvar alterações" : "Criar pedido"}
      </button>
      <style>{`.cp{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.55rem 0.7rem;font-size:0.9rem;outline:none;background:#fff}.cp:focus{border-color:var(--paz-navy)}`}</style>
    </form>
  );
}
