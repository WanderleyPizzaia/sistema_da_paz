export const CORES_CAMPANHA = [
  { id: "rosa", nome: "Rosa", inicio: "#c93279", fim: "#992051" },
  { id: "preto", nome: "Preto", inicio: "#27272a", fim: "#08080a" },
  { id: "azul", nome: "Azul", inicio: "#2753ad", fim: "#1e3572" },
  { id: "vermelho", nome: "Vermelho", inicio: "#bd2736", fim: "#891623" },
  { id: "verde", nome: "Verde", inicio: "#207847", fim: "#125031" },
  { id: "roxo", nome: "Roxo", inicio: "#783eb0", fim: "#4e2578" },
] as const;

export function corCampanha(id: string) {
  return CORES_CAMPANHA.find((cor) => cor.id === id);
}
