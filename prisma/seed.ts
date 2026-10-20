import { PrismaClient } from "@prisma/client";
import { mesRefAtual } from "../src/lib/enums";

const prisma = new PrismaClient();

async function main() {
  // Usuario ADM (voce). Use este WhatsApp para entrar.
  const adm = await prisma.user.upsert({
    where: { whatsapp: "11999990000" },
    update: {},
    create: {
      nome: "Gabriel (ADM)",
      whatsapp: "11999990000",
      role: "ADM",
    },
  });

  // Usuario de Marketing de exemplo.
  await prisma.user.upsert({
    where: { whatsapp: "11999990001" },
    update: {},
    create: {
      nome: "Marina (Designer)",
      whatsapp: "11999990001",
      role: "MARKETING",
      funcao: "DESIGNER",
    },
  });

  // Postos de exemplo (so cria se ainda nao existir pelo nome).
  const exemplos = [
    {
      nome: "Posto Mykonos",
      bandeira: "PAZ365",
      etapa: "OPERACAO",
      endereco: "Av. Exemplo, 100 — São Paulo",
    },
    {
      nome: "Posto Paz — Vila São Francisco",
      bandeira: "PAZ",
      etapa: "OPERACAO",
      endereco: "Av. Eng. Marsilac Sampaio, 600 — São Paulo",
    },
    {
      nome: "Posto Novo Horizonte",
      bandeira: "PAZ365",
      etapa: "OBRA",
      endereco: "Rua das Flores, 20 — São Paulo",
    },
  ];

  for (const e of exemplos) {
    const existe = await prisma.posto.findFirst({ where: { nome: e.nome } });
    if (existe) continue;
    const posto = await prisma.posto.create({ data: e });

    // Da um farol e algumas acoes para o primeiro posto.
    if (e.nome === "Posto Mykonos") {
      await prisma.postoStatus.create({
        data: {
          postoId: posto.id,
          mesRef: mesRefAtual(),
          farol: "VERDE",
          observacao: "Vendas acima do mês anterior.",
        },
      });
      await prisma.acaoMarketing.createMany({
        data: [
          {
            postoId: posto.id,
            titulo: "Degustação de café PAZ365",
            tipo: "EVENTO",
            responsavel: "Marina",
            status: "FEITA",
          },
          {
            postoId: posto.id,
            titulo: "Arte da oferta da semana",
            tipo: "ARTE",
            responsavel: "Marina",
            status: "PLANEJADA",
          },
        ],
      });
    }
  }

  // QR Code de captacao + clientes de exemplo no Posto Mykonos.
  const mykonos = await prisma.posto.findFirst({
    where: { nome: "Posto Mykonos" },
  });
  if (mykonos) {
    let qr = await prisma.qRCode.findFirst({ where: { postoId: mykonos.id } });
    if (!qr) {
      qr = await prisma.qRCode.create({
        data: {
          token: "demoqr123456",
          postoId: mykonos.id,
          bomba: "Bomba 1",
          campanhaNome: "Promo de inauguração",
          premio: "um vale-combustível de R$100",
        },
      });
    }

    const exemplosClientes = [
      {
        nome: "Maria Souza",
        whatsapp: "11988887777",
        tipoVeiculo: "ELETRICO",
        email: "maria@exemplo.com",
      },
      {
        nome: "João Pereira",
        whatsapp: "11977776666",
        tipoVeiculo: "CARRO",
        email: null as string | null,
      },
    ];

    for (const c of exemplosClientes) {
      const existe = await prisma.cliente.findUnique({
        where: { whatsapp: c.whatsapp },
      });
      if (existe) continue;
      const cliente = await prisma.cliente.create({
        data: {
          nome: c.nome,
          whatsapp: c.whatsapp,
          email: c.email,
          tipoVeiculo: c.tipoVeiculo,
          postoPreferidoId: mykonos.id,
          origem: `QR:${mykonos.nome}`,
        },
      });
      await prisma.consentimento.createMany({
        data: [
          {
            clienteId: cliente.id,
            finalidade: "REGULAMENTO",
            aceito: true,
            politicaVersao: "1.0",
          },
          {
            clienteId: cliente.id,
            finalidade: "MARKETING_WHATSAPP",
            aceito: true,
            politicaVersao: "1.0",
          },
        ],
      });
      await prisma.eventoCliente.create({
        data: {
          clienteId: cliente.id,
          tipo: "CADASTRO",
          detalhe: "Landing do QR",
          postoId: mykonos.id,
          qrCodeId: qr.id,
        },
      });
    }
  }

  // Campanha de sorteio ligada ao QR + participações dos clientes de exemplo.
  const mk = await prisma.posto.findFirst({ where: { nome: "Posto Mykonos" } });
  if (mk) {
    let camp = await prisma.campanha.findFirst({
      where: { nome: "Sorteio de inauguração" },
    });
    if (!camp) {
      camp = await prisma.campanha.create({
        data: {
          nome: "Sorteio de inauguração",
          tipo: "SORTEIO",
          premio: "um vale-combustível de R$100",
          status: "ATIVA",
          postos: { connect: { id: mk.id } },
        },
      });
    }
    await prisma.qRCode.updateMany({
      where: { token: "demoqr123456" },
      data: { campanhaId: camp.id },
    });

    const clientes = await prisma.cliente.findMany({
      where: { whatsapp: { in: ["11988887777", "11977776666"] } },
    });
    for (const cli of clientes) {
      const existe = await prisma.participacao.findUnique({
        where: {
          clienteId_campanhaId: { clienteId: cli.id, campanhaId: camp.id },
        },
      });
      if (!existe) {
        const n = await prisma.participacao.count({
          where: { campanhaId: camp.id },
        });
        await prisma.participacao.create({
          data: {
            clienteId: cli.id,
            campanhaId: camp.id,
            numeroSorte: String(n + 1).padStart(6, "0"),
            canal: "QR",
          },
        });
      }
    }
  }

  // Modelo de mensagem aprovado + automação de boas-vindas do sorteio.
  let modelo = await prisma.modeloMensagem.findFirst({
    where: { nome: "Oferta da semana" },
  });
  if (!modelo) {
    modelo = await prisma.modeloMensagem.create({
      data: {
        nome: "Oferta da semana",
        categoria: "MARKETING",
        corpo: "Olá {{nome}}, confira a oferta da semana da Rede Paz!",
        statusMeta: "APROVADO",
      },
    });
  }
  const autoExiste = await prisma.automacao.findFirst({
    where: { gatilho: "CADASTRO_QR" },
  });
  if (!autoExiste) {
    await prisma.automacao.create({
      data: {
        nome: "Boas-vindas do sorteio",
        gatilho: "CADASTRO_QR",
        modeloId: modelo.id,
        descricao:
          "Responde com o número da sorte quando o cliente se cadastra pelo QR.",
      },
    });
  }

  // ----- Fase 4: produção (exemplos) -----
  const posto1 = await prisma.posto.findFirst({ orderBy: { nome: "asc" } });

  // Gerente de posto (para testar o App do Gerente).
  const mkParaGerente = await prisma.posto.findFirst({
    where: { nome: "Posto Mykonos" },
  });
  if (mkParaGerente) {
    await prisma.user.upsert({
      where: { whatsapp: "11999990002" },
      update: { postoId: mkParaGerente.id, ativo: true, role: "GERENTE" },
      create: {
        nome: "Wanderley (Gerente)",
        whatsapp: "11999990002",
        role: "GERENTE",
        postoId: mkParaGerente.id,
      },
    });
  }

  if ((await prisma.pedidoArte.count()) === 0) {
    const daqui = (h: number) => new Date(Date.now() + h * 3600 * 1000);
    await prisma.pedidoArte.createMany({
      data: [
        {
          numero: 1,
          postoId: posto1?.id,
          acao: "Arte da oferta da semana",
          formato: "Story 1080x1920",
          responsavel: "Marina",
          status: "ABERTO",
          prazo: daqui(20),
        },
        {
          numero: 2,
          postoId: posto1?.id,
          acao: "Degustação de café PAZ365",
          formato: "Feed 1080x1080",
          responsavel: "Marina",
          status: "PARA_APROVAR",
          prazo: daqui(8),
        },
      ],
    });
  }

  // Um pedido E-Stop de exemplo (arte marcada como E-Stop).
  if ((await prisma.pedidoArte.count({ where: { ehEStop: true } })) === 0) {
    const n = await prisma.pedidoArte.count();
    await prisma.pedidoArte.create({
      data: {
        numero: n + 1,
        postoId: posto1?.id,
        acao: "Story: tem E-Stop no Posto Mykonos",
        formato: "Story 1080x1920",
        responsavel: "Marina",
        ehEStop: true,
        status: "ABERTO",
        prazo: new Date(Date.now() + 4 * 3600 * 1000),
      },
    });
  }

  if ((await prisma.video.count()) === 0) {
    await prisma.video.createMany({
      data: [
        { titulo: "Bastidores do café da manhã", etapa: "IDEIA", votos: 3, elenco: "Samira" },
        { titulo: "Oferta da semana PAZ365", etapa: "ROTEIRO", postoId: posto1?.id },
        { titulo: "Promo de inauguração", etapa: "GRAVACAO", postoId: posto1?.id, elenco: "Josi, Miguel" },
      ],
    });
  }

  if (posto1 && (await prisma.pontoEStop.count()) === 0) {
    await prisma.pontoEStop.create({
      data: {
        postoId: posto1.id,
        numCarregadores: 2,
        potenciaKw: 150,
        conector: "CCS2",
        horario: "24h",
        status: "DISPONIVEL",
      },
    });
  }

  if ((await prisma.influenciador.count()) === 0) {
    const inf = await prisma.influenciador.create({
      data: {
        nome: "Samira Lopes",
        arroba: "@samiralopes",
        nicho: "Gastronomia",
        seguidores: 85000,
        regiao: "São Paulo",
      },
    });
    await prisma.parceria.create({
      data: {
        influenciadorId: inf.id,
        tipo: "PERMUTA",
        entregaveis: "2 Reels + 3 Stories",
        postoAtivacaoId: posto1?.id,
        cupom: "SAMIRA10",
        status: "NEGOCIANDO",
      },
    });
  }

  // ----- Fase 6: métricas (PDV + Google) e mix de categorias -----
  const agora = new Date();
  const fmtMes = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const mesAtual = fmtMes(agora);
  const mesAnterior = fmtMes(
    new Date(agora.getFullYear(), agora.getMonth() - 1, 1),
  );

  if ((await prisma.metricaPosto.count()) === 0) {
    const todosPostos = await prisma.posto.findMany();
    // vendas do mês anterior e atual por nome (para calcular o farol automático)
    const dados: Record<string, [number, number, number, number]> = {
      // nome: [vendasAnterior, vendasAtual, ticket, notaGoogle]
      "Posto Mykonos": [120000, 135000, 42, 4.6],
      "Posto Paz — Vila São Francisco": [95000, 90000, 38, 4.2],
      "Posto Novo Horizonte": [0, 0, 0, 0],
    };
    for (const p of todosPostos) {
      const d = dados[p.nome];
      if (!d || d[1] === 0) continue;
      const [vAnt, vAtu, ticket, nota] = d;
      await prisma.metricaPosto.createMany({
        data: [
          {
            postoId: p.id,
            mes: mesAnterior,
            vendas: vAnt,
            ticketMedio: ticket,
            notaGoogle: nota,
            avaliacoes: 150,
            pedidosRota: 280,
            visualizacoes: 4800,
          },
          {
            postoId: p.id,
            mes: mesAtual,
            vendas: vAtu,
            ticketMedio: ticket,
            notaGoogle: nota,
            avaliacoes: 180,
            pedidosRota: 320,
            visualizacoes: 5400,
          },
        ],
      });
    }
  }

  if ((await prisma.mixCategoria.count()) === 0) {
    await prisma.mixCategoria.createMany({
      data: [
        { categoria: "Café e padaria", participacao: 22, ordem: 1 },
        { categoria: "Bebidas", participacao: 18, ordem: 2 },
        { categoria: "Mercearia", participacao: 16, ordem: 3 },
        { categoria: "Higiene e limpeza", participacao: 14, ordem: 4 },
        { categoria: "Snacks e doces", participacao: 12, ordem: 5 },
        { categoria: "Congelados", participacao: 8, ehNovo: true, ordem: 6 },
      ],
    });
  }

  console.log("\n✅ Seed concluído.");
  console.log(`   ADM: ${adm.nome} — WhatsApp de login: 11999990000`);
  console.log("   Marketing: Marina — WhatsApp: 11999990001");
  console.log("   Gerente: Wanderley — WhatsApp: 11999990002 (app /gerente)");
  console.log("   Landing de teste: /qr/demoqr123456\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
