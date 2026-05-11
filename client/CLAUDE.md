# Client — React Web Frontend

React 19 + TypeScript web app built with Vite. Deployed on Vercel as a PWA.

## Commands

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # type-check + production build
npm run preview   # preview production build locally
npm run lint      # ESLint
```

## Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── main.tsx         # React DOM entry point
│   ├── App.tsx          # Router + AuthProvider setup
│   ├── apiConfig.ts     # Resolves API base URL from env
│   ├── pages/           # Route-level page components
│   │   ├── HomePage.tsx       # Dashboard overview + HomieAgent
│   │   ├── PersonalPage.tsx   # Transactions / Stocks / Cart / Journal tabs
│   │   ├── GroupPage.tsx      # Group Transactions / Stocks / Cart tabs
│   │   ├── GroupsPage.tsx     # MyHomeDash groups list
│   │   └── LoginPage.tsx      # Phone + OTP auth
│   ├── components/      # Shared UI components
│   │   ├── HomieAgent.tsx     # LangGraph AI chat (no tab, auto context)
│   │   ├── JournalEditor.tsx  # Journal list + editor with AI rewrite
│   │   ├── LineChart.tsx      # SVG line chart for transactions
│   │   ├── NavBar.tsx         # Top nav with auth
│   │   ├── Transactions.tsx   # Transaction table/cards
│   │   ├── Stocks.tsx         # Stock table/cards
│   │   └── Carts.tsx          # Cart table/cards
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/             # API utilities
│   │   ├── moneyApi.ts  # All fetch wrappers (with cache)
│   │   └── cache.ts     # In-memory TTL cache (3 min)
│   └── types/
│       └── dashboard.ts # All TypeScript types
├── index.html
├── vite.config.ts       # Vite + PWA plugin config
├── vercel.json          # Vercel API rewrites
└── Instructions.md      # Detailed feature requirements
```

## Key Patterns

- **Routing:** React Router DOM v6 with file-based page components under `src/pages/`
- **Auth:** `AuthContext` wraps the app; login uses phone + 4-digit OTP via `/homedash/validate-user`
- **API calls:** Base URL from `VITE_API_BASE` (local) or `VITE_API_BASE_DEV` (deployed); set in `.env`
- **Caching:** `apiCache` (3-minute TTL in-memory cache) wraps all GET calls; mutations call `apiCache.invalidate(prefix)`
- **Styling:** TailwindCSS 4 utility classes; PostCSS pipeline
- **Icons:** `@mui/icons-material` — import only the SVG icon components (not the full MUI theme)
- **PWA:** `vite-plugin-pwa` — service worker and manifest auto-generated

## HomieAgent

`HomieAgent.tsx` is the AI chat component on the home screen. It sends the full message history to the server LangGraph agent and does NOT have a tab selector or group dropdown — context is inferred by the server.

**Props:** `userId: number`, `groups: Group[]`

**API call:** `POST /chat` with `{ messages, user_id, available_groups }` via `chatWithHomie()` in `moneyApi.ts`

**Response:** `AgentChatResponse` — includes `response`, `cart_suggestions`, `action_suggestions`, `inferred_context`, `inferred_group_id`

**Action cards:** Each `ActionSuggestion` (add/update/remove for transaction/stock/cart) renders as a tappable card with entity color coding. Clicking calls the appropriate CRUD API directly.

**Cart suggestion chips:** Legacy `CART_SUGGESTIONS:` protocol items render as quick "Add to cart" chips.

## Key Types (dashboard.ts)

- `ChatMessage` — `{role: user|assistant, content: string}`
- `ActionSuggestion` — `{type: add|update|remove, entity: transaction|stock|cart, label: string, data: Record<string, unknown>}`
- `AgentChatResponse` — full server response with response, cart_suggestions, action_suggestions, clarification, inferred_context, inferred_group_id

## Environment

```
VITE_API_BASE=http://localhost:8000
VITE_API_BASE_DEV=https://<vercel-deployment-url>
```

Only `VITE_`-prefixed variables are exposed to the browser bundle.

## Deployment

Vercel. `vercel.json` rewrites `/api/*` → backend serverless functions. Run `npm run build` to produce `dist/`.
