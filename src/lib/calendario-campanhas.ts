const fuso = "America/Sao_Paulo";

export function diaAtualCampanhas() {
  const partes = new Intl.DateTimeFormat("en", {
    timeZone: fuso, year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(new Date());
  const valor = (tipo: string) => Number(partes.find((parte) => parte.type === tipo)?.value);
  return new Date(Date.UTC(valor("year"), valor("month") - 1, valor("day")));
}

export const mesCampanhas = (data: Date) => data.toISOString().slice(0, 7);
export const nomeMesCampanhas = (data: Date) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(data);

export const dataCampanha = (data: Date | null) =>
  data?.toLocaleDateString("pt-BR", { timeZone: "UTC" }) ?? "—";
