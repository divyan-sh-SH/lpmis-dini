# Claude Changes

All modifications made by Claude are logged here, newest first.

---

## 2026-08-29 — Full Feature Implementation: Habit Tracker, Calendar, To-Do List

**Backend — new files:**
- `server/models/db_models.py` — Added `Habit`, `HabitLog`, `Todo`, `CalendarEvent` ORM models (4 new tables with dual-scope CHECK constraints, UPSERT-ready unique constraint on HabitLog)
- `server/models/request_models.py` — Added 12 new Pydantic schemas for all 4 entities (Create/Update/Response variants)
- `server/api/habit_router.py` — Habit CRUD + archive endpoints (personal + group scoped)
- `server/api/habit_log_router.py` — Habit log endpoints with PostgreSQL UPSERT (`ON CONFLICT DO UPDATE`)
- `server/api/todo_router.py` — Todo CRUD + toggle-complete endpoints
- `server/api/calendar_router.py` — Calendar event CRUD endpoints
- `server/api/__init__.py` — Registered all 4 new routers under `/homedash/`

**Backend — modified files:**
- `server/agent/state.py` — Added 5 new intent constants (`HABIT_QUERY`, `HABIT_LOG`, `TODO_ADD`, `TODO_QUERY`, `CALENDAR_ADD`)
- `server/agent/prompts/generate.py` — Added `CALENDAR_PROTOCOL` and `TODO_PROTOCOL` blocks
- `server/agent/prompts/__init__.py` — Exported new protocol constants
- `server/agent/nodes.py` — Extended `fetch_data` with habit/todo/calendar branches; added 4 format helpers; updated `generate_response` for multi-protocol output; rewrote `build_action_cards` to parse all 3 suggestion block types

**Frontend — new files:**
- `client/src/components/HabitFormModal.tsx` — Habit add/edit form (name, frequency grid, boolean/quantifiable toggle, target+unit)
- `client/src/components/HabitCheckInGrid.tsx` — Daily habit check-in cards with streak computation and quantifiable +/− controls
- `client/src/components/TodoFormModal.tsx` — Todo add/edit form (title, description, due date, priority)
- `client/src/components/AddEventModal.tsx` — Calendar event add/edit form
- `client/src/components/TodoList.tsx` — Todo list with filter tabs (All/Active/Done), priority chips, edit/delete/toggle
- `client/src/components/CalendarDateCard.tsx` — Single date card with events, habits grid, todos list
- `client/src/components/CalendarView.tsx` — Scrollable 37-day date range view, filters empty past dates, AddEventModal integration
- `client/src/pages/PersonalHabitsPage.tsx` — Personal daily habit check-in page
- `client/src/pages/GroupHabitsPage.tsx` — Group daily habit check-in page
- `client/src/pages/HabitConfigPage.tsx` — Shared habit management page (scope prop: personal/group)
- `client/src/pages/PersonalCalendarPage.tsx` — Personal unified calendar (events + habits + todos)
- `client/src/pages/GroupCalendarPage.tsx` — Group unified calendar
- `client/src/pages/PersonalTodosPage.tsx` — Personal to-do list page
- `client/src/pages/GroupTodosPage.tsx` — Group to-do list page

**Frontend — modified files:**
- `client/src/types/dashboard.ts` — Added 12 new types; extended `ActionSuggestion.entity` union
- `client/src/lib/moneyApi.ts` — Added ~220 lines: 24 new API wrappers with TTL cache for habits, habit logs, todos, calendar events
- `client/src/App.tsx` — Added 8 new protected routes (personal + group variants for habits, calendar, todos)
- `client/src/pages/PersonalPage.tsx` — Added Habits, Calendar, Todos navigation buttons
- `client/src/pages/GroupPage.tsx` — Added Habits, Calendar, Todos navigation buttons
- `client/src/components/HomieAgent.tsx` — Extended `entityConfig` and `handleAction` for `calendar`, `todo`, `habit` entities

---

## 2026-08-29 — Merged Technical Design + Release Plan into Single Document

**Files modified:**
- `Technical_Design.html` — Merged content from both `Technical_Design.html` and `Release_Plan.html` into one unified document. Removed `icon` and `color` fields from `homedash_habit` schema end-to-end (DB, types, components). Simplified Habit and To-Do sections. Added CALENDAR_PROTOCOL code block, manual + AI-assisted data flows, and existing system overview from Release_Plan.html. Now the single source of truth for the full feature plan.

**Files deleted:**
- `Release_Plan.html` — Removed after content was merged into `Technical_Design.html`.

---

## 2026-08-29 — Comprehensive Technical Design HTML (v3.0)

**Files created:**
- `Technical_Design.html` — Full technical design document covering all three new feature pillars: Calendar (unified view), Habit Tracker (dynamic), and To-Do List. Includes: database schemas for 4 new tables (homedash_habit, homedash_habit_log, homedash_todo, homedash_calendar with SQL), complete backend API routes for all 4 routers (including UPSERT pattern for habit logs), full frontend route table, all new/modified components with purpose, new TypeScript types, UI wireframes (config screen, daily check-in, unified calendar card view, to-do list), LangGraph agent enhancements (6 new intents, 3 new protocol blocks), client-side date-merge strategy for calendar, and 4-phase implementation plan with full file change summary (26 frontend files, 12 backend files).

---

## 2026-08-29 — Calendar Feature Release Plan HTML

**Files created:**
- `Release_Plan.html` — Self-contained visual release plan for the Calendar + AI Scheduling feature (v2.0). Covers: new features breakdown, full route table, frontend component list, new DB model (`homedash_calendar`), API routes, LangGraph agent enhancements (`CALENDAR_PROTOCOL`, `fetch_data` extension, `build_action_cards` parsing), UI wireframes (scrollable cards + AI action cards in chat), end-to-end data flows, and 4-phase implementation order.

---

## 2026-08-29 — Technical Architecture Document

**Files created:**
- `Architecture.md` — Technical architecture document covering frontend (React + Vite) and backend (FastAPI + LangGraph), including routing, API layer, database models, LangGraph agent graph flow, and end-to-end data flow diagrams.

---

## 2026-05-14 — Stock ORM Fix + Partial Load on API Failure

### Changes

**`server/models/db_models.py`** (updated):
- Removed the `Column("description", ...)` alias; `Stock.category` now maps directly to the `category` column (migration was applied)

**`client/src/pages/PersonalPage.tsx`** (updated):
- `fetchData` switched from `Promise.all` to `Promise.allSettled` — each of transactions, stocks, and cart loads independently; if one fails the others still render; error message lists only the failed endpoints (e.g. "Failed to load: stocks")

**`client/src/pages/GroupPage.tsx`** (updated):
- Same `Promise.allSettled` fix as PersonalPage

---

## 2026-05-14 — Stock Category Field + Category Accordion

### Changes

**`server/models/db_models.py`** (updated):
- `Stock.description` renamed to `Stock.category`; mapped to the existing DB column `"description"` via `Column("description", ...)` — no migration required to run immediately
- DB migration to rename the column: `ALTER TABLE homedash_stock RENAME COLUMN description TO category;` (run when convenient, then remove the column name alias)

**`server/models/request_models.py`** (updated):
- `StockCreate`, `StockResponse`, `StockUpdate`: `description` → `category` field

**`server/api/stock_router.py`** (updated):
- `create_stock`: passes `category=stock_data.category` instead of `description`

**`server/agent/nodes.py`** (updated):
- `_format_stocks`: includes `category` field in formatted dict
- `stock_block` in `generate_response`: appends `[category]` after item/quantity when present

**`client/src/types/dashboard.ts`** (updated):
- `Stock.description` → `Stock.category`
- `StockCreate.description` → `StockCreate.category`

**`client/src/components/Stocks.tsx`** (rewritten):
- Groups stocks by `category`; items with no category fall into "Other" (sorted last)
- Category accordion: all categories open by default; track `closedCategories` set
- Per-category color coding (8-color palette, stable per category name)
- Desktop table + mobile cards preserved inside accordion body

**`client/src/pages/PersonalPage.tsx`** (updated):
- `emptyStock`: added `category: ''`
- `openEditStock`: populates `category` from existing stock
- Add Stock modal: Quantity + Category in a 2-column row; Category is optional
- Edit Stock modal: same 2-column Quantity + Category layout

**`client/src/pages/GroupPage.tsx`** (updated):
- Same changes as PersonalPage for stock modals

---

## 2026-05-14 — Icons, NavBar Profile, Transactions Accordion, Notes Redesign, Agent Date Context

### Changes

**`client/src/components/icons/MyDashIcon.tsx`** (new):
- Custom SVG icon — credit card with chip + upward trend arrow representing personal finance dashboard

**`client/src/components/icons/MyHomeDashIcon.tsx`** (new):
- Custom SVG icon — house outline with two people silhouettes representing shared household management

**`client/src/components/NavBar.tsx`** (updated):
- Added `MyDashIcon` and `MyHomeDashIcon` beside "My Dash" / "My HomeDash" nav links
- Click-outside close for profile dropdown via `useRef<HTMLDivElement>` + `useEffect` + `mousedown` listener
- Added `showProfile` state and profile modal: gradient header with initials avatar, username, phone number formatted from `user_id`
- Added `user` from `useAuth()` to support profile display

**`client/src/pages/HomePage.tsx`** (updated):
- Quick nav now uses `MyDashIcon` and `MyHomeDashIcon` instead of MUI generic icons
- Updated labels to "My Dash" / "My HomeDash"
- Removed `SwapVertRoundedIcon` import

**`client/src/components/Transactions.tsx`** (rewritten):
- Transactions grouped by month (YYYY-MM key), sorted latest-to-oldest within each group
- Month accordion with per-month income / expense / net summary in header
- `useState<Set<string>>` for open/closed months; current month open by default
- Both desktop table and mobile card views preserved inside accordion body

**`client/src/components/NotesEditor.tsx`** (updated):
- Added `onViewChange?: (v: 'list' | 'editor') => void` prop — fires on openCreate, openEdit, goBack
- Redesigned list cards: left accent border (indigo for today, slate for others) replacing bulky date badge box; date shown inline as text; hover action bar at bottom of card
- Simplified empty state and loading spinner
- Redesigned editor: removed card wrapper; full-width textarea with cleaner toolbar; gradient divider line above textarea
- Removed `NoteAltRoundedIcon` date badge, `formatDateBadge` helper (no longer needed)

**`client/src/pages/PersonalNotesPage.tsx`** (updated):
- Added `isEditing` state driven by `onViewChange`; gradient hero banner and back link only visible in list view
- Hero: violet-to-blue gradient with username and icon
- In editor view: NotesEditor's own "← All Notes" button is the sole navigation control

**`client/src/pages/GroupNotesPage.tsx`** (updated):
- Same view-aware pattern as PersonalNotesPage
- Hero shows group initials in avatar + group name + icon
- Back link points to `/groups/:groupId` only when in list view

**`server/agent/nodes.py`** (updated):
- Injected `today = datetime.utcnow().strftime("%A, %d %B %Y")` as a `"Today's date: ..."` prefix into `generate_response`, `general_response`, and `greeting_node` system prompts so the LLM always knows the current date

---

## 2026-05-14 — Notes Dedicated Pages + Header Buttons

### Changes

**`client/src/pages/PersonalNotesPage.tsx`** (new):
- Route `/personal/notes` — full-page personal notes
- Page header: "[UserName]'s Notes" with violet icon + back link to MyDash
- Renders `<NotesEditor userId={...} hideTitle />` (list → editor flow unchanged)

**`client/src/pages/GroupNotesPage.tsx`** (new):
- Route `/groups/:groupId/notes` — full-page group notes
- Fetches group list via `getGroupsForUser` to resolve the group name; shows not-found state if invalid groupId
- Page header: "[GroupName]'s Notes" with violet icon + back link to group page
- Renders `<NotesEditor groupId={...} hideTitle />`

**`client/src/App.tsx`**:
- Added routes `/personal/notes` → `PersonalNotesPage` and `/groups/:groupId/notes` → `GroupNotesPage`

**`client/src/components/NotesEditor.tsx`**:
- Added optional `hideTitle?: boolean` prop — when true, replaces the "My Notes"/"Group Notes" h2 with a compact note count so the page title isn't duplicated

**`client/src/pages/PersonalPage.tsx`**:
- Header changed: shows `user.username` instead of "MyDash" + violet "Notes" button linking to `/personal/notes`
- Removed "Notes" tab from TABS (notes now lives on its own dedicated route)
- Removed `NotesEditor` import and `notes: ''` from addLabel

**`client/src/pages/GroupPage.tsx`**:
- Added `useAuth` + `getGroupsForUser` to resolve and display the group name in the header
- Header changed: shows group name + violet "Notes" button linking to `/groups/:groupId/notes`
- Removed "Notes" tab from TABS, removed `NotesEditor` import
- Tab bar styling simplified (no more violet gradient special-case for notes tab)

---

## 2026-05-14 — NotesEditor: Rewrite Panel Moved Above Textarea

### Changes

**`client/src/components/NotesEditor.tsx`**:
- AI Rewrite panel now renders between the header row (Save/Rewrite buttons) and the textarea, instead of below it — user sees the instruction input and AI suggestion without scrolling

---

## 2026-05-14 — HomieAgent: Greeting Node, TODO Extraction, Clarification Fix, Prompts Refactor

### Changes

**`server/agent/prompts/`** (new directory, replaces `prompts.py`):
- `classify.py` — CLASSIFY_SYSTEM with hard resolution rules: "MyDash"=personal always, clarification follow-up detection, greeting intent, extract_todos intent, "note" entity
- `generate.py` — GENERATE_SYSTEM_TEMPLATE (adds `{notes_block}` slot + TODO extraction instructions), ACTION_PROTOCOL unchanged
- `general.py` — GENERAL_RESPONSE_SYSTEM (unchanged content, isolated file)
- `greeting.py` — GREETING_SYSTEM (new): prompt for friendly greeting + capability intro
- `__init__.py` — re-exports all constants for backward-compatible import

**`server/agent/state.py`**:
- Added `"greeting"` and `"extract_todos"` to Intent constants
- Added `"note"` as valid entity value in docstring

**`server/agent/nodes.py`**:
- Added `_try_resolve_clarification()` helper: if last assistant message was asking "personal or group?" and user's reply unambiguously matches (e.g. "MyDash", "mine", or a group name), returns resolved classification without LLM — fixes the clarification loop
- `classify_intent`: calls shortcut first; passes last 6 messages instead of 5; classifier now includes `inferred_group_id` in its structured output schema
- `resolve_context`: early return if `inferred_group_id` already set (avoids overwriting classifier-resolved group)
- `fetch_data`: notes-aware — when `entity=="note"` or `intent=="extract_todos"`, fetches from `homedash_notes` (personal or group); otherwise skips notes to keep context lean
- `generate_response`: adds `notes_block` to system prompt
- Added `greeting_node`: lightweight LLM call using GREETING_SYSTEM; falls back to static message on error

**`server/agent/graph.py`**:
- Added `greeting_node` to the graph
- `_route_after_classify`: routes `intent=="greeting"` → `greeting_node` → END

---

## 2026-05-12 — Notes Feature (Backend + Frontend)

### Changes

**`server/models/db_models.py`**:
- Replaced `Journal` model with `Note` model pointing to `homedash_notes` table
- `note_id` (UUID PK), `user_id` (nullable FK), `group_id` (nullable UUID FK → `homedash_group`), `date`, `content` (Text nullable), `created_at`, `updated_at`
- CheckConstraint: exactly one of `user_id` or `group_id` must be non-null

**`server/models/request_models.py`**:
- Added `NoteCreate`, `NoteResponse`, `NoteUpdate` Pydantic models (removed `JournalCreate/Response/Update`)

**`server/api/notes_router.py`** (new, replaces `journal_router.py`):
- Prefix `/notes`; endpoints: GET /user/{id}, GET /user/{id}/date/{date}, GET /group/{id}, GET /group/{id}/date/{date}, POST, PUT /{note_id}, DELETE /{note_id}, POST /rewrite (AI rewrite via Claude)

**`server/api/__init__.py`**:
- Replaced `journal_router` import with `notes_router`

**`client/src/types/dashboard.ts`**:
- Replaced `Journal/JournalCreate/JournalUpdate` with `Note/NoteCreate/NoteUpdate`; `note_id`, nullable `user_id`/`group_id`

**`client/src/lib/moneyApi.ts`**:
- All journal API functions replaced with note equivalents (`getUserNotes`, `getGroupNotes`, `createNote`, `updateNote`, `deleteNote`, `rewriteNote`)
- Endpoints: `/notes/*`; cache keys: `notes:user:{id}` / `notes:group:{id}`

**`client/src/components/NotesEditor.tsx`** (new, replaces `JournalEditor.tsx`):
- Discriminated union props: `{ userId: number }` or `{ groupId: string }`
- Handles both personal (user_id set, group_id null) and group (group_id set, user_id null) notes
- List view + editor view with AI rewrite; group-specific placeholder/header text

**`client/src/components/JournalEditor.tsx`** (deleted):
- Removed; fully replaced by `NotesEditor.tsx`

**`client/src/pages/PersonalPage.tsx`**:
- Tab `'journal'` → `'notes'`, label "Journal" → "Notes", icon `MenuBookRoundedIcon` → `NoteAltRoundedIcon`
- Renders `<NotesEditor userId={user.user_id} />` for notes tab

**`client/src/pages/GroupPage.tsx`**:
- Added `'notes'` to `GroupTab` type; added Notes tab with `NoteAltRoundedIcon`
- Notes tab renders `<NotesEditor groupId={groupId} />` outside the section card (manages its own layout)
- Notes tab gets violet gradient active state matching PersonalPage

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
