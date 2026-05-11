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
