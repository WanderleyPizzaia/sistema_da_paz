import { requireUser } from "@/lib/session";
import { isAdm } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { alternarAtivo } from "@/lib/actions/usuarios";
import {
  ROLE_LABEL,
  FUNCAO_LABEL,
  ROLES,
  type Role,
} from "@/lib/enums";
import SemAcesso from "@/components/SemAcesso";
import NovoUsuarioForm from "./NovoUsuarioForm";

export default async function UsuariosPage() {
  const u = await requireUser();
  if (!isAdm(u)) return <SemAcesso />;

  const [usuarios, postos] = await Promise.all([
    prisma.user.findMany({
      include: { posto: true },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    }),
    prisma.posto.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const contagem = Object.fromEntries(
    ROLES.map((r) => [r, usuarios.filter((x) => x.role === r && x.ativo).length]),
  ) as Record<Role, number>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Usuários e acessos</h1>
        <p className="text-sm text-gray-500">
          Cada perfil enxerga só o que precisa. A permissão é checada no
          servidor.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {ROLES.map((r) => (
          <div
            key={r}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <p className="text-xs text-gray-500">{ROLE_LABEL[r]}</p>
            <p className="text-2xl font-bold text-gray-900">{contagem[r]}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Posto / função</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((x) => (
              <tr key={x.id} className={x.ativo ? "" : "bg-gray-50 opacity-70"}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {x.nome}
                  {x.id === u.id && (
                    <span className="ml-1 text-xs text-gray-400">(você)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{x.whatsapp}</td>
                <td className="px-4 py-3 text-gray-600">
                  {ROLE_LABEL[x.role as Role] ?? x.role}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {x.role === "GERENTE"
                    ? (x.posto?.nome ?? "—")
                    : x.funcao
                      ? (FUNCAO_LABEL[x.funcao] ?? x.funcao)
                      : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      x.ativo
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {x.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {x.id !== u.id && (
                    <form action={alternarAtivo}>
                      <input type="hidden" name="userId" value={x.id} />
                      <button className="text-xs font-medium text-gray-500 hover:text-[var(--paz-red)]">
                        {x.ativo ? "Desativar" : "Reativar"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NovoUsuarioForm postos={postos} />
    </div>
  );
}
