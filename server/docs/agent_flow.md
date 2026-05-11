# HomieAgent — LangGraph Agentic Flow Plan

## Overview

HomieAgent is being upgraded from a simple system-prompt-based chat to a full stateful LangGraph agent. The key shift: the user no longer selects MyDash (personal) or MyHomeDash (group) via a UI toggle — they express context naturally in their message. The agent classifies intent, resolves context, fetches the right data, and can suggest inline data-mutation actions (add / update / remove) rendered as button cards in the chat.

---

## 1. What Changes and Why

### 1.1 Remove the Tab / Group Selector from UI

**Current:** `HomieAgent.tsx` has a two-tab toggle (`MyDash` | `MyHomeDash`) and a group `<select>` dropdown. The chosen context is sent to the backend as `context: 'personal' | 'group'`.

**New:** Both widgets are removed. The user types freely. The agent infers which dashboard (or neither) the message refers to. If it cannot infer, it asks once before proceeding.

**Why:** The toggle creates friction and forces the user to think about app internals. Natural language already carries this intent ("how much did we spend last week?" implies group; "my salary" implies personal).

---

## 2. LangGraph Agent Architecture

### 2.1 State Schema

```python
class AgentState(TypedDict):
    # Input
    messages: list[dict]            # full chat history [{role, content}]
    user_id: int
    available_groups: list[dict]    # [{group_id, group_name}] — loaded at request time

    # Resolved during graph execution
    inferred_context: Optional[str]   # 'personal' | 'group' | 'generic' | 'unclear'
    inferred_group_id: Optional[str]  # UUID string if group context resolved
    intent: Optional[str]             # see Intent taxonomy below
    entity: Optional[str]             # 'transaction' | 'stock' | 'cart' | None
    fetched_data: Optional[dict]      # DB results packaged for the LLM

    # Output
    response: str
    action_suggestions: list[dict]    # parsed action cards for the frontend
    needs_clarification: bool
    clarification_reason: Optional[str]
```

### 2.2 Intent Taxonomy

| Intent | Description |
|---|---|
| `query_data` | User wants to know about their data (transactions, stocks, cart) |
| `action_add` | User wants to add a record |
| `action_update` | User wants to update a record |
| `action_remove` | User wants to delete/remove a record |
| `general_advice` | Generic household/meal/shopping advice, no DB data needed |
| `clarify` | Agent needs more info before proceeding |

### 2.3 Graph Nodes

```
START
  │
  ▼
[classify_intent]
  │
  ▼ (conditional)
  ├─── generic ──────────────────▶ [general_response] ──▶ END
  ├─── unclear ──────────────────▶ [ask_clarification] ──▶ END
  └─── personal/group intent ───▶ [resolve_context]
                                        │
                                        ▼ (conditional)
                                  ├─ group context but
                                  │  multiple groups and
                                  │  no group specified ──▶ [ask_clarification] ──▶ END
                                  └─ context resolved ───▶ [fetch_data]
                                                                │
                                                                ▼
                                                        [generate_response]
                                                                │
                                                                ▼
                                                        [build_action_cards]
                                                                │
                                                                ▼
                                                              END
```

### 2.4 Node Descriptions

#### `classify_intent`
- Makes an LLM call (fast, small prompt) on the **last user message** (with recent context)
- Outputs: `inferred_context`, `intent`, `entity`, `needs_clarification`, `clarification_reason`
- Classification prompt includes: user's available group names so the LLM can match "Flat 4B group" → group_id

**Example classifications:**

| User message | inferred_context | intent | entity |
|---|---|---|---|
| "What did I spend this week?" | personal | query_data | transaction |
| "Add milk to our cart" | group | action_add | cart |
| "What can I cook tonight?" | generic | general_advice | None |
| "How's the budget?" | unclear | clarify | None |
| "Remove rice from the Flat4B stock" | group | action_remove | stock |

#### `resolve_context`
- If `inferred_context == 'group'`:
  - If only one group exists → auto-resolve to that group
  - If multiple groups and the LLM matched a name → use that group
  - If multiple groups and no match → route to `ask_clarification`
- Sets `inferred_group_id`

#### `fetch_data`
- DB queries scoped to `inferred_context` + `user_id` / `inferred_group_id`
- Fetches based on `entity`:
  - `transaction`: last 30 days of transactions, grouped by date
  - `stock`: full stock list
  - `cart`: full cart list
  - `None` (general_advice): fetch stocks + cart for context
- Returns structured `fetched_data` dict

#### `generate_response`
- Full LLM call with system prompt that includes fetched data
- System prompt sections:
  1. Role: HomieAgent, friendly household assistant
  2. Context block: which dash, user/group name
  3. Data block: formatted stocks / cart / transactions
  4. Behaviour rules: markdown formatting, `CART_SUGGESTIONS:` protocol (kept for cart recommendations)
  5. Action protocol: if the user's intent is an action (add/update/remove), suggest it via `ACTION_SUGGESTIONS:` (see §3)

#### `build_action_cards`
- Parses `ACTION_SUGGESTIONS:` out of the raw response (same pattern as `CART_SUGGESTIONS:`)
- Validates and structures each action card
- Returns clean `response` (stripped) + `action_suggestions: list[dict]`

#### `ask_clarification`
- Builds a polite clarification message directly (no LLM call needed for simple cases)
- Examples:
  - No context: *"Are you asking about your personal MyDash or one of your home groups (Flat 4B, Office)?"*
  - Multiple groups: *"Which group did you mean — Flat 4B or Office?"*

#### `general_response`
- Direct LLM call with no DB data
- System prompt: HomieAgent role + general household assistant instructions

---

## 3. Action Suggestions Protocol

### 3.1 Server-Side Format

The response LLM appends this to the end of the response text (stripped before display):

```
ACTION_SUGGESTIONS:[
  {
    "type": "add",
    "entity": "cart",
    "label": "Add Milk to Cart",
    "data": {"stock_item": "Milk", "store_name": "", "cost": 0, "description": ""}
  },
  {
    "type": "add",
    "entity": "transaction",
    "label": "Log Rent Payment",
    "data": {"type": "expense", "amount": 25000, "description": "Rent", "date": "2026-05-01"}
  },
  {
    "type": "remove",
    "entity": "stock",
    "label": "Remove Rice",
    "data": {"stock_item": "Rice", "match_by": "name"}
  }
]
```

Supported action types: `add`, `update`, `remove`  
Supported entities: `transaction`, `stock`, `cart`

### 3.2 Client-Side Rendering

Each action card is rendered below the assistant message bubble:

```
┌──────────────────────────────────────────┐
│  🛒  Add Milk to Cart          [+ Add]   │
└──────────────────────────────────────────┘
```

- **`add` actions**: Call `createCart` / `createTransaction` / `createStock` directly with pre-filled data
- **`remove` actions**: Look up by name in local state, call delete API
- **`update` actions**: Open the relevant edit modal pre-filled with the suggested data
- After success: card shows ✓ confirmation state (same pattern as existing CART_SUGGESTIONS cards)

---

## 4. API Contract Changes

### 4.1 Request (`POST /homedash/chat`)

```json
{
  "messages": [{"role": "user", "content": "..."}],
  "user_id": 9347330650,
  "available_groups": [
    {"group_id": "uuid-1", "group_name": "Flat 4B"},
    {"group_id": "uuid-2", "group_name": "Office"}
  ]
}
```

Removed: `context`, `group_id` (both inferred by the agent)

### 4.2 Response

```json
{
  "response": "Here's what you can cook tonight...",
  "cart_suggestions": ["Onions", "Tomatoes"],
  "action_suggestions": [
    {"type": "add", "entity": "cart", "label": "Add Onions", "data": {...}}
  ],
  "clarification": null
}
```

---

## 5. Frontend Changes (`HomieAgent.tsx`)

### 5.1 Removed
- `tab` state and `ChatContext` type
- `selectedGroupId` state
- Tab bar (`MyDash` | `MyHomeDash` buttons)
- Group selector `<select>` dropdown

### 5.2 Added / Changed
- Props: keep `userId` and `groups` (now used to build `available_groups` payload)
- Send `available_groups` in API payload instead of `context`/`group_id`
- `actionSuggestions` state: `ActionCard[]`
- New `ActionCard` component rendered below assistant bubbles
- Each card calls appropriate API function on button click

### 5.3 Chat UI Redesign

**Message bubbles:**
- User: right-aligned, `bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl rounded-br-lg px-4 py-3`
- Assistant: left-aligned, white card with subtle border + drop shadow, avatar dot beside it
- Timestamps: `text-[10px] text-slate-400` below each bubble
- Assistant label replaced by a small avatar icon (SmartToy) beside the bubble, not inside it

**Input area:**
- Full-width rounded pill input with subtle shadow
- Send button always visible, disables when empty or loading
- Placeholder rotates between helpful prompts via state (optional)
- Pressing Enter sends (already works)

**Empty state:**
- Replace plain text with a grid of 3–4 suggested prompt chips:
  - "What's in my stock?"
  - "Plan meals for this week"
  - "What did I spend this month?"
  - "Add groceries to cart"
- Clicking a chip fills and sends the input

**Loading:**
- Keep the three bouncing dots, but add the assistant avatar beside it to match the bubble layout

**Action cards:**
- Below assistant bubble, same width as bubble
- Per-entity color accent: blue (transaction), emerald (stock), amber (cart)
- Shows entity icon + label + action button
- Post-action: green ✓ "Done" state, card stays visible

---

## 6. File Structure for Implementation

```
server/
├── agent/
│   ├── __init__.py
│   ├── graph.py          # LangGraph StateGraph definition
│   ├── nodes.py          # All node functions (classify, fetch, generate, etc.)
│   ├── state.py          # AgentState TypedDict + Intent enum
│   └── prompts.py        # All LLM prompt templates
├── api/
│   └── chat_router.py    # Updated: calls agent/graph.py instead of anthropic_chat.py directly
└── docs/
    └── agent_flow.md     # This file
```

---

## 7. Dependencies to Add

```
langgraph>=0.2.0
langchain-anthropic>=0.1.0   # LangChain Anthropic wrapper (used by LangGraph)
```

Or, use LangGraph with the raw Anthropic SDK via a custom `ChatModel` wrapper — avoids adding LangChain if preferred.

---

## 8. Implementation Order

| Step | Task | File(s) |
|---|---|---|
| 1 | Define `AgentState` and Intent enum | `server/agent/state.py` |
| 2 | Write all prompt templates | `server/agent/prompts.py` |
| 3 | Implement each node function | `server/agent/nodes.py` |
| 4 | Wire the StateGraph | `server/agent/graph.py` |
| 5 | Update chat_router to call the graph | `server/api/chat_router.py` |
| 6 | Update API request/response models | `server/models/request_models.py` |
| 7 | Remove tab/group selector from HomieAgent | `client/src/components/HomieAgent.tsx` |
| 8 | Add action suggestion rendering | `client/src/components/HomieAgent.tsx` |
| 9 | Redesign chat UI | `client/src/components/HomieAgent.tsx` |
| 10 | Update `chatWithHomie` API call | `client/src/lib/moneyApi.ts` |

---

## 9. Edge Cases and Guard Rails

| Scenario | Behaviour |
|---|---|
| User has no groups | "group" queries → "You don't have any home groups yet. Create one in MyHomeDash." |
| User mentions group by name that doesn't exist | Treat as unclear, list their actual groups |
| Both personal and group intent in one message | Answer for both, clearly separated |
| Action suggested but user hasn't confirmed | Always show as a suggestion card — never auto-execute without the button press |
| `remove` action on item not found locally | Show card, clicking it searches by name server-side |
| Network error during action | Card shows ✕ error state with retry option |
| LLM returns malformed `ACTION_SUGGESTIONS` JSON | Catch parse error, render no cards (degrade gracefully) |
