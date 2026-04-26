# LPMIS — Local Project Management Information System

Monorepo with three packages: a React web frontend (`client/`), a React Native mobile app (`HomeDash/`), and a Python FastAPI backend (`server/`).

## Rules for Claude

- **Do NOT modify anything inside the `HomeDash/` folder.** All changes are limited to `client/` and `server/` only.
- **After every change, log it in `Claude-Changes.md`** at the root of the repository. Each entry must include the date, files changed, and a short description of what was done. Append new entries at the top of the file.

## Repository Layout

```
lpmis/
├── client/        # React + TypeScript web app (Vite, PWA)
├── HomeDash/      # React Native mobile app (Expo) — gitignored
├── server/        # Python FastAPI backend
├── .env           # Root AI service credentials (Anthropic, Gemini)
└── README.md      # High-level feature spec
```

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | React 19, TypeScript, Vite, TailwindCSS 4, React Router 6 |
| Mobile | Expo ~54, React Native 0.81, React Navigation 6 |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2, Uvicorn |
| Database | Supabase (managed PostgreSQL) |
| AI | Anthropic Claude API, Google Gemini API |
| Deployment | Vercel (web + serverless backend), Expo (mobile) |

## Development

### Web frontend
```bash
cd client
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build
npm run lint
```

### Backend
```bash
cd server
pip install -e .   # or: pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile
```bash
cd HomeDash
npm install
npm run start      # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android simulator
```

## Environment Variables

### `/client/.env`
```
VITE_API_BASE=http://localhost:8000          # local backend
VITE_API_BASE_DEV=https://<vercel-url>      # deployed backend
```

### `/server/.env`
```
SUPABASE_URL=...
SUPABASE_PASSWORD=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
```

### `/HomeDash/.env`
```
VITE_API_BASE=http://localhost:8000
EXPO_PUBLIC_API_BASE_DEV=https://<vercel-url>
```

## Architecture

- **Auth:** Phone number (10-digit) + 4-digit OTP/password via `/homedash/validate-user`
- **State:** React Context (`AuthContext`) for user session in web and mobile
- **Data scope:** Personal data or group-scoped data (transactions, stocks, carts)
- **API prefix:** All backend routes are under `/homedash/`

## Database Tables (Supabase)

- `homedash_user` — users
- `homedash_group` — groups
- `homedash_stock` — inventory items
- `homedash_cart` — cart entries
- `homedash_transaction` — financial transactions
