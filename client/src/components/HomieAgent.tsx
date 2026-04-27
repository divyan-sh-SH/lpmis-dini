import { useRef, useState } from 'react';
import type { Group, ChatMessage, ChatContext } from '../types/dashboard';
import { chatWithHomie, createCart } from '../lib/moneyApi';

type MessageWithSuggestions = ChatMessage & { cartSuggestions?: string[] };

type HomieAgentProps = {
  userId: number;
  groups: Group[];
};

// --- Markdown renderer ---

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.trim() === '---') {
          return <hr key={i} className="my-1 border-slate-200" />;
        }
        if (/^[-•]\s/.test(line)) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              <span className="leading-relaxed">{renderInline(line.replace(/^[-•]\s/, ''))}</span>
            </div>
          );
        }
        const numMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 w-5 shrink-0 text-right font-bold text-indigo-500 text-xs">
                {numMatch[1]}.
              </span>
              <span className="leading-relaxed">{renderInline(numMatch[2])}</span>
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-slate-700">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

// --- Cart suggestion parser ---

function parseResponse(raw: string): { text: string; suggestions: string[] } {
  const match = raw.match(/\nCART_SUGGESTIONS:([^\n]+)$/);
  if (match) {
    const suggestions = match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return { text: raw.slice(0, match.index!).trim(), suggestions };
  }
  return { text: raw.trim(), suggestions: [] };
}

// --- Component ---

export default function HomieAgent({ userId, groups }: HomieAgentProps) {
  const [tab, setTab] = useState<ChatContext>('personal');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [messages, setMessages] = useState<MessageWithSuggestions[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 50);
  };

  const isSendDisabled =
    loading || !input.trim() || (tab === 'group' && groups.length > 0 && !selectedGroupId);

  async function sendMessage() {
    if (isSendDisabled) return;
    const userMessage: MessageWithSuggestions = { role: 'user', content: input.trim() };
    const historyForApi: ChatMessage[] = [...messages.map((m) => ({ role: m.role, content: m.content })), userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    scrollToBottom();
    try {
      const raw = await chatWithHomie(
        historyForApi,
        tab,
        userId,
        tab === 'group' ? selectedGroupId || undefined : undefined,
      );
      const { text, suggestions } = parseResponse(raw);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: text, cartSuggestions: suggestions },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  async function handleAddToCart(itemName: string) {
    setAddingItems((prev) => new Set(prev).add(itemName));
    try {
      await createCart({
        stock_item: itemName,
        cost: 0,
        store_name: '',
        description: undefined,
        quantity: undefined,
        user_id: tab === 'personal' ? userId : undefined,
        group_id: tab === 'group' && selectedGroupId ? selectedGroupId : undefined,
      });
      setAddedItems((prev) => new Set(prev).add(itemName));
    } catch {
      // silently fail — user can try again
    } finally {
      setAddingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemName);
        return next;
      });
    }
  }

  async function copyMessage(content: string, idx: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      // clipboard not available
    }
  }

  function clearChat() {
    setMessages([]);
    setInput('');
    setAddedItems(new Set());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-bold text-white">
            H
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">HomieAgent</h2>
            <p className="text-xs text-slate-500">Your AI household assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="shrink-0 text-xs text-slate-400 hover:text-rose-500 transition">
            Clear chat
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
        {(['personal', 'group'] as ChatContext[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
              tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'personal' ? 'MyDash' : 'MyHomeDash'}
          </button>
        ))}
      </div>

      {/* Group selector */}
      {tab === 'group' && (
        <div className="mb-4">
          {groups.length === 0 ? (
            <p className="py-2 text-center text-sm text-slate-500">You have no groups yet.</p>
          ) : (
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 transition"
            >
              <option value="">Select a group...</option>
              {groups.map((g) => (
                <option key={g.group_id} value={g.group_id}>
                  {g.group_name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        className="mb-4 min-h-[56px] max-h-[400px] overflow-y-auto rounded-2xl bg-slate-50 p-3 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex min-h-[40px] items-center justify-center px-4 text-center text-sm text-slate-400">
            Ask me about meals, shopping, or anything household-related!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="group max-w-[88%]">
                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white text-sm'
                      : 'bg-white border border-slate-200 shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <p className="mb-2 text-xs font-semibold text-indigo-500">HomieAgent</p>
                  )}
                  {msg.role === 'user' ? (
                    <p className="leading-relaxed text-sm">{msg.content}</p>
                  ) : (
                    renderMarkdown(msg.content)
                  )}
                </div>

                {/* Cart suggestion cards */}
                {msg.role === 'assistant' && msg.cartSuggestions && msg.cartSuggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.cartSuggestions.map((item) => {
                      const added = addedItems.has(item);
                      const adding = addingItems.has(item);
                      return (
                        <div
                          key={item}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                        >
                          <span className="text-xs font-medium text-slate-700">{item}</span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={added || adding}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                              added
                                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                : adding
                                ? 'bg-slate-100 text-slate-400 cursor-wait'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {added ? '✓ Added' : adding ? 'Adding…' : '+ Cart'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Copy button */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyMessage(msg.content, i)}
                    className="mt-1 text-xs text-slate-400 opacity-0 transition hover:text-slate-600 group-hover:opacity-100"
                  >
                    {copiedIdx === i ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about meals, stocks, or anything..."
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition disabled:opacity-50"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={isSendDisabled}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </section>
  );
}
