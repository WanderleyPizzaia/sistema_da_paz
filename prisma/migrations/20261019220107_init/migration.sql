-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MARKETING',
    "funcao" TEXT,
    "postoId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Posto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "bandeira" TEXT NOT NULL DEFAULT 'PAZ',
    "endereco" TEXT,
    "etapa" TEXT NOT NULL DEFAULT 'OPERACAO',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Posto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricaPosto" (
    "id" TEXT NOT NULL,
    "postoId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "vendas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ticketMedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notaGoogle" DOUBLE PRECISION,
    "avaliacoes" INTEGER NOT NULL DEFAULT 0,
    "pedidosRota" INTEGER NOT NULL DEFAULT 0,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricaPosto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MixCategoria" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "participacao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ehNovo" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MixCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "tipoVeiculo" TEXT,
    "postoPreferidoId" TEXT,
    "origem" TEXT,
    "tags" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "postoId" TEXT NOT NULL,
    "bomba" TEXT,
    "campanhaNome" TEXT,
    "campanhaId" TEXT,
    "premio" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campanha" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "premio" TEXT,
    "inicio" TIMESTAMP(3),
    "fim" TIMESTAMP(3),
    "regulamentoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "ganhadorParticipacaoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campanha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participacao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "campanhaId" TEXT NOT NULL,
    "numeroSorte" TEXT NOT NULL,
    "canal" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloMensagem" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "corpo" TEXT NOT NULL,
    "statusMeta" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModeloMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "gatilho" TEXT NOT NULL,
    "modeloId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Automacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disparo" (
    "id" TEXT NOT NULL,
    "modeloId" TEXT,
    "campanhaId" TEXT,
    "segmentoDescricao" TEXT,
    "total" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ENVIADO',
    "userId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Disparo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consentimento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "finalidade" TEXT NOT NULL,
    "aceito" BOOLEAN NOT NULL,
    "politicaVersao" TEXT NOT NULL,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consentimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoCliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "detalhe" TEXT,
    "postoId" TEXT,
    "qrCodeId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostoStatus" (
    "id" TEXT NOT NULL,
    "postoId" TEXT NOT NULL,
    "mesRef" TEXT NOT NULL,
    "farol" TEXT NOT NULL DEFAULT 'AMARELO',
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostoStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcaoMarketing" (
    "id" TEXT NOT NULL,
    "postoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT,
    "data" TIMESTAMP(3),
    "responsavel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "fotoEnviada" BOOLEAN NOT NULL DEFAULT false,
    "feitaEm" TIMESTAMP(3),
    "fotoAprovada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcaoMarketing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginCode" (
    "id" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT,
    "entidadeId" TEXT,
    "detalhe" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoArte" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "postoId" TEXT,
    "acao" TEXT NOT NULL,
    "formato" TEXT,
    "descricao" TEXT,
    "textoArte" TEXT,
    "referencias" TEXT,
    "responsavel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "prazo" TIMESTAMP(3) NOT NULL,
    "entregueEm" TIMESTAMP(3),
    "pastaUrl" TEXT,
    "ehEStop" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoArte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "origem" TEXT NOT NULL DEFAULT 'IDEIA',
    "etapa" TEXT NOT NULL DEFAULT 'IDEIA',
    "postoId" TEXT,
    "roteiro" TEXT,
    "elenco" TEXT,
    "votos" INTEGER NOT NULL DEFAULT 0,
    "pastaUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PontoEStop" (
    "id" TEXT NOT NULL,
    "postoId" TEXT NOT NULL,
    "numCarregadores" INTEGER NOT NULL DEFAULT 1,
    "potenciaKw" DOUBLE PRECISION,
    "conector" TEXT,
    "horario" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "fotoUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PontoEStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Influenciador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "arroba" TEXT,
    "nicho" TEXT,
    "seguidores" INTEGER NOT NULL DEFAULT 0,
    "whatsapp" TEXT,
    "regiao" TEXT,
    "quemIndicou" TEXT,
    "fotoUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Influenciador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parceria" (
    "id" TEXT NOT NULL,
    "influenciadorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PERMUTA',
    "entregaveis" TEXT,
    "postoAtivacaoId" TEXT,
    "contratoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROSPECCAO',
    "cupom" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Parceria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CampanhaPostos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CampanhaPostos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsapp_key" ON "User"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "MetricaPosto_postoId_mes_key" ON "MetricaPosto"("postoId", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_whatsapp_key" ON "Cliente"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_token_key" ON "QRCode"("token");

-- CreateIndex
CREATE INDEX "Participacao_campanhaId_idx" ON "Participacao"("campanhaId");

-- CreateIndex
CREATE UNIQUE INDEX "Participacao_clienteId_campanhaId_key" ON "Participacao"("clienteId", "campanhaId");

-- CreateIndex
CREATE INDEX "EventoCliente_clienteId_idx" ON "EventoCliente"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "PostoStatus_postoId_mesRef_key" ON "PostoStatus"("postoId", "mesRef");

-- CreateIndex
CREATE INDEX "LoginCode_whatsapp_idx" ON "LoginCode"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "_CampanhaPostos_B_index" ON "_CampanhaPostos"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricaPosto" ADD CONSTRAINT "MetricaPosto_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_postoPreferidoId_fkey" FOREIGN KEY ("postoPreferidoId") REFERENCES "Posto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "Campanha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participacao" ADD CONSTRAINT "Participacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participacao" ADD CONSTRAINT "Participacao_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "Campanha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automacao" ADD CONSTRAINT "Automacao_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloMensagem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disparo" ADD CONSTRAINT "Disparo_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloMensagem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disparo" ADD CONSTRAINT "Disparo_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "Campanha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimento" ADD CONSTRAINT "Consentimento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCliente" ADD CONSTRAINT "EventoCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCliente" ADD CONSTRAINT "EventoCliente_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCliente" ADD CONSTRAINT "EventoCliente_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostoStatus" ADD CONSTRAINT "PostoStatus_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcaoMarketing" ADD CONSTRAINT "AcaoMarketing_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoArte" ADD CONSTRAINT "PedidoArte_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PontoEStop" ADD CONSTRAINT "PontoEStop_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "Posto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parceria" ADD CONSTRAINT "Parceria_influenciadorId_fkey" FOREIGN KEY ("influenciadorId") REFERENCES "Influenciador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parceria" ADD CONSTRAINT "Parceria_postoAtivacaoId_fkey" FOREIGN KEY ("postoAtivacaoId") REFERENCES "Posto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampanhaPostos" ADD CONSTRAINT "_CampanhaPostos_A_fkey" FOREIGN KEY ("A") REFERENCES "Campanha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampanhaPostos" ADD CONSTRAINT "_CampanhaPostos_B_fkey" FOREIGN KEY ("B") REFERENCES "Posto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
