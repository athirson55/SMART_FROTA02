# Smart Frota API

Backend novo do Smart Frota, construído com FastAPI, SQLAlchemy, PostgreSQL e JWT.

## Requisitos

- Python 3.11+
- PostgreSQL 15+

## Instalação

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Configuração

Copie o arquivo `.env` e ajuste a URL do PostgreSQL.

```env
DATABASE_URL=postgresql+psycopg://usuario:senha@localhost:5432/smartfrota
SECRET_KEY=uma-chave-forte
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@smartfrota.com
EMAIL_FROM_NAME=Smart Frota
PASSWORD_RESET_EXPIRE_MINUTES=60
EMAIL_VERIFY_EXPIRE_HOURS=24
```

## Deploy no Render

Quando for publicar, os campos principais são:

- `DATABASE_URL` vindo do banco criado pelo Render
- `SECRET_KEY` gerado automaticamente
- `ENVIRONMENT=production`
- `CORS_ORIGINS=https://athirson55.github.io`
- `FRONTEND_URL=https://athirson55.github.io/SMART_FROTA02`
- `AUTO_CREATE_TABLES=true`
- `SEED_ON_STARTUP=false`

### Banco de dados no Render

O serviço precisa da variável de ambiente `DATABASE_URL` apontando para o banco gerenciado pelo Render. Há duas formas de garantir isso:

- Usando `render.yaml` (infra as code): o repositório já contém um mapeamento que popula `DATABASE_URL` a partir do banco definido (`smart-frota-db`). Se você importou este YAML no Render, o serviço lerá a connection string automaticamente.

- Manual (painel): se a variável não estiver presente, vá em Render → Databases → selecione seu banco (`smart-frota-db`) → copie a "Connection string" e depois vá em Render → Services → `smart-frota-api` → Environment e adicione:
  - Key: `DATABASE_URL`
  - Value: (cole a connection string)

Após ajustar a variável, clique em **Deploy Latest Revision** e verifique os Live Logs até ver a inicialização bem-sucedida do SQLAlchemy ou `/health` respondendo com sucesso.

### Envio de e-mail em produção (verificação de conta)

O backend exige envio de e-mail para confirmar contas em `ENVIRONMENT=production`. Para habilitar o envio de e-mails em produção **não** coloque chaves secretas no repositório — use o painel do Render (Environment).

Opção recomendada: Resend (API)

1. Crie conta em https://resend.com e gere uma API Key (começa com `sk_...`).
2. No dashboard do Render → selecione o serviço `smart-frota-api` → **Environment** → **Add Environment Variable**.
   - Key: `RESEND_API_KEY`
   - Value: (cole sua chave `sk_...`)
   - Salve e clique em **Deploy Latest Revision** (ou redeploy manual).

Alternativa (SMTP): preencha as variáveis abaixo em Environment se preferir SMTP:

    - `SMTP_HOST` (ex.: smtp.sendgrid.net)
    - `SMTP_PORT` (ex.: 587)
    - `SMTP_USER` (usuário SMTP)
    - `SMTP_PASSWORD` (senha SMTP)
    - `SMTP_FROM` (ex.: noreply@seudominio.com)

Testes pós-deploy

Use este comando (PowerShell) para testar um registro de usuário único:

```powershell
$ts = (Get-Date).ToString('yyyyMMddHHmmss')
$body = @{nome='Teste AI'; email="teste+$ts@example.com"; senha='Aa1!aaaa'} | ConvertTo-Json
Invoke-RestMethod -Uri 'https://smart-frota02-1.onrender.com/auth/registrar' -Method Post -Body $body -ContentType 'application/json' -Verbose
```

Resposta esperada em produção:

- HTTP 200 com `requiresEmailVerification: true` no `data` (e um e-mail enviado ao endereço fornecido).

Se ocorrer `500` ou erro de envio, verifique os logs do Render (Live Logs) e confirme que a chave `RESEND_API_KEY` ou variáveis SMTP estão corretas.

Segurança

- Nunca commit a chave `RESEND_API_KEY` ou credenciais SMTP no repo. Use sempre o painel de Environment do Render.
- Depois de confirmar que o envio funciona, monitore logs de erro para detectar falhas de entrega.

## Migrações

```bash
alembic upgrade head
```

## Execução

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend

Configure o frontend para usar `VITE_API_BASE_URL=http://localhost:8000`.
