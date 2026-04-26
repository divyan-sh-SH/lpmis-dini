# Claude Changes

All modifications made by Claude are logged here, newest first.

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
