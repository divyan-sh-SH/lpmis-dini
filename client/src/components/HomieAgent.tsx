import { useRef, useState } from 'react';
import type { Group, ChatMessage, ChatContext } from '../types/dashboard';
import { chatWithHomie } from '../lib/moneyApi';

type HomieAgentProps = {
  userId: number;
  groups: Group[];
};

export default function HomieAgent({ userId, groups }: HomieAgentProps) {
  const [tab, setTab] = useState<ChatContext>('personal');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const isSendDisabled =
    loading ||
    !input.trim() ||
    (tab === 'group' && groups.length > 0 && !selectedGroupId);

  async function sendMessage() {
    if (isSendDisabled) return;
    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    scrollToBottom();
    try {
      const response = await chatWithHomie(
        updatedMessages,
        tab,
        userId,
        tab === 'group' ? selectedGroupId || undefined : undefined,
      );
      setMessages([...updatedMessages, { role: 'assistant', content: response }]);
    } catch {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
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
          <button
            onClick={clearChat}
            className="shrink-0 text-xs text-slate-400 hover:text-rose-500 transition"
          >
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
                <option key={g.group_id} value={g.group_id}>{g.group_name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Messages — starts compact, grows to max-h then scrolls */}
      <div className="mb-4 min-h-[56px] max-h-[400px] overflow-y-auto rounded-2xl bg-slate-50 p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex min-h-[40px] items-center justify-center px-4 text-center text-sm text-slate-400">
            Ask me about meals, shopping, or anything household-related!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="group max-w-[85%]">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <p className="mb-1 text-xs font-semibold text-indigo-600">HomieAgent</p>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
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
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
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
