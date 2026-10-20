import type { SessionUser } from "./session";

// Capacidades por perfil, verificadas SEMPRE no servidor (esconder o menu
// no front nao basta). Cada funcao recebe o usuario da sessao.

export function isAdm(u: SessionUser): boolean {
  return u.role === "ADM";
}

export function isMarketing(u: SessionUser): boolean {
  return u.role === "MARKETING";
}

export function isGerente(u: SessionUser): boolean {
  return u.role === "GERENTE";
}

// Gerenciar usuarios: so ADM.
export function podeGerenciarUsuarios(u: SessionUser): boolean {
  return isAdm(u);
}

// Cadastro do posto (criar/editar dados de registro): so ADM.
export function podeEditarRegistroPosto(u: SessionUser): boolean {
  return isAdm(u);
}

// Operar marketing no posto (definir farol, criar/alternar acoes): ADM e Marketing.
export function podeOperarMarketing(u: SessionUser): boolean {
  return isAdm(u) || isMarketing(u);
}

// Ver a lista/pagina de um posto. Gerente so ve o proprio posto.
export function podeVerPosto(u: SessionUser, postoId: string): boolean {
  if (isAdm(u) || isMarketing(u)) return true;
  return isGerente(u) && u.postoId === postoId;
}

// Ver a base de clientes (lista e ficha): ADM e Marketing (leitura).
export function podeVerClientes(u: SessionUser): boolean {
  return isAdm(u) || isMarketing(u);
}

// Editar/criar/excluir cliente: so ADM (Marketing e leitura).
export function podeEditarClientes(u: SessionUser): boolean {
  return isAdm(u);
}

// Exportar a base de clientes (LGPD): so ADM.
export function podeExportarClientes(u: SessionUser): boolean {
  return isAdm(u);
}

// Lanca erro padronizado quando a acao nao e permitida (usado em server actions).
export function exigir(condicao: boolean): void {
  if (!condicao) {
    throw new Error("Sem permissão para esta ação.");
  }
}
