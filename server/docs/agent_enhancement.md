# HomieAgent — Enhancement Options (Deferred)

Recorded here for future reference. These were deliberate architectural decisions during the initial LangGraph implementation. Revisit when ready to enhance.

---

## Q3 — Streaming vs Single JSON Response

**Current choice:** Single JSON response (user's answer: Option A — keep single JSON).

**Future enhancement — Option B (Streaming):**
- Use Server-Sent Events (SSE) or WebSocket to stream the LLM tokens to the client
- LangGraph supports streaming via `graph.astream()` or `graph.astream_events()`
- Client side: use `EventSource` or `fetch` with `ReadableStream` to render tokens progressively
- Benefit: better perceived latency, especially for longer `generate_response` calls
- Server change: switch endpoint to `StreamingResponse` with `text/event-stream` content type
- Client change: replace single `await chatWithHomie()` with an event stream consumer that updates the message in real time
- Complexity: action cards and cart suggestions still need to be emitted as a final event after generation

---

## Q4 — Stateful (Persisted) vs Stateless Agent

**Current choice:** Stateless — full message history re-sent each request, context re-inferred each turn.

**Future enhancement — Option B (Stateful with LangGraph Checkpointer):**
- Use `langgraph.checkpoint.sqlite.SqliteSaver` or `langgraph.checkpoint.postgres.PostgresSaver`
- Assign each chat session a `thread_id`; store agent state (inferred_context, group_id, fetched_data) across turns
- Benefit: avoids re-inferring context every turn; agent can say "I know you were asking about Flat 4B" without re-reading history
- Benefit: enables multi-step flows (e.g., "which item?" → user replies → agent auto-resolves)
- Server change: add `checkpointer` to `graph.compile(checkpointer=...)`, pass `thread_id` in config
- Client change: generate/persist `session_id` per chat session, send it in the API request
- DB consideration: use Supabase PostgreSQL as the checkpointer backend for serverless compatibility
- Complexity: checkpoint state contains DB sessions (non-serializable); must separate concerns — store only serializable fields in checkpoint, re-open DB per invocation

---

## Q5 — Action Suggestion Approach

**Current choice:** Option A — server embeds `ACTION_SUGGESTIONS:` JSON in the LLM response text, client parses and renders as cards.

**Future enhancement — Option B (Dedicated Tool Calls):**
- Define structured tools (`add_to_cart`, `log_transaction`, `remove_stock`, etc.) that the LLM can call via Anthropic tool use
- LangGraph `ToolNode` handles the tool invocation and loops back to the LLM
- Benefit: structured output, no regex parsing, LLM cannot hallucinate malformed JSON
- Benefit: agent can actually EXECUTE the action server-side (not just suggest) and confirm to the user
- Downside for current UX: if the agent executes directly, the "confirm before action" card pattern needs redesign
- Possible hybrid: define tools for read-only data fetches (replaces `fetch_data` node), keep suggestions as parsed text for write actions (user still confirms)
