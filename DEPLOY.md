# Deploy na VPS (DigitalOcean + EasyPanel)

Guia técnico para subir o CRM. O código já está pronto para produção:
PostgreSQL, `Dockerfile` e migrações automáticas.

## Resumo da infraestrutura

- **VPS:** droplet DigitalOcean com EasyPanel (ex.: 2 GB RAM).
- **App:** este repositório (`WanderleyPizzaia/sistema_da_paz`), imagem Docker.
- **Banco:** PostgreSQL criado como serviço no EasyPanel.

## 1. Banco de dados (EasyPanel)

1. No projeto do EasyPanel, **＋ Service → Postgres**.
2. Anote usuário, senha, nome do banco e a **connection string interna**
   (algo como `postgres://usuario:senha@<projeto>_<servico>:5432/banco`).

## 2. App (EasyPanel)

1. **＋ Service → App**, origem **GitHub** → `WanderleyPizzaia/sistema_da_paz`, branch `main`.
2. Como o repositório é **privado**, conecte a conta do GitHub no EasyPanel ou
   gere um **token** / **deploy key** e cole nas credenciais do serviço.
3. **Build:** `Dockerfile` (já incluído na raiz do projeto).
4. **Porta:** `3000`.
5. **Environment** (variáveis):

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | a connection string interna do passo 1 |
   | `NODE_ENV` | `production` |
   | `LOGIN_CODES_VISIVEIS` | `false` (ou `true` só em teste fechado) |

6. **Domínio:** adicione o domínio/subdomínio e ative o **HTTPS** (Let's Encrypt).
7. **Deploy.** O container roda `prisma migrate deploy` (cria as tabelas) e sobe
   a aplicação automaticamente. Acompanhe pelos **Logs**.

## 3. Primeiro administrador

O banco de produção nasce vazio. Rode uma vez, no terminal do serviço no EasyPanel:

```bash
ADMIN_NOME="Seu Nome" ADMIN_WHATSAPP="11999998888" npm run db:seed:prod
```

Isso cria um único usuário ADM. O login é por código de 6 dígitos — enquanto a
WhatsApp Business API não estiver plugada, pegue o código pelos **Logs** do app
(ou mantenha `LOGIN_CODES_VISIVEIS=true` só em ambiente de teste fechado).

## 4. Atenção ao build em 2 GB de RAM

O `next build` é pesado. Se o build travar por falta de memória no droplet de
2 GB, adicione swap (uma vez, via SSH na VPS):

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Alternativa: buildar a imagem no GitHub Actions e o EasyPanel só puxar a imagem
pronta (evita usar a RAM da VPS no build).

## 5. Checklist pós-deploy

- [ ] HTTPS funcionando no domínio.
- [ ] `LOGIN_CODES_VISIVEIS=false` (ou ambiente de teste fechado).
- [ ] Primeiro admin criado e login OK.
- [ ] Backup do banco ativado no EasyPanel.
- [ ] `.env` e `*.db` **não** estão no repositório.

## Rodar as migrações manualmente (se precisar)

```bash
npm run db:deploy      # aplica migrações pendentes
```

As integrações reais (WhatsApp, Google Business, PDV) entram depois, só
adicionando as chaves nas variáveis de ambiente — sem refazer o deploy.
