import { useRef, useState } from 'react';
import type { Group, ChatMessage, ActionSuggestion } from '../types/dashboard';
import {
  chatWithHomie,
  createCart,
  createStock,
  createTransaction,
  deleteCart,
  deleteStock,
  deleteTransaction,
  updateCart,
  updateStock,
  updateTransaction,
} from '../lib/moneyApi';
import type { CartItemCreate, StockCreate, TransactionCreate } from '../types/dashboard';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

type CardStatus = 'idle' | 'loading' | 'done' | 'error';

type MessageWithMeta = ChatMessage & {
  cartSuggestions?: string[];
  actionSuggestions?: ActionSuggestion[];
  timestamp?: string;
};

type HomieAgentProps = {
  userId: number;
  groups: Group[];
  fullPage?: boolean;
};

const PROMPT_CHIPS = [
  "What's in my stock?",
  'Plan meals for this week',
  'What did I spend this month?',
  'Add groceries to cart',
];

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
        ),
      )}
    </>
  );
}

function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.trim() === '---')
          return <hr key={i} className="my-1 border-slate-200" />;
        if (/^[-•]\s/.test(line))
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              <span className="leading-relaxed">{renderInline(line.replace(/^[-•]\s/, ''))}</span>
            </div>
          );
        const numMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numMatch)
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 w-5 shrink-0 text-right font-bold text-indigo-500 text-xs">
                {numMatch[1]}.
              </span>
              <span className="leading-relaxed">{renderInline(numMatch[2])}</span>
            </div>
          );
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-sm leading-relaxed text-slate-700">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

// --- Entity color config ---

const entityConfig: Record<
  'transaction' | 'stock' | 'cart',
  { border: string; bg: string; btn: string; icon: React.ReactNode }
> = {
  transaction: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: <SwapVertRoundedIcon sx={{ fontSize: 15 }} className="text-blue-600" />,
  },
  stock: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon: <InventoryRoundedIcon sx={{ fontSize: 15 }} className="text-emerald-600" />,
  },
  cart: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
    icon: <ShoppingCartRoundedIcon sx={{ fontSize: 15 }} className="text-amber-500" />,
  },
};

// --- Action card ---

function ActionCard({
  card,
  onAction,
}: {
  card: ActionSuggestion;
  onAction: (card: ActionSuggestion) => Promise<void>;
}) {
  const [status, setStatus] = useState<CardStatus>('idle');
  const cfg = entityConfig[card.entity] ?? entityConfig.cart;

  const actionLabel =
    card.type === 'add' ? 'Add' : card.type === 'remove' ? 'Remove' : 'Update';

  async function handle() {
    if (status !== 'idle' && status !== 'error') return;
    setStatus('loading');
    try {
      await onAction(card);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm ${cfg.border} ${cfg.bg}`}
    >
      {cfg.icon}
      <span className="flex-1 text-xs font-medium text-slate-700 leading-tight">
        {card.label}
      </span>
      {status === 'done' ? (
        <span className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
          <CheckRoundedIcon sx={{ fontSize: 13 }} /> Done
        </span>
      ) : status === 'error' ? (
        <button
          onClick={handle}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold bg-rose-100 text-rose-600 hover:bg-rose-200"
        >
          <ErrorOutlineRoundedIcon sx={{ fontSize: 13 }} /> Retry
        </button>
      ) : (
        <button
          onClick={handle}
          disabled={status === 'loading'}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${cfg.btn}`}
        >
          {status === 'loading' ? '…' : actionLabel}
        </button>
      )}
    </div>
  );
}

// --- Main component ---

export default function HomieAgent({ userId, groups, fullPage = false }: HomieAgentProps) {
  const [messages, setMessages] = useState<MessageWithMeta[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    setTimeout(() => {
      if (containerRef.current)
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }, 50);
  }

  function now(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: MessageWithMeta = { role: 'user', content, timestamp: now() };
    const historyForApi: ChatMessage[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      userMsg,
    ];

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    const available_groups = groups.map((g) => ({
      group_id: g.group_id,
      group_name: g.group_name,
    }));

    try {
      const agentResp = await chatWithHomie(historyForApi, userId, available_groups);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: agentResp.response,
          cartSuggestions: agentResp.cart_suggestions,
          actionSuggestions: agentResp.action_suggestions,
          timestamp: now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: now(),
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  async function handleCartAdd(itemName: string) {
    setAddingItems((prev) => new Set(prev).add(itemName));
    try {
      await createCart({
        stock_item: itemName,
        cost: 0,
        store_name: '',
        user_id: userId,
      });
      setAddedItems((prev) => new Set(prev).add(itemName));
    } catch {
      // silently fail
    } finally {
      setAddingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemName);
        return next;
      });
    }
  }

  async function handleAction(card: ActionSuggestion): Promise<void> {
    const data = card.data as Record<string, unknown>;

    if (card.type === 'add') {
      if (card.entity === 'transaction') {
        await createTransaction(data as unknown as TransactionCreate);
      } else if (card.entity === 'stock') {
        await createStock(data as unknown as StockCreate);
      } else if (card.entity === 'cart') {
        await createCart(data as unknown as CartItemCreate);
      }
    } else if (card.type === 'remove') {
      if (card.entity === 'transaction' && data.transaction_id) {
        await deleteTransaction(data.transaction_id as string);
      } else if (card.entity === 'stock' && data.stock_id) {
        await deleteStock(data.stock_id as string);
      } else if (card.entity === 'cart' && data.cart_id) {
        await deleteCart(data.cart_id as string);
      }
    } else if (card.type === 'update') {
      if (card.entity === 'transaction' && data.transaction_id) {
        const { transaction_id, ...rest } = data;
        await updateTransaction(transaction_id as string, rest as Partial<TransactionCreate>);
      } else if (card.entity === 'stock' && data.stock_id) {
        const { stock_id, ...rest } = data;
        await updateStock(stock_id as string, rest as Partial<StockCreate>);
      } else if (card.entity === 'cart' && data.cart_id) {
        const { cart_id, ...rest } = data;
        await updateCart(cart_id as string, rest as Partial<CartItemCreate>);
      }
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
    setAddingItems(new Set());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isEmpty = messages.length === 0;

  const outerCls = fullPage
    ? 'flex flex-col flex-1 min-h-0 bg-white'
    : 'rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden';

  const messagesCls = fullPage
    ? 'flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4 bg-slate-50'
    : 'min-h-[80px] max-h-[420px] overflow-y-auto px-3 py-3 space-y-4 bg-slate-50';

  return (
    <section className={outerCls}>
      {/* Header — hidden in fullPage mode (ChatPage provides its own header) */}
      {!fullPage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <SmartToyRoundedIcon sx={{ fontSize: 16 }} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800">HomieAgent</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
              AI
            </span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear chat"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition"
            >
              <DeleteSweepRoundedIcon sx={{ fontSize: 16 }} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      )}

      {/* Clear button for fullPage mode */}
      {fullPage && messages.length > 0 && (
        <div className="flex justify-end px-4 py-2 border-b border-slate-100 shrink-0">
          <button
            onClick={clearChat}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition"
          >
            <DeleteSweepRoundedIcon sx={{ fontSize: 15 }} />
            Clear chat
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        className={messagesCls}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-slate-400 text-center">
              Ask me about meals, spending, or anything household-related!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-700 transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for assistant */}
              {msg.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 mt-0.5">
                  <SmartToyRoundedIcon sx={{ fontSize: 14 }} className="text-white" />
                </div>
              )}

              <div className="group max-w-[85%] flex flex-col gap-1.5">
                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 shadow-sm rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    renderMarkdown(msg.content)
                  )}
                </div>

                {/* Timestamp */}
                {msg.timestamp && (
                  <p
                    className={`text-[10px] text-slate-400 px-1 ${
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                )}

                {/* Action suggestion cards */}
                {msg.role === 'assistant' &&
                  msg.actionSuggestions &&
                  msg.actionSuggestions.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {msg.actionSuggestions.map((card, ci) => {
                        return (
                          <ActionCard
                            key={`action-${i}-${ci}`}
                            card={card}
                            onAction={handleAction}
                          />
                        );
                      })}
                    </div>
                  )}

                {/* Cart suggestion cards */}
                {msg.role === 'assistant' &&
                  msg.cartSuggestions &&
                  msg.cartSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.cartSuggestions.map((item) => {
                        const added = addedItems.has(item);
                        const adding = addingItems.has(item);
                        return (
                          <div
                            key={item}
                            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 shadow-sm"
                          >
                            <ShoppingCartRoundedIcon sx={{ fontSize: 13 }} className="text-amber-500" />
                            <span className="text-xs font-medium text-slate-700">{item}</span>
                            <button
                              onClick={() => handleCartAdd(item)}
                              disabled={added || adding}
                              className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold transition ${
                                added
                                  ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                  : adding
                                    ? 'bg-slate-100 text-slate-400 cursor-wait'
                                    : 'bg-amber-500 text-white hover:bg-amber-600'
                              }`}
                            >
                              {added ? (
                                <>
                                  <CheckRoundedIcon sx={{ fontSize: 11 }} /> Added
                                </>
                              ) : (
                                <>
                                  <AddShoppingCartRoundedIcon sx={{ fontSize: 11 }} />{' '}
                                  {adding ? '…' : 'Add'}
                                </>
                              )}
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
                    className="flex items-center gap-1 self-start text-xs text-slate-400 opacity-0 transition hover:text-slate-600 group-hover:opacity-100"
                  >
                    {copiedIdx === i ? (
                      <>
                        <CheckRoundedIcon sx={{ fontSize: 12 }} /> Copied!
                      </>
                    ) : (
                      <>
                        <ContentCopyRoundedIcon sx={{ fontSize: 12 }} /> Copy
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start gap-2 justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <SmartToyRoundedIcon sx={{ fontSize: 14 }} className="text-white" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm rounded-tl-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-2 border-t border-slate-100 px-3 py-3 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about meals, spending, or stocks…"
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white transition disabled:opacity-50"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="shrink-0 flex items-center justify-center rounded-full bg-indigo-600 w-9 h-9 text-white transition hover:bg-indigo-700 disabled:opacity-40"
        >
          <SendRoundedIcon sx={{ fontSize: 16 }} />
        </button>
      </div>
    </section>
  );
}
