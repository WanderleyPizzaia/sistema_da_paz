export function whatsappOficial() {
  const numero = process.env.WHATSAPP_REDE_OFICIAL?.replace(/\D/g, "") ?? "";
  return /^55\d{10,11}$/.test(numero) ? numero : null;
}

export function origemQrWhatsapp() {
  const url = process.env.CRM_PUBLIC_URL?.trim();
  if (!url) return process.env.NODE_ENV === "development" ? "http://localhost:3000" : null;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.origin : null;
  } catch {
    return null;
  }
}
