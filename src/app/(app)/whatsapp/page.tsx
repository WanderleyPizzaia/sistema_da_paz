import { requireUser } from "@/lib/session";
import { podeOperarMarketing } from "@/lib/authz";
import SemAcesso from "@/components/SemAcesso";
import { prisma } from "@/lib/prisma";
import {
  definirAprovacaoModelo,
  alternarAutomacao,
} from "@/lib/actions/whatsapp";
import { STATUS_META_INFO, GATILHO_LABEL } from "@/lib/enums";
import NovoModeloForm from "./NovoModeloForm";
import NovaAutomacaoForm from "./NovaAutomacaoForm";

export default async function WhatsappPage() {
  const u = await requireUser();
  if (!podeOperarMarketing(u)) return <SemAcesso />;

  const [modelos, automacoes] = await Promise.all([
    prisma.modeloMensagem.findMany({ orderBy: { criadoEm: "desc" } }),
    prisma.automacao.findMany({
      include: { modelo: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
    }),
  ]);
  const aprovados = modelos
    .filter((m) => m.statusMeta === "APROVADO")
    .map((m) => ({ id: m.id, nome: m.nome }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">WhatsApp</h1>
        <p className="text-sm text-gray-500">
          Modelos de mensagem (aprovados pela Meta) e automações. No modo local
          os envios são simulados.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Modelos */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">
            Modelos de mensagem
          </h2>

          {modelos.length === 0 ? (
            <p className="mb-4 text-sm text-gray-500">Nenhum modelo ainda.</p>
          ) : (
            <ul className="mb-5 space-y-3">
              {modelos.map((m) => {
                const info = STATUS_META_INFO[m.statusMeta];
                return (
                  <li
                    key={m.id}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {m.nome}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: info?.cor ?? "#6b7280" }}
                      >
                        {info?.label ?? m.statusMeta}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{m.corpo}</p>
                    <div className="mt-2 flex gap-2">
                      {m.statusMeta !== "APROVADO" && (
                        <Botao
                          id={m.id}
                          status="APROVADO"
                          label="Marcar aprovado"
                          action={definirAprovacaoModelo}
                        />
                      )}
                      {m.statusMeta !== "REPROVADO" && (
                        <Botao
                          id={m.id}
                          status="REPROVADO"
                          label="Reprovar"
                          action={definirAprovacaoModelo}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Novo modelo
            </p>
            <NovoModeloForm />
          </div>
        </section>

        {/* Automações */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Automações</h2>

          {automacoes.length === 0 ? (
            <p className="mb-4 text-sm text-gray-500">
              Nenhuma automação ainda.
            </p>
          ) : (
            <ul className="mb-5 space-y-3">
              {automacoes.map((a) => (
                <li key={a.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {a.nome}
                    </span>
                    <form action={alternarAutomacao}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.ativo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {a.ativo ? "Ativa" : "Inativa"}
                      </button>
                    </form>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Quando: {GATILHO_LABEL[a.gatilho] ?? a.gatilho}
                    {a.modelo ? ` → ${a.modelo.nome}` : ""}
                  </p>
                  {a.descricao && (
                    <p className="mt-1 text-xs text-gray-400">{a.descricao}</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Nova automação
            </p>
            <NovaAutomacaoForm modelos={aprovados} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Botao({
  id,
  status,
  label,
  action,
}: {
  id: string;
  status: string;
  label: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="statusMeta" value={status} />
      <button className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
        {label}
      </button>
    </form>
  );
}
