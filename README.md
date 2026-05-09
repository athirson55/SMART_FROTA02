# Smart Frota PI

Tela de login implementada em React + Vite com base no design do Figma.

## Stack

- React
- Vite
- React Router DOM
- Axios
- CSS puro

## Frontend

```bash
npm install
npm run dev
```

## Backend novo

O backend FastAPI novo fica em [backend/](backend). Ele usa PostgreSQL, SQLAlchemy, Alembic e JWT.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Integração com backend

Defina a variável de ambiente `VITE_API_BASE_URL` em um arquivo `.env` para apontar para a API.

Exemplo:

```bash
VITE_API_BASE_URL=http://localhost:8000
```
