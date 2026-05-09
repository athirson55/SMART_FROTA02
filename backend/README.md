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
DATABASE_URL=postgresql+psycopg2://usuario:senha@localhost:5432/smartfrota
SECRET_KEY=uma-chave-forte
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

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
