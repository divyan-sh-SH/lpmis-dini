# Claude Changes

All modifications made by Claude are logged here, newest first.

---

## 2026-05-12 — Chat Page + HomePage Redesign

### Changes

**`client/src/pages/ChatPage.tsx`** (new):
- Dedicated full-page chat route at `/chat`
- Header with back button, HomieAgent avatar + title + subtitle
- Fetches groups for the current user, passes to `HomieAgent` with `fullPage` prop

**`client/src/App.tsx`**:
- Added `/chat` route pointing to `ChatPage`
- Changed routes wrapper div from `flex-1` to `flex flex-col flex-1` so ChatPage can fill the viewport height

**`client/src/components/HomieAgent.tsx`**:
- Added `fullPage?: boolean` prop (default `false`)
- In `fullPage` mode: no outer card border, no header (ChatPage provides it), messages area is `flex-1 min-h-0 overflow-y-auto`, component fills parent height via `flex flex-col flex-1 min-h-0`
- Added a compact "Clear chat" row when in `fullPage` mode and messages exist

**`client/src/pages/HomePage.tsx`** (rewritten):
- Removed `HomieAgent` component from the home page
- **Hero card**: gradient (indigo→blue→purple) with greeting, date, user initials avatar, net balance for current period with trend badge
- **Quick nav row**: 3 horizontally scrollable pill links — MyDash (blue), MyHomeDash (indigo), Journal (violet)
- **MyDash Overview**: improved section header with subtitle, stat cards now have gradient backgrounds with icon badges (TrendingUp, North arrow, South arrow), `hover:-translate-y-0.5` micro-animation on group cards
- **My HomeDash**: group initials avatars now cycle through 6 gradient colors by index, improved empty state with icon and CTA button
- **Floating Chat FAB**: fixed bottom-right `Link to="/chat"`, gradient indigo-purple, shadow glow, hover scale + shadow enhancement

---

## 2026-04-27 — HomieAgent LangGraph Agentic Upgrade

### Changes

**`server/agent/` (new folder):**
- `state.py` — `AgentState` TypedDict + `Intent` constants
- `prompts.py` — all LLM prompt templates: classify system, generate response template, general response system, action protocol
- `nodes.py` — all graph node functions: `classify_intent` (structured output via `ChatAnthropic.with_structured_output`), `resolve_context`, `fetch_data`, `generate_response`, `build_action_cards`, `ask_clarification`, `general_response`; DB session injected via `config["configurable"]["db"]`
- `graph.py` — LangGraph `StateGraph` wiring with conditional routing; exports `homie_graph`
- `__init__.py` — exports `homie_graph`

**`server/api/chat_router.py`** (rewritten):
- New request: `{messages, user_id, available_groups}` — removed `context` and `group_id` fields
- Calls `homie_graph.invoke()` with DB session in RunnableConfig
- New response: `{response, cart_suggestions, action_suggestions, clarification, inferred_context, inferred_group_id}`

**`server/docs/agent_enhancement.md`** (new):
- Deferred options for Q3 (streaming), Q4 (stateful checkpointing), Q5 (tool-call approach)

**`server/pyproject.toml`** and **`server/requirements.txt`**:
- Added `langgraph>=1.0.0`, `langchain-anthropic>=1.0.0`; bumped `anthropic` to `>=0.101.0`

**`client/src/types/dashboard.ts`**:
- Added `ActionSuggestion` and `AgentChatResponse` types; removed `ChatContext`

**`client/src/lib/moneyApi.ts`**:
- Updated `chatWithHomie(messages, user_id, available_groups)` — new signature, returns `AgentChatResponse`

**`client/src/components/HomieAgent.tsx`** (rewritten):
- Removed tab toggle (MyDash/MyHomeDash) and group `<select>` dropdown
- Agent infers context from natural language
- New chat UI: gradient header with avatar, left-aligned assistant bubbles with avatar, user bubbles in blue-indigo gradient, timestamps under each bubble
- Empty state: 4 suggested prompt chips ("What's in my stock?", "Plan meals for this week", etc.)
- Action suggestion cards rendered below assistant bubbles: per-entity color coding (blue=transaction, emerald=stock, amber=cart), idle/loading/done/error states
- Cart suggestion chips with amber accent
- Loading state includes avatar bubble matching design

**`server/CLAUDE.md`** and **`client/CLAUDE.md`**:
- Updated with new agent architecture, file structure, and API contract

---

## 2026-05-11 — Redesigned Add/Edit Modals (Transactions, Stocks, Cart)

### Changes

**`client/src/pages/PersonalPage.tsx`** and **`client/src/pages/GroupPage.tsx`**:

- **Polished modal design**: gradient accent bar at top (blue for transactions, emerald for stocks, amber for cart), icon + title header, X close button
- **Multi-entry support**: Add modals stay open after saving — form resets, "Added! Fill another or tap Done." banner appears for 2.5 s, user taps "Done" to close
- **Income/Expense toggle**: replaced `<select>` dropdown with two pill toggle buttons (emerald = income, rose = expense)
- **Cart modal**: Store and Cost fields side-by-side in one row to reduce scrolling
- **Mobile-first**: modal slides up from bottom on mobile (`items-end`), centers on desktop (`sm:items-center`)
- **Better inputs**: labels above fields (`uppercase tracking-wide text-xs`), cleaner `rounded-xl` inputs with focus ring

---

## 2026-04-27 — Replace all emoji icons with MUI icons

### Changes

**`client/src/components/HomieAgent.tsx`** (full rewrite):
- `SmartToyRoundedIcon` for AI avatar header
- `DeleteSweepRoundedIcon` for Clear chat button
- `ContentCopyRoundedIcon` / `CheckRoundedIcon` for copy/copied state
- `SendRoundedIcon` for Send button
- `AddShoppingCartRoundedIcon` / `CheckRoundedIcon` for cart suggestion buttons

**`client/src/components/JournalEditor.tsx`**:
- `MenuBookRoundedIcon` for journal list header and editor header
- `EditNoteRoundedIcon` for "New Entry" and "Write Today's Entry" buttons
- `EditRoundedIcon` / `DeleteRoundedIcon` for card action buttons
- `AutoFixHighRoundedIcon` for Rewrite button and rewrite panel header
- `LightbulbRoundedIcon` for AI Suggestion panel header
- `CloseRoundedIcon` for Cancel and Reject buttons in rewrite panel
- `CheckRoundedIcon` for Accept button in rewrite panel
- `CheckCircleRoundedIcon` for save status "Saved" indicator
- `ArrowBackRoundedIcon` for "All Journals" back button
- `SaveRoundedIcon` for Save Entry button

**`client/src/pages/PersonalPage.tsx`**:
- `SwapVertRoundedIcon`, `InventoryRoundedIcon`, `ShoppingCartRoundedIcon`, `MenuBookRoundedIcon` in tab bar

**`client/src/pages/GroupPage.tsx`**:
- Same 3 tab icons as PersonalPage (excluding Journal tab)

**`client/src/components/NavBar.tsx`**:
- `AccountCircleRoundedIcon` for user profile button
- `LogoutRoundedIcon` in logout confirmation dialog

**`client/src/pages/HomePage.tsx`** and **`client/src/pages/GroupsPage.tsx`**:
- `ChevronRightRoundedIcon` for group card arrows

**Package installed:** `@mui/icons-material @mui/material @emotion/react @emotion/styled`

---

## 2026-04-27 — Journal List View + Edit/Delete

### Changes

**`server/api/journal_router.py`:**
- Added `GET /journal/user/{user_id}` — returns all entries for a user sorted by date descending
- Added `DELETE /journal/{journal_id}` — deletes an entry (204 No Content)

**`client/src/lib/moneyApi.ts`:**
- Added `getJournalEntries(user_id)` and `deleteJournalEntry(journal_id)`

**`client/src/components/JournalEditor.tsx`** (full rewrite):
- **List view** (default): cards with colored date badge (today highlighted in indigo), weekday, word count, 2-line serif preview; edit ✏️ and delete 🗑️ buttons reveal on hover; inline delete confirmation ("Delete? [Yes, delete] [Cancel]") replaces card content — no modal needed
- **Editor view**: "← All Journals" back button; create mode shows a date picker (max=today), edit mode shows formatted date as header; same textarea/word-count/rewrite flow as before; saving refreshes the list on back
- **Smart "New Entry"**: if today's entry already exists, clicking "New Entry" opens it for editing instead of creating a duplicate
- **Empty state**: illustrated empty state with a direct "Write Today's Entry" CTA

---

## 2026-04-27 — Journal Feature + Tab Navigation

### Changes

**Server — new DB table & endpoints:**

| File | Change |
|---|---|
| `server/models/db_models.py` | Added `Journal` SQLAlchemy model (`homedash_journal`); includes PostgreSQL DDL comment; `UniqueConstraint(user_id, date)` — one entry per user per day |
| `server/models/request_models.py` | Added `JournalCreate`, `JournalResponse`, `JournalUpdate` Pydantic models |
| `server/api/journal_router.py` | **NEW** — `GET /journal/user/{user_id}/date/{date}`, `POST /journal`, `PUT /journal/{journal_id}`, `POST /journal/rewrite` (AI rewrite with dedicated system prompt) |
| `server/api/__init__.py` | Registered `journal_router` |

**Client — new component & tab navigation:**

| File | Change |
|---|---|
| `client/src/types/dashboard.ts` | Added `Journal`, `JournalCreate`, `JournalUpdate` types |
| `client/src/lib/moneyApi.ts` | Added `getJournalEntry`, `createJournalEntry`, `updateJournalEntry`, `rewriteJournal` API functions |
| `client/src/components/JournalEditor.tsx` | **NEW** — journal for today's date; serif textarea; 5000-word live counter (amber/red when near limit); "● Unsaved / ✓ Saved / Saving…" indicator; "✨ Rewrite" button → one-line prompt → AI suggestion preview → Accept (replaces content) / Reject; violet-indigo gradient theme |
| `client/src/pages/PersonalPage.tsx` | Replaced stacked sections with tab bar: `↕ Transactions`, `📦 Stocks`, `🛒 Cart`, `📓 Journal`; Journal tab shows `JournalEditor`; Add button is contextual to active tab |
| `client/src/pages/GroupPage.tsx` | Same tab bar but 3 tabs only (`Transactions`, `Stocks`, `Cart` — no Journal); single section panel replaces stacked layout |

---

## 2026-04-27 — HomieAgent: Scroll Fix, Markdown & Cart Suggestions

### Changes

**`client/src/components/HomieAgent.tsx`:**
- **Scroll fix**: replaced `scrollIntoView` (caused full-page scroll) with `containerRef.current.scrollTop = scrollHeight` — scrolls only the chat container
- **Markdown rendering**: added `renderMarkdown` + `renderInline` — supports `**bold**`, `- bullets`, `1. numbered lists`, `---` dividers, proper spacing
- **Cart suggestion cards**: assistant messages now show inline "+ Cart" action cards for items the AI suggests buying; tracks per-item added/adding state; calls `createCart` with defaults (cost=0, store='', description/quantity null) scoped to current tab (personal or group)
- **Loading indicator**: replaced "Thinking..." text with animated bouncing dots

**`server/api/chat_router.py`:**
- Updated system prompt to instruct Claude to append `CART_SUGGESTIONS:item1,item2,item3` at the end of responses when suggesting items not in stock; client parses and strips this line before display

---

## 2026-04-26 — Phase 5: Chart, Cleanup & Professional Groups

### Changes

**`server/models/request_models.py`:**
- Removed duplicate `StockUpdate` class that had `quantity: Optional[int] = Field(None, ge=0)` — Python was using this second definition, breaking stock quantity updates. The correct first definition with `quantity: Optional[str]` is now the only one.

**`client/src/components/LineChart.tsx`** (NEW):
- Pure SVG line chart (no external library), `viewBox="0 0 500 160"`, fully responsive
- Period toggle: "This Week" (Mon–today) / "This Month" (1st–today)
- Fills all days with zero for missing data; hover tooltip with date+amount; gradient area fill; Y-axis k/L formatting
- `onPeriodChange` callback for parent to sync stat cards

**`client/src/pages/HomePage.tsx`** (rewritten):
- Removed: tab bar (MyDash/MyHomeDash buttons), recent transactions list, stocks panel, cart panel, standalone 4 stat cards
- Added: "MyDash Overview" section — "Manage MyDash →" link (top right) + `LineChart` + 3 period-synced stat cards (Net Balance, Income, Expenses)
- Stats are computed from transactions filtered to the chart's active period (`week` or `month`)
- "My HomeDash List" groups section with letter-avatar cards replacing old plain cards

**`client/src/pages/GroupsPage.tsx`** (updated):
- Professional group cards: gradient letter-avatar (A–Z initials), member count, arrow on hover
- Subtitle updated to "My HomeDash List — manage your shared groups"

---

## 2026-04-26 — UI Polish & Naming Consistency

### Changes

**HomieAgent improvements (`client/src/components/HomieAgent.tsx`):**
- Moved to top of home screen (renders above stats/data)
- Dynamic height: message area starts at `min-h-[56px]` and grows naturally; capped at `max-h-[400px]` then scrolls — no fixed height
- Copy button on each AI response (appears on hover via `group-hover:opacity-100`; shows "Copied!" confirmation for 1.5 s)
- Clear chat button in the header (visible only when there are messages)

**Homepage tabs (`client/src/pages/HomePage.tsx`):**
- Replaced the two stat-count cards (showed transaction count, group count) with a clean pill-style tab bar: **MyDash** → `/personal`, **MyHomeDash** → `/groups`
- HomieAgent moved before the loading/data section so it's always visible

**Naming consistency — "MyDash" / "MyHomeDash" across all pages:**
- `NavBar.tsx`: "Me" → **MyDash**, "My Group" → **MyHomeDash**
- `PersonalPage.tsx` header: "My Dashboard" → **MyDash**
- `GroupsPage.tsx` header: "My Groups" → **MyHomeDash**
- `GroupPage.tsx` header: "Group Dashboard" → **MyHomeDash**
- `HomePage.tsx`: "Recent Transactions" view-all link → "MyDash →", Groups section → "MyHomeDash Groups"

---

## 2026-04-26 — Major Feature Release

### Features implemented
1. **HomieAgent AI chat** on the home screen
2. **Rich homepage dashboard** with financial overview
3. **Responsive tables/components** (no horizontal scroll on mobile)
4. **API response caching** (3-minute TTL, invalidated on mutations)
5. **Critical bug fix**: frontend types were wrong (used `id: number` but backend returns `transaction_id`, `stock_id`, `cart_id` as UUIDs; fixed throughout)
6. **GroupCreate bug fix**: frontend was sending `group_name` but backend expects `name`
7. **Stock quantity type fix**: backend stores as string, frontend was sending number

### Files changed — Server

| File | Change |
|---|---|
| `server/anthropic_chat.py` | Fixed model name (`claude-haiku-4-5-20251001`); added `system` param support |
| `server/api/chat_router.py` | **NEW** — `POST /homedash/chat` endpoint; fetches user/group stocks+cart for AI context |
| `server/api/__init__.py` | Registered `chat_router` |

### Files changed — Client

| File | Change |
|---|---|
| `client/src/lib/cache.ts` | **NEW** — In-memory TTL cache (3 min); `get`, `set`, `invalidate(pattern)` |
| `client/src/types/dashboard.ts` | Fixed all types to match backend: `transaction_id`, `stock_id`, `cart_id` (UUID strings); `CartItem` uses `stock_item`, `store_name`, `description`; `Group.group_id` is `string`; `GroupCreate` uses `name`; `Stock.quantity` is `string`; removed legacy `Summary` type; added `ChatMessage`, `ChatContext` |
| `client/src/lib/moneyApi.ts` | Added caching to all GET functions; mutations invalidate cache; fixed ID params to `string`; added `chatWithHomie()`; removed ~7 unused legacy functions |
| `client/src/components/Transactions.tsx` | Desktop table + mobile card layout; uses `transaction_id` |
| `client/src/components/Stocks.tsx` | Desktop table + mobile card layout; uses `stock_id` |
| `client/src/components/Carts.tsx` | Desktop table + mobile card layout; uses `cart_id`, `stock_item`, `store_name`, `description` |
| `client/src/components/HomieAgent.tsx` | **NEW** — AI chat UI; MyDash/MyHomeDash tabs; group selector; message thread |
| `client/src/pages/LoginPage.tsx` | Mobile-first layout (centered vertically, `max-w-sm`, removed conflicting CSS classes) |
| `client/src/pages/HomePage.tsx` | Full rewrite: greeting, 4 stat cards, quick nav, recent transactions, stocks+cart snapshot, groups list, HomieAgent |
| `client/src/pages/PersonalPage.tsx` | Fixed all field names to match backend; fixed edit/delete to use UUID IDs; stock quantity changed to text input |
| `client/src/pages/GroupPage.tsx` | Same fixes as PersonalPage (group context) |
| `client/src/pages/GroupsPage.tsx` | Fixed `GroupCreate` to use `name` (not `group_name`); improved UI with grid layout |

---

## 2026-04-26 — Initial Setup

### Added CLAUDE.md files and .claude folders
**Files created:**
- `CLAUDE.md` — root monorepo documentation
- `client/CLAUDE.md` — web frontend documentation
- `server/CLAUDE.md` — backend documentation
- `HomeDash/CLAUDE.md` — mobile app documentation
- `.claude/settings.json` — root permission allowlist
- `client/.claude/settings.json` — client permission allowlist
- `server/.claude/settings.json` — server permission allowlist
- `HomeDash/.claude/settings.json` — HomeDash permission allowlist
- `Claude-Changes.md` — this file

**Description:** Initialized project documentation for Claude Code. Each package has a CLAUDE.md with commands, structure, and key patterns. `.claude/settings.json` files pre-approve common dev commands to reduce permission prompts. Added rule to CLAUDE.md: no changes to `HomeDash/`, all changes logged here.
