# LPMIS — Technical Architecture

## Overview

LPMIS (Local Project Management Information System) is a full-stack personal finance and household management platform. It consists of a React web frontend (`client/`) and a Python FastAPI backend (`server/`), communicating via a REST API prefixed at `/homedash`.

---

## Frontend — `client/`

### Stack

| Layer | Technology |
|---|---|
| Framework | React 19, TypeScript 5.9 |
| Build | Vite 7, SWC (fast refresh) |
| Routing | React Router 6 |
| Styling | TailwindCSS 4, MUI Icons |
| PWA | vite-plugin-pwa (auto service worker) |
| Deployment | Vercel (static site + API rewrites) |

### Directory Structure

```
client/src/
├── App.tsx              # Root router + AuthProvider
├── apiConfig.tsx        # API base URL resolution (VITE_API_BASE)
├── pages/               # Route-level components
├── components/          # Shared UI components
├── contexts/            # React Context (AuthContext)
├── lib/                 # API layer (moneyApi.ts, cache.ts)
└── types/               # TypeScript types (dashboard.ts)
```

### Routing

Two-tier: authenticated vs unauthenticated. `AuthContext` reads `localStorage` on mount to hydrate user session.

| Route | Component | Scope |
|---|---|---|
| `/` | HomePage | Personal dashboard + group cards |
| `/personal` | PersonalPage | User-scoped transactions/stocks/carts/notes |
| `/personal/notes` | PersonalNotesPage | Personal notes editor |
| `/groups` | GroupsPage | Group list/create |
| `/groups/:groupId` | GroupPage | Group-scoped transactions/stocks/carts/notes |
| `/groups/:groupId/notes` | GroupNotesPage | Group notes editor |
| `/chat` | ChatPage | Full-page AI agent |
| `/login` | LoginPage | Phone + OTP authentication |

### Authentication

- **Flow:** 10-digit phone number + 4-digit OTP → `POST /homedash/users/validate-user`
- **Session:** User object stored in `localStorage` as `logged_in_user`
- **Context:** `useAuth()` hook provides `user`, `login()`, `logout()` globally

### API Layer (`lib/moneyApi.ts`)

- All HTTP calls go through typed wrapper functions
- **GET requests** are cached in-memory with a 3-minute TTL (`lib/cache.ts`)
- **Mutations** (POST/PUT/DELETE) invalidate the relevant cache prefix (`transactions:*`, `stocks:*`, etc.)
- `extractError()` normalises error shapes from the API

#### Endpoints

| Resource | GET (cached) | Mutations |
|---|---|---|
| Users | `/users`, `/users/:id` | POST, PUT, DELETE |
| Groups | `/groups/user/:userId` | POST |
| Transactions | `/transactions/user/:id`, `/transactions/group/:id` | POST, PUT, DELETE |
| Stocks | `/stocks/user/:id`, `/stocks/group/:id` | POST, PUT, DELETE |
| Carts | `/carts/user/:id`, `/carts/group/:id` | POST, PUT, DELETE |
| Notes | `/notes/user/:id`, `/notes/group/:id` | POST, PUT, DELETE |
| Notes (AI) | — | POST `/notes/rewrite` |
| Chat | — | POST `/chat` |

### Key Components

**`HomieAgent.tsx`** — AI chat interface
- Sends full message history + `user_id` + `available_groups` to `/homedash/chat`
- Renders markdown in assistant replies
- Parses and displays action suggestion cards (Add/Update/Remove for transaction/stock/cart)
- Dispatches accepted actions directly to CRUD endpoints

**`Transactions / Stocks / Carts`** — CRUD components
- Table + card views, inline edit forms, delete buttons
- Scoped by `user_id` (personal) or `group_id` (group) via props

**`NotesEditor.tsx`**
- Date-based notes list + textarea editor
- AI rewrite via instruction modal → `POST /homedash/notes/rewrite`

**`LineChart.tsx`**
- Hand-rolled SVG chart (no external library)
- Period selector: week / month
- Aggregates transaction data client-side

### TypeScript Types (`types/dashboard.ts`)

```
User, Group, Transaction, Stock, CartItem, Note
ChatMessage, AgentChatResponse, ActionSuggestion
```

---

## Backend — `server/`

### Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115+ |
| Server | Uvicorn (ASGI) |
| ORM | SQLAlchemy 2 |
| Database | PostgreSQL via Supabase (psycopg2) |
| AI Agent | LangGraph 1.0, LangChain-Anthropic |
| LLM | Claude Haiku 4.5 (claude-haiku-4-5-20251001) |
| Serverless | Mangum (AWS Lambda / Vercel adapter) |
| Deployment | Vercel serverless functions |

### Directory Structure

```
server/
├── main.py              # App init, CORS middleware, router registration
├── constants.py         # UserRole enum
├── api/                 # Route modules (all prefixed /homedash)
│   ├── __init__.py      # Aggregates all routers → main_router
│   ├── user_router.py
│   ├── group_router.py
│   ├── transaction_router.py
│   ├── stock_router.py
│   ├── cart_router.py
│   ├── notes_router.py
│   └── chat_router.py
├── agent/               # LangGraph agentic system
│   ├── state.py         # AgentState TypedDict + Intent constants
│   ├── graph.py         # StateGraph compilation
│   ├── nodes.py         # Node functions (classify, fetch, generate, etc.)
│   └── prompts/         # System prompt templates
├── models/
│   ├── db_models.py     # SQLAlchemy ORM models
│   └── request_models.py # Pydantic request/response schemas
└── db/
    └── session.py       # Engine, SessionLocal, get_db() dependency
```

### API Routes

All routes are prefixed `/homedash` via `main_router`.

| Router | Prefix | Key Endpoints |
|---|---|---|
| user_router | `/users` | `POST /validate-user` (auth), full CRUD |
| group_router | `/groups` | `GET /user/:userId`, full CRUD |
| transaction_router | `/transactions` | `GET /user/:id`, `GET /group/:id`, CRUD |
| stock_router | `/stocks` | `GET /user/:id`, `GET /group/:id`, CRUD |
| cart_router | `/carts` | `GET /user/:id`, `GET /group/:id`, CRUD |
| notes_router | `/notes` | Date-scoped GET, CRUD, `POST /rewrite` (AI) |
| chat_router | `/chat` | `POST /` (LangGraph agent) |

### Database Models

All entities enforce mutual exclusivity between `user_id` and `group_id` via CHECK constraints — every row belongs to exactly one scope.

| Table | Primary Key | Notable Fields |
|---|---|---|
| `homedash_user` | `user_id` (BigInt, phone number) | `username`, `role`, `otp` (4-digit) |
| `homedash_group` | `group_id` (UUID) | `group_name`, `users[]` (BigInt array), `created_by` |
| `homedash_transaction` | `transaction_id` (UUID) | `type` (income\|expense), `amount`, `date`, user/group scope |
| `homedash_stock` | `stock_id` (UUID) | `stock_item`, `quantity`, `category`, user/group scope |
| `homedash_cart` | `cart_id` (UUID) | `stock_item`, `store_name`, `cost`, user/group scope |
| `homedash_note` | `note_id` (UUID) | `date` (YYYY-MM-DD), `content`, `created_at`, `updated_at` |

### DB Session

`db/session.py` provides `get_db()` as a FastAPI dependency, yielding a SQLAlchemy session with `pool_pre_ping=True`. Injected into route handlers via `Depends(get_db)`.

---

## LangGraph Agent Architecture

The `HomieAgent` (AI chat) is powered by a stateless LangGraph `StateGraph`. Each `POST /homedash/chat` request runs the full graph from scratch; conversation history is provided by the client.

### Agent State (`agent/state.py`)

**Input:** `messages`, `user_id`, `available_groups`

**Resolved during execution:** `inferred_context`, `inferred_group_id`, `intent`, `entity`, `fetched_data`

**Output:** `response`, `action_suggestions`, `cart_suggestions`, `needs_clarification`

### Intent Types

```
greeting | query_data | extract_todos | action_add | action_update | action_remove | general_advice | clarify
```

### Graph Flow

```
classify_intent (entry)
  ├─ [greeting]             → greeting_node       → END
  ├─ [needs_clarification]  → ask_clarification   → END
  ├─ [generic]              → general_response    → END
  └─ [personal / group]
       └─ resolve_context
            ├─ [needs_clarification] → ask_clarification → END
            └─ fetch_data
                 └─ generate_response
                      └─ build_action_cards → END
```

### Node Responsibilities

| Node | Responsibility |
|---|---|
| `classify_intent` | LLM structured output → context, intent, entity. Fast-path for clarification follow-ups. |
| `resolve_context` | Maps inferred group name to a `group_id`; triggers clarification if ambiguous. |
| `fetch_data` | Queries DB (last 15 days) for relevant entity data, scoped to user or group. |
| `generate_response` | Main LLM call with system prompt, data context, and embedded ACTION_PROTOCOL. |
| `build_action_cards` | Regex extracts `ACTION_SUGGESTIONS:` and `CART_SUGGESTIONS:` JSON blocks from response. |
| `ask_clarification` | Builds template clarification message (no LLM call). |
| `general_response` | LLM call for advice/general queries (no DB data). |
| `greeting_node` | Template greeting (no LLM call). |

### Action Protocol

The LLM embeds structured JSON in its response under the `ACTION_SUGGESTIONS:` label. `build_action_cards` extracts these, injects the correct `user_id` or `group_id`, and returns them to the frontend as actionable cards.

```json
[
  { "type": "add", "entity": "transaction", "label": "Log ₹500 expense", "data": { ... } },
  { "type": "remove", "entity": "cart", "label": "Remove milk", "data": { ... } }
]
```

### LLM Configuration

- **Model:** `claude-haiku-4-5-20251001` (fast, cost-efficient for real-time chat)
- **Classification:** `ChatAnthropic.with_structured_output(Classification)` — deterministic Pydantic output
- **Max tokens:** 1500
- **DB injection:** Session passed via `config["configurable"]["db"]` (LangGraph RunnableConfig pattern)

---

## Cross-Cutting Concerns

### Data Scoping

Every entity is scoped to either a **user** (personal data) or a **group** (shared data). The DB enforces this with CHECK constraints. The API routes and frontend components consistently pass the correct scope ID.

### Caching

Client-side only. A simple TTL cache (`lib/cache.ts`) keyed by resource type and scope ID. Mutations invalidate by prefix pattern, keeping reads fast without a server-side cache layer.

### Deployment

| Component | Platform | Mechanism |
|---|---|---|
| Frontend | Vercel | Static build (`dist/`), API rewrites via `vercel.json` |
| Backend | Vercel | Serverless functions via Mangum (FastAPI → Lambda handler) |
| Database | Supabase | Managed PostgreSQL, connected via `SUPABASE_URL` |

### Environment Variables

| Location | Variable | Purpose |
|---|---|---|
| `client/.env` | `VITE_API_BASE` | Backend URL (local or deployed) |
| `server/.env` | `SUPABASE_URL` | PostgreSQL connection string |
| `server/.env` | `ANTHROPIC_API_KEY` | Claude API access |

---

## Data Flow: Chat Request

```
User types message
  → HomieAgent.tsx collects message history + user_id + groups
  → POST /homedash/chat
  → chat_router invokes homie_graph.invoke(state, config={db})
  → classify_intent (LLM structured output)
  → resolve_context / fetch_data (DB query, last 15 days)
  → generate_response (LLM with data context + ACTION_PROTOCOL)
  → build_action_cards (regex parse embedded JSON)
  → ChatResponse { response, action_suggestions, cart_suggestions }
  → Frontend renders message + action cards
  → User accepts action → CRUD endpoint called directly from HomieAgent.tsx
```

## Data Flow: CRUD Request

```
User edits/creates/deletes in Transactions / Stocks / Carts
  → moneyApi.ts wrapper (POST/PUT/DELETE /homedash/<resource>)
  → FastAPI route handler
  → SQLAlchemy ORM → Supabase PostgreSQL
  → apiCache.invalidate("<resource>") clears relevant cache keys
  → Component re-fetches with fresh data
```

# Your Context
Consider this as a basic project I have worked on. I want to add functionality to user that can: 
1. User can dynamically track any of their habits. 
2. From their configuration that can add any habits of there choice and also can track them on daily basis. 
3. Database should be able to save these habits dynamically 
4. Calender veiw that can list all the habits. 
5. Calender can also have to do list that users can add edit delete update also will be saved in database. 

With above changes design techincally from Fronetend, Backend and Database wise how this can be achieved. Let me know if you have any doubts. Make a html file that have detailed description of the approach. Suggest the best approach.
