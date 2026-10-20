// "Enums" da aplicacao. Como o SQLite nao tem enum nativo, guardamos como
// String e validamos/exibimos aqui.

export const ROLES = ["ADM", "MARKETING", "GERENTE"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  ADM: "Administrador",
  MARKETING: "Marketing",
  GERENTE: "Gerente de posto",
};

export const FUNCOES_MARKETING = [
  "DESIGNER",
  "VIDEOS",
  "SOCIAL",
  "TRAFEGO",
  "COORDENACAO",
] as const;
export type FuncaoMarketing = (typeof FUNCOES_MARKETING)[number];

export const FUNCAO_LABEL: Record<string, string> = {
  DESIGNER: "Designer",
  VIDEOS: "Vídeos",
  SOCIAL: "Social media",
  TRAFEGO: "Tráfego",
  COORDENACAO: "Coordenação",
};

export const BANDEIRAS = ["IPIRANGA", "BR", "BANDEIRA_BRANCA"] as const;
export type Bandeira = (typeof BANDEIRAS)[number];

export const BANDEIRA_LABEL: Record<string, string> = {
  IPIRANGA: "Ipiranga",
  BR: "BR",
  BANDEIRA_BRANCA: "Bandeira branca",
};

export const ETAPAS = ["IDEIA", "ESTUDO", "OBRA", "OPERACAO"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const ETAPA_LABEL: Record<string, string> = {
  IDEIA: "Ideia",
  ESTUDO: "Em estudo",
  OBRA: "Em obra/reforma",
  OPERACAO: "Em operação",
};

export const FAROIS = ["VERDE", "AMARELO", "VERMELHO"] as const;
export type Farol = (typeof FAROIS)[number];

export const FAROL_INFO: Record<
  Farol,
  { label: string; descricao: string; cor: string; corTexto: string }
> = {
  VERDE: {
    label: "Verde",
    descricao: "Vendas melhores que o mês anterior",
    cor: "#16a34a",
    corTexto: "#ffffff",
  },
  AMARELO: {
    label: "Amarelo",
    descricao: "Normal / dentro da meta",
    cor: "#eab308",
    corTexto: "#1f2937",
  },
  VERMELHO: {
    label: "Vermelho",
    descricao: "Abaixo da meta — precisa de ação",
    cor: "#dc2626",
    corTexto: "#ffffff",
  },
};

export const STATUS_ACAO = ["PLANEJADA", "FEITA"] as const;
export type StatusAcao = (typeof STATUS_ACAO)[number];

export const TIPOS_VEICULO = ["CARRO", "MOTO", "ELETRICO", "OUTRO"] as const;
export type TipoVeiculo = (typeof TIPOS_VEICULO)[number];

export const VEICULO_LABEL: Record<string, string> = {
  CARRO: "Carro",
  MOTO: "Moto",
  ELETRICO: "Carro elétrico",
  OUTRO: "Outro",
};

// Finalidades de consentimento (LGPD). Uma por finalidade.
export const FINALIDADES = [
  { chave: "MARKETING_WHATSAPP", label: "Receber ofertas no WhatsApp" },
  { chave: "REGULAMENTO", label: "Aceite do regulamento da promoção" },
] as const;

export const FINALIDADE_LABEL: Record<string, string> = Object.fromEntries(
  FINALIDADES.map((f) => [f.chave, f.label]),
);

// Versao atual da politica/termos.
export const POLITICA_VERSAO = "1.0";

export const EVENTO_LABEL: Record<string, string> = {
  SCAN: "Escaneou o QR Code",
  CADASTRO: "Cadastro pela landing",
  EDICAO: "Dados atualizados",
  MENSAGEM: "Mensagem no WhatsApp",
};

// ----- Fase 3: campanhas, modelos e automações -----

export const TIPOS_CAMPANHA = ["SORTEIO", "CUPOM", "OFERTA"] as const;
export type TipoCampanha = (typeof TIPOS_CAMPANHA)[number];

export const TIPO_CAMPANHA_LABEL: Record<string, string> = {
  SORTEIO: "Sorteio",
  CUPOM: "Cupom",
  OFERTA: "Oferta PAZ365",
};

export const STATUS_CAMPANHA = ["RASCUNHO", "ATIVA", "ENCERRADA"] as const;
export type StatusCampanha = (typeof STATUS_CAMPANHA)[number];

export const STATUS_CAMPANHA_INFO: Record<
  string,
  { label: string; cor: string }
> = {
  RASCUNHO: { label: "Rascunho", cor: "#6b7280" },
  ATIVA: { label: "Ativa", cor: "#16a34a" },
  ENCERRADA: { label: "Encerrada", cor: "#9ca3af" },
};

export const STATUS_META = ["PENDENTE", "APROVADO", "REPROVADO"] as const;
export type StatusMeta = (typeof STATUS_META)[number];

export const STATUS_META_INFO: Record<string, { label: string; cor: string }> =
  {
    PENDENTE: { label: "Pendente na Meta", cor: "#eab308" },
    APROVADO: { label: "Aprovado", cor: "#16a34a" },
    REPROVADO: { label: "Reprovado", cor: "#dc2626" },
  };

export const CATEGORIAS_MODELO = ["MARKETING", "UTILIDADE"] as const;

export const GATILHOS = [
  { chave: "CADASTRO_QR", label: "Cliente se cadastra pelo QR" },
  { chave: "MANUAL", label: "Disparo manual" },
] as const;

export const GATILHO_LABEL: Record<string, string> = Object.fromEntries(
  GATILHOS.map((g) => [g.chave, g.label]),
);

// Gera o próximo número da sorte (sequencial, 6 dígitos) a partir da contagem.
export function numeroSorte(indice: number): string {
  return String(indice).padStart(6, "0");
}

// ----- Fase 4: Produção -----

export const STATUS_PEDIDO = ["ABERTO", "PARA_APROVAR", "ENTREGUE"] as const;
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

export const STATUS_PEDIDO_LABEL: Record<string, string> = {
  ABERTO: "Aberto",
  PARA_APROVAR: "Para aprovar",
  ENTREGUE: "Entregue",
};

export const ETAPAS_VIDEO = [
  "IDEIA",
  "ROTEIRO",
  "APROVAR",
  "GRAVACAO",
  "EDICAO",
  "PUBLICADO",
] as const;
export type EtapaVideo = (typeof ETAPAS_VIDEO)[number];

export const ETAPA_VIDEO_LABEL: Record<string, string> = {
  IDEIA: "Ideias",
  ROTEIRO: "Roteiro",
  APROVAR: "Para aprovar",
  GRAVACAO: "Gravação",
  EDICAO: "Edição",
  PUBLICADO: "Publicado",
};

export const ORIGENS_VIDEO = ["IDEIA", "PEDIDO"] as const;

export const STATUS_ESTOP = ["DISPONIVEL", "EM_USO", "MANUTENCAO"] as const;
export type StatusEStop = (typeof STATUS_ESTOP)[number];

export const STATUS_ESTOP_INFO: Record<string, { label: string; cor: string }> =
  {
    DISPONIVEL: { label: "Disponível", cor: "#16a34a" },
    EM_USO: { label: "Em uso", cor: "#eab308" },
    MANUTENCAO: { label: "Manutenção", cor: "#dc2626" },
  };

export const CONECTORES = ["CCS2", "CHAdeMO", "Tipo 2", "GB/T"] as const;

export const TIPOS_PARCERIA = ["PERMUTA", "PAGO"] as const;
export const TIPO_PARCERIA_LABEL: Record<string, string> = {
  PERMUTA: "Permuta",
  PAGO: "Pago",
};

export const STATUS_PARCERIA = [
  "PROSPECCAO",
  "NEGOCIANDO",
  "CONFIRMADO",
  "EM_GRAVACAO",
  "PUBLICADO",
  "ENCERRADO",
] as const;
export type StatusParceria = (typeof STATUS_PARCERIA)[number];

export const STATUS_PARCERIA_LABEL: Record<string, string> = {
  PROSPECCAO: "Prospecção",
  NEGOCIANDO: "Negociando",
  CONFIRMADO: "Confirmado",
  EM_GRAVACAO: "Em gravação",
  PUBLICADO: "Publicado",
  ENCERRADO: "Encerrado",
};

// Cor do contador de prazo (pedido de arte): verde >12h, amarelo 6–12h,
// vermelho < 6h ou atrasado.
export function corPrazo(prazo: Date): { texto: string; cor: string } {
  const horas = (new Date(prazo).getTime() - Date.now()) / 36e5;
  if (horas < 0) return { texto: "Atrasado", cor: "#dc2626" };
  const h = Math.floor(horas);
  const texto = h >= 1 ? `Faltam ${h}h` : "Menos de 1h";
  if (horas < 6) return { texto, cor: "#dc2626" };
  if (horas < 12) return { texto, cor: "#eab308" };
  return { texto, cor: "#16a34a" };
}

// Mês de referência atual no formato "YYYY-MM".
export function mesRefAtual(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Mês anterior ao de referência (ou ao atual).
export function mesRefAnterior(ref = mesRefAtual()): string {
  const [ano, mes] = ref.split("-").map(Number);
  const d = new Date(ano, mes - 2, 1);
  return mesRefAtual(d);
}

// Farol sugerido automaticamente comparando vendas do mês vs. anterior.
export function farolAutomatico(
  vendasAtual: number | null | undefined,
  vendasAnterior: number | null | undefined,
): "VERDE" | "AMARELO" | "VERMELHO" | null {
  if (vendasAtual == null || vendasAnterior == null || vendasAnterior === 0)
    return null;
  const dif = (vendasAtual - vendasAnterior) / vendasAnterior;
  if (dif >= 0.03) return "VERDE";
  if (dif <= -0.05) return "VERMELHO";
  return "AMARELO";
}

// Formata valor em reais.
export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Rótulo amigável de "YYYY-MM" → "out/2026".
export function mesLabel(ref: string): string {
  const meses = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  const [ano, mes] = ref.split("-").map(Number);
  return `${meses[mes - 1]}/${ano}`;
}

export function isRole(v: string): v is Role {
  return (ROLES as readonly string[]).includes(v);
}
