import Link from "next/link";
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

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
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

  const { perfil } = await searchParams;
  const filtro = ROLES.find((role) => role === perfil);
  const pessoas = filtro ? usuarios.filter((usuario) => usuario.role === filtro) : usuarios;
  const descricoes = {
    ADM: "Gerencia os cadastros, a operação e os acessos.",
    MARKETING: "Acompanha produção, campanhas e ações nos postos.",
    GERENTE: "Usa o App do Gerente para cuidar das ações e dos pedidos do próprio posto.",
  };

  return (
    <div className="min-h-screen bg-[#f4f5fa] p-5 lg:p-8">
      <div className="max-w-[1176px]">
      <section className="mb-5 rounded-[20px] bg-gradient-to-br from-[#344197] to-[#1d245e] p-6 text-white shadow-[0_14px_32px_#293d8d40]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs tracking-widest text-blue-100">ADMINISTRAÇÃO</p><h1 className="mt-1 text-4xl font-semibold">Usuários e acessos</h1></div>
          <a href="#convidar" className="rounded-xl bg-[#be2530] px-4 py-3 text-sm font-semibold !text-white">+ Cadastrar pessoa</a>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {ROLES.map((role) => <Link key={role} href={`/usuarios?perfil=${role}#pessoas`} className="rounded-xl border border-white/25 bg-white/10 p-4 !text-white">
            <p className="font-semibold">{ROLE_LABEL[role]} · {contagem[role]}</p><p className="mt-1 text-xs text-blue-100">{descricoes[role]}</p>
          </Link>)}
        </div>
      </section>
      <section className="mb-5 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold uppercase">O que cada perfil vê</h2>
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead><tr>{["Área do CRM", "ADM", "Marketing", "Gerente"].map((item) => <th key={item} scope="col" className="border-b p-2">{item}</th>)}</tr></thead>
          <tbody>{[
            ["Produção, campanhas e WhatsApp", "Acesso", "Acesso", "—"],
            ["Postos e clientes", "Cadastro e edição", "Consulta e operação", "Próprio posto no app"],
            ["Usuários e acessos", "Cadastro e gestão", "—", "—"],
            ["Ações locais e pedidos no app", "Acompanha a rede", "Acompanha a rede", "Próprio posto"],
          ].map(([area, adm, marketing, gerente]) => <tr key={area} className="border-b border-gray-100"><th scope="row" className="p-2 font-medium">{area}</th><td className="p-2">{adm}</td><td className="p-2">{marketing}</td><td className="p-2">{gerente}</td></tr>)}</tbody>
        </table>
      </section>
      <nav id="pessoas" aria-label="Filtrar pessoas" className="mb-4 flex flex-wrap items-center gap-2">
        <strong className="mr-2 text-sm">Pessoas cadastradas</strong>
        <Link href="/usuarios#pessoas" className="rounded-full border bg-white px-3 py-2 text-xs">Todos</Link>
        {ROLES.map((role) => <Link key={role} href={`/usuarios?perfil=${role}#pessoas`} aria-current={filtro === role ? "true" : undefined} className={`rounded-full border px-3 py-2 text-xs ${filtro === role ? "bg-[#304299] !text-white" : "bg-white"}`}>{ROLE_LABEL[role]}</Link>)}
      </nav>
      {!pessoas.length && <p className="mb-4 text-sm text-gray-600">Nenhuma pessoa neste perfil.</p>}
      {/* Mobile: cards */}
      <ul className="mb-6 space-y-2 lg:hidden">
        {pessoas.map((x) => (
          <li
            key={x.id}
            className={`rounded-xl border border-gray-200 bg-white p-4 ${
              x.ativo ? "" : "opacity-70"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-gray-900">
                {x.nome}
                {x.id === u.id && (
                  <span className="ml-1 text-xs text-gray-400">(você)</span>
                )}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  x.ativo
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {x.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-600">{x.whatsapp}</p>
            <p className="mt-1 text-xs text-gray-500">
              {(ROLE_LABEL[x.role as Role] ?? x.role) +
                " · " +
                (x.role === "GERENTE"
                  ? (x.posto?.nome ?? "—")
                  : x.funcao
                    ? (FUNCAO_LABEL[x.funcao] ?? x.funcao)
                    : "—")}
            </p>
            {x.id !== u.id && (
              <form action={alternarAtivo} className="mt-2">
                <input type="hidden" name="userId" value={x.id} />
                <button className="text-xs font-medium text-gray-500 hover:text-[var(--paz-red)]">
                  {x.ativo ? "Desativar" : "Reativar"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      {/* Desktop: tabela */}
      <div className="mb-6 hidden overflow-x-auto rounded-xl border border-gray-200 bg-white lg:block">
        <table className="w-full min-w-[640px] text-sm">
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
            {pessoas.map((x) => (
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

      <section id="convidar" className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">Cadastrar pessoa</h2>
        <NovoUsuarioForm postos={postos} />
      </section>
      </div>
    </div>
  );
}
