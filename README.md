# CRM Rede Paz / PAZ365 — local (Fases 1 a 6 ✓)

CRM de marketing completo da Rede Paz rodando localmente. Cobre as 19 telas da
especificação: visão geral e PAZ365 (00, 01), postos e farol (07, 08), clientes
e captação por QR (02, 03, 06), campanhas e WhatsApp (04, 05), produção —
designer, vídeos, E-Stop e influenciadores (09–12), app do gerente PWA (13–15),
usuários e operação (18, 19).

## Stack

- **Next.js 16** (App Router, TypeScript) — front + backend num processo só
- **Prisma 6 + PostgreSQL** — banco (local via Docker; produção no EasyPanel)
- **Tailwind 4** — estilos
- **Docker** — `Dockerfile` para produção e `docker-compose.yml` para o Postgres local

O login por código ainda é simulado (o código aparece na tela); a WhatsApp
Business API entra numa fase seguinte. Para subir na VPS, veja `DEPLOY.md`.

## Como rodar

Precisa do **Docker** instalado (para o Postgres local).

```bash
cd crm
docker compose up -d db   # sobe o Postgres local (só na primeira vez fica de pé)
npm install               # só na primeira vez
npm run db:deploy         # cria as tabelas (migrações)
npm run db:seed           # cria usuários e dados de exemplo (idempotente)
npm run dev               # sobe em http://localhost:3000
```

Parar o banco depois: `docker compose down` (os dados ficam salvos no volume).

## Como entrar

O login é por código de 6 dígitos. **Em modo local, o código aparece na
própria tela** (e também no terminal). Use um dos WhatsApp de exemplo:

- **Administrador:** `11999990000` (vê e faz tudo)
- **Marketing:** `11999990001` (opera farol e ações; clientes em leitura)
- **Gerente:** `11999990002` (abre o app do gerente em `/gerente`)

Landing pública de teste (sem login): `http://localhost:3000/qr/demoqr123456`
Sair / trocar de conta: `http://localhost:3000/logout`

## O que já funciona

**Fase 1 — base e postos**

- Login por WhatsApp + código, sessão em cookie httpOnly
- Perfis **ADM / Marketing / Gerente** com permissão checada no servidor
- **Postos da rede:** lista com farol do mês e resumo
- **Página do posto:** define o farol (Verde/Amarelo/Vermelho) + observação,
  cria e marca ações de marketing como feitas
- **Usuários e acessos (ADM):** cadastra, ativa/desativa; desativar derruba a
  sessão na hora

**Fase 2 — clientes e captação**

- **Landing do QR (pública):** `/qr/<token>` — cliente se cadastra e dá os
  consentimentos; cria cliente, consentimentos (LGPD) e evento
- **QR Codes por bomba:** gerados na página do posto, com link e ativar/desativar
- **Clientes:** base com busca e filtros (veículo, posto), cadastro manual (ADM)
- **Ficha do cliente:** dados, linha do tempo, consentimentos; **exportar** e
  **excluir** dados (direitos LGPD, só ADM). Marketing vê em leitura.

**Fase 3 — campanhas e WhatsApp**

- **Campanhas e sorteios:** criar campanha (sorteio/cupom/oferta), postos
  participantes, status; **sortear** ganhador aleatório
- **Número da sorte:** QR ligado a um sorteio gera o número no cadastro da landing
- **WhatsApp:** modelos de mensagem com aprovação simulada da Meta; automações
  (ex.: cadastro pelo QR → responde com número da sorte)
- **Disparo em massa:** envia um modelo **aprovado** para o segmento filtrado,
  respeitando o **opt-in** de marketing (LGPD). Envio simulado no modo local.

**Fase 4 — produção**

- **Designer:** fila de pedidos de arte com prazo de 24h (contador colorido:
  verde > 12h, amarelo 6–12h, vermelho < 6h/atrasado) e fluxo
  Aberto → Para aprovar → Entregue
- **Vídeos:** quadro kanban (Ideias → Roteiro → Aprovar → Gravação → Edição →
  Publicado) com votos no banco de ideias
- **E-Stop:** pontos de recarga elétrica (potência, conector, status)
- **Influenciadores:** cadastro + parcerias (permuta/pago, cupom, posto de
  ativação) com status Prospecção → … → Encerrado

**Fase 5 — app do gerente (PWA) + operação**

- **App do Gerente** (`/gerente`): PWA mobile instalável (manifest + service
  worker), login por código, **travado no posto do gerente**, duas abas:
  *Ações locais* (marcar feita + foto) e *Pedidos ao marketing* (arte/vídeo)
- O gerente **não entra no CRM** — é redirecionado para o app
- **Operação das ações** (tela 19, ADM/Marketing): situação por posto calculada
  automaticamente (Funcionando / Atrasado / Sem retorno), aprovar/pedir refazer
  foto, cobrança simulada no WhatsApp

**Fase 6 — visão geral e métricas**

- **Visão geral** (tela 01): dashboard inicial com KPIs reais (vendas, ticket,
  clientes, participações), saúde dos postos, funil de captação, produção e
  status das integrações
- **PAZ365** (tela 00): hero da estratégia, pilares, mapa de expansão por etapa,
  mix por categoria, lojas em operação com vendas
- **Google Meu Negócio + PDV** na página do posto: nota, avaliações, pedidos de
  rota, visualizações, vendas e ticket médio (simulados)
- **Farol automático**: calcula o farol do mês comparando as vendas (PDV) com o
  mês anterior
- Log de auditoria de cada ação importante

## O que fica para a fase de produção (hoje simulado no local)

- Integrações reais: WhatsApp Business API, Google Business Profile, Meta/IG,
  TikTok/YouTube, Google Drive (pastas de arte/vídeo), PDV, carregadores E-Stop
- Banco Postgres/Supabase no lugar do SQLite (trocar o `provider` no schema)
- Foto real com câmera + fila offline no app do gerente
- Ícones PNG otimizados do PWA

## Scripts úteis

```bash
npm run db:seed    # repovoa exemplos
npm run db:reset   # apaga e recria o banco do zero
npm run build      # build de produção
```
