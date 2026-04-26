# Server — Python FastAPI Backend

FastAPI backend with SQLAlchemy + Supabase (PostgreSQL). Deployed as Vercel serverless functions via Mangum adapter.

## Commands

```bash
# Install dependencies
pip install -e .
# or
pip install -r requirements.txt

# Run locally
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Project Structure

```
server/
├── main.py           # FastAPI app init + route registration
├── routes/           # Route modules (users, groups, transactions, stock, cart)
├── models/           # SQLAlchemy ORM models
├── database.py       # DB connection + session setup
├── pyproject.toml    # Project metadata + dependencies (Hatchling)
├── requirements.txt  # Pinned dependencies
├── .env              # Secrets (never commit)
└── README.md         # DB schema (SQL) + local run instructions
```

## API Routes

All routes are prefixed with `/homedash`:

| Method | Path | Description |
|---|---|---|
| POST | `/homedash/validate-user` | Phone + OTP authentication |
| GET/POST | `/homedash/groups` | List / create groups |
| GET/POST/PUT/DELETE | `/homedash/transactions` | Transaction CRUD |
| GET/POST/PUT/DELETE | `/homedash/stock` | Stock/inventory CRUD |
| GET/POST/PUT/DELETE | `/homedash/cart` | Cart CRUD |

## Environment Variables

```
SUPABASE_URL=postgresql://...
SUPABASE_PASSWORD=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
```

Copy from `.env.example` if present; never commit `.env`.

## Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| fastapi | >=0.115.0 | Web framework |
| uvicorn | >=0.34.0 | ASGI server |
| sqlalchemy | >=2.0.30 | ORM |
| psycopg2-binary | >=2.9.9 | PostgreSQL driver |
| mangum | >=0.17.0 | AWS Lambda / Vercel adapter |
| anthropic | >=0.91.0 | Claude AI SDK |
| python-dotenv | latest | Env var loading |

## Database Schema

See `README.md` for the full SQL schema. Tables: `homedash_user`, `homedash_group`, `homedash_stock`, `homedash_cart`, `homedash_transaction`.
