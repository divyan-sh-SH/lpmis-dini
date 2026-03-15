# API – My Money Dashboard

Backend runs on FastAPI and uses Supabase (PostgreSQL). Set `SUPABASE_URL` in `.env`.

## Database schema (Supabase / PostgreSQL)

Run these in the Supabase SQL editor (or any PostgreSQL client) if the tables are not already present:

```sql
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount REAL NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    item_name TEXT NOT NULL,
    store TEXT,
    cost REAL NOT NULL,
    notes TEXT
);
```

## Local run

```bash
pip install -r api/requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```
