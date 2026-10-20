import { PrismaClient } from "@prisma/client";

// Seed de PRODUÇÃO: cria apenas o primeiro administrador, a partir das
// variáveis de ambiente. Não cria dados de teste. Idempotente.
//
// Rodar uma vez após o primeiro deploy:
//   ADMIN_NOME="..." ADMIN_WHATSAPP="11..." npm run db:seed:prod

const prisma = new PrismaClient();

function soDigitos(v: string): string {
  return (v || "").replace(/\D/g, "");
}

async function main() {
  const nome = process.env.ADMIN_NOME?.trim() || "Administrador";
  const whatsapp = soDigitos(process.env.ADMIN_WHATSAPP ?? "");

  if (whatsapp.length < 10) {
    console.error(
      "✗ Defina ADMIN_WHATSAPP (com DDD) antes de rodar o seed de produção.",
    );
    process.exit(1);
  }

  const admin = await prisma.user.upsert({
    where: { whatsapp },
    update: { role: "ADM", ativo: true, nome },
    create: { nome, whatsapp, role: "ADM" },
  });

  console.log(`✅ Administrador pronto: ${admin.nome} (WhatsApp ${whatsapp}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
