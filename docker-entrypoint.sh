#!/bin/sh
set -e

echo "→ Aplicando migrações do banco..."
npx prisma migrate deploy

echo "→ Iniciando a aplicação na porta ${PORT:-3000}..."
exec node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
