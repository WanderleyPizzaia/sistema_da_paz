ALTER TABLE "Video"
ADD COLUMN "formato" TEXT,
ADD COLUMN "solicitante" TEXT,
ADD COLUMN "referenciaUrl" TEXT,
ADD COLUMN "gravacaoEm" TIMESTAMP(3),
ADD COLUMN "publicarAte" TIMESTAMP(3),
ADD COLUMN "publicadoEm" TIMESTAMP(3);
