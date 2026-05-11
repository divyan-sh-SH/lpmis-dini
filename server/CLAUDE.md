# Server — Python FastAPI Backend

FastAPI backend with SQLAlchemy + Supabase (PostgreSQL). Deployed as Vercel serverless functions via Mangum adapter.

## Commands

```bash
# Install dependencies (uses .venv at server/.venv)
.venv/bin/python3 -m pip install -e .
# or
.venv/bin/python3 -m pip install -r requirements.txt

# Run locally
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Project Structure

```
server/
├── main.py              # FastAPI app init + route registration
├── agent/               # LangGraph agent (HomieAgent)
│   ├── __init__.py
│   ├── state.py         # AgentState TypedDict + Intent constants
│   ├── prompts.py       # All LLM prompt templates
│   ├── nodes.py         # All graph node functions
│   └── graph.py         # LangGraph StateGraph compilation → homie_graph
├── api/                 # Route modules
│   ├── chat_router.py   # POST /chat — invokes homie_graph
│   ├── transaction_router.py
│   ├── stock_router.py
│   ├── cart_router.py
│   ├── group_router.py
│   ├── user_router.py
│   └── journal_router.py
├── models/              # SQLAlchemy ORM + Pydantic request models
├── db/                  # DB session + service helpers
├── docs/                # Design docs
│   ├── agent_flow.md         # HomieAgent LangGraph design
│   └── agent_enhancement.md  # Deferred enhancement options (Q3/Q4/Q5)
├── pyproject.toml       # Project metadata + dependencies
├── requirements.txt     # Pinned dependencies
├── .env                 # Secrets (never commit)
└── README.md            # DB schema (SQL) + local run instructions
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
| POST | `/homedash/chat` | HomieAgent LangGraph chat |
| GET/POST/PUT/DELETE | `/homedash/journal` | Journal CRUD |

## HomieAgent — LangGraph Architecture

The chat endpoint uses a stateless LangGraph agent. Each request re-runs the full graph.

### Request / Response

```json
// POST /chat
{
  "messages": [{"role": "user", "content": "..."}],
  "user_id": 9347330650,
  "available_groups": [{"group_id": "uuid", "group_name": "Flat 4B"}]
}

// Response
{
  "response": "...",
  "cart_suggestions": ["Onions"],
  "action_suggestions": [{"type": "add", "entity": "cart", "label": "...", "data": {...}}],
  "clarification": null,
  "inferred_context": "personal",
  "inferred_group_id": null
}
```

### Graph flow

```
classify_intent
  ├─ generic → general_response → END
  ├─ unclear → ask_clarification → END
  └─ personal/group → resolve_context
       ├─ unclear (multiple groups) → ask_clarification → END
       └─ resolved → fetch_data → generate_response → build_action_cards → END
```

- `classify_intent`: LLM structured output (`ChatAnthropic.with_structured_output()`) classifies context/intent/entity
- `resolve_context`: Matches group name if multiple groups exist
- `fetch_data`: DB queries scoped to user/group; last 15 days for transactions
- `generate_response`: Full LLM call with data in system prompt; embeds `ACTION_SUGGESTIONS:` and `CART_SUGGESTIONS:` protocols
- `build_action_cards`: Parses embedded protocols, injects owner fields (user_id/group_id) into add actions
- `ask_clarification`: Builds polite message (no LLM needed)
- `general_response`: LLM call with no DB data

DB session is passed to nodes via `config["configurable"]["db"]` (LangGraph RunnableConfig).

## Environment Variables

```
SUPABASE_URL=postgresql://...
SUPABASE_PASSWORD=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
```

## Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| fastapi | >=0.115.0 | Web framework |
| uvicorn | >=0.34.0 | ASGI server |
| sqlalchemy | >=2.0.30 | ORM |
| psycopg2-binary | >=2.9.9 | PostgreSQL driver |
| mangum | >=0.17.0 | AWS Lambda / Vercel adapter |
| anthropic | >=0.101.0 | Claude AI SDK (updated by langgraph install) |
| langchain-anthropic | >=1.0.0 | ChatAnthropic + structured output for agent |
| langgraph | >=1.0.0 | Agentic graph execution |
| python-dotenv | latest | Env var loading |

## Database Schema

See `README.md` for the full SQL schema. Tables: `homedash_user`, `homedash_group`, `homedash_stock`, `homedash_cart`, `homedash_transaction`, `homedash_journal`.
