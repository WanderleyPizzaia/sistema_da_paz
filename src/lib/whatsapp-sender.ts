import "server-only";

// Envio de mensagens pelo WhatsApp via Evolution API.
// Configurado por variáveis de ambiente. Se não estiver configurado,
// não envia (retorna false) e o fluxo segue normalmente — o código
// continua no log/tela conforme a flag LOGIN_CODES_VISIVEIS.

const BASE = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
const KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

// Normaliza para o formato internacional do Brasil (55 + DDD + número).
function formatarNumero(whatsapp: string): string {
  const d = (whatsapp || "").replace(/\D/g, "");
  if (d.startsWith("55")) return d;
  return `55${d}`;
}

export function whatsappConfigurado(): boolean {
  return Boolean(BASE && KEY && INSTANCE);
}

// Envia um texto simples. Retorna true se a Evolution aceitou o envio.
export async function enviarWhatsapp(
  whatsapp: string,
  texto: string,
): Promise<boolean> {
  if (!whatsappConfigurado()) return false;
  try {
    const res = await fetch(`${BASE}/message/sendText/${INSTANCE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: KEY as string,
      },
      body: JSON.stringify({
        number: formatarNumero(whatsapp),
        text: texto,
      }),
    });
    if (!res.ok) {
      console.error(
        `[WhatsApp] Falha ao enviar (${res.status}): ${await res.text().catch(() => "")}`,
      );
    }
    return res.ok;
  } catch (e) {
    console.error("[WhatsApp] Erro ao enviar:", e);
    return false;
  }
}
