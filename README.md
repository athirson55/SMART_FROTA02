# Smart Frota

Sistema web completo de gestão de frotas para o mercado brasileiro.

## Stack

**Frontend:** React 18 · Vite · React Router DOM · Axios · CSS puro  
**Backend:** FastAPI · SQLAlchemy 2 · PostgreSQL · Alembic · JWT

## Módulos

- Veículos — cadastro, status, quilometragem, CRLV e seguro
- Motoristas — CNH, categoria, vencimento e disponibilidade
- Manutenções — preventiva/corretiva, custo, mecânico e oficina
- Agendamentos — ordens de serviço com data, hora e local
- Alertas — prioridade CRITICO / MEDIO / BAIXO com notificações
- Relatórios — dashboard e exportação de dados
- Autenticação — JWT com refresh token, confirmação de email e recuperação de senha real

## Executando o frontend

```bash
npm install
npm run dev
```

Crie um `.env` na raiz com:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Executando o backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Crie um `backend/.env` com:

```env
DATABASE_URL=postgresql+psycopg2://smartfrota:smartfrota@localhost:5432/smartfrota
SECRET_KEY=troque-esta-chave-em-producao
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
AUTO_CREATE_TABLES=True
SEED_ON_STARTUP=True
RATE_LIMIT_AUTH=10/minute
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

O backend já está preparado em [render.yaml](render.yaml). Use estes valores no painel do Render se estiver criando manualmente:

- **Service type:** Web Service
- **Runtime:** Python
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **DATABASE_URL:** vinculado ao PostgreSQL criado no próprio Render
- **SECRET_KEY:** gerado pelo Render
- **APP_NAME:** `Smart Frota API`
- **ENVIRONMENT:** `production`
- **ACCESS_TOKEN_EXPIRE_MINUTES:** `15`
- **REFRESH_TOKEN_EXPIRE_DAYS:** `7`
- **CORS_ORIGINS:** `https://athirson55.github.io`
- **FRONTEND_URL:** `https://athirson55.github.io/SMART_FROTA02`
- **AUTO_CREATE_TABLES:** `true`
- **SEED_ON_STARTUP:** `false`
- **RESEND_API_KEY:** preencher se for usar envio real de email
- **EMAIL_FROM_NAME:** `Smart Frota`
- **EMAIL_VERIFY_EXPIRE_HOURS:** `24`
- **RATE_LIMIT_AUTH:** `10/minute`

A URL pública do backend aparece em **Domains** no serviço do Render. A documentação interativa da API fica disponível em `/docs`.

## Testes E2E

```bash
npx playwright test
```
