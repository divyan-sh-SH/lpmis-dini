import { useCallback, useEffect, useRef, useState } from 'react';
import type { Journal } from '../types/dashboard';
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  rewriteJournal,
} from '../lib/moneyApi';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

// ─── Helpers ────────────────────────────────────────────────────────────────

const WORD_LIMIT = 5000;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatDateBadge(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    year: d.getFullYear(),
    weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }),
  };
}

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';
type EditorTarget = { mode: 'create'; date: string } | { mode: 'edit'; entry: Journal };

// ─── Main component ──────────────────────────────────────────────────────────

export default function JournalEditor({ userId }: { userId: number }) {
  const [view, setView] = useState<'list' | 'editor'>('list');

  // List state
  const [journals, setJournals] = useState<Journal[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Editor state
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [editorDate, setEditorDate] = useState(todayStr());
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [journalId, setJournalId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Rewrite state
  const [showRewritePrompt, setShowRewritePrompt] = useState(false);
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const promptRef = useRef<HTMLInputElement>(null);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const entries = await getJournalEntries(userId);
      setJournals(entries);
    } catch {
      setListError('Failed to load journals. Please try again.');
    } finally {
      setListLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadList(); }, [loadList]);

  // ── List → Editor ──────────────────────────────────────────────────────────

  function openCreate() {
    const today = todayStr();
    setEditorTarget({ mode: 'create', date: today });
    setEditorDate(today);
    setContent('');
    setSavedContent('');
    setJournalId(null);
    setSaveStatus('idle');
    setSaveError(null);
    closeRewrite();
    setView('editor');
  }

  function openEdit(entry: Journal) {
    setEditorTarget({ mode: 'edit', entry });
    setEditorDate(entry.date);
    const c = entry.content ?? '';
    setContent(c);
    setSavedContent(c);
    setJournalId(entry.journal_id);
    setSaveStatus('idle');
    setSaveError(null);
    closeRewrite();
    setView('editor');
  }

  function goBack() {
    setView('list');
    loadList();
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (view !== 'editor') return;
    setSaveStatus(content !== savedContent ? 'unsaved' : 'idle');
  }, [content, savedContent, view]);

  async function handleSave() {
    if (countWords(content) > WORD_LIMIT) return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      if (journalId) {
        const updated = await updateJournalEntry(journalId, { content });
        setSavedContent(updated.content ?? '');
      } else {
        const existingForDate = journals.find((j) => j.date === editorDate);
        if (existingForDate) {
          const updated = await updateJournalEntry(existingForDate.journal_id, { content });
          setJournalId(existingForDate.journal_id);
          setSavedContent(updated.content ?? '');
          setEditorTarget({ mode: 'edit', entry: { ...existingForDate, content: updated.content ?? '' } });
        } else {
          const created = await createJournalEntry({ user_id: userId, date: editorDate, content });
          setJournalId(created.journal_id);
          setSavedContent(created.content ?? '');
          setEditorTarget({ mode: 'edit', entry: created });
        }
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (e: unknown) {
      setSaveStatus('error');
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function confirmDelete(id: string) {
    setDeleting(true);
    try {
      await deleteJournalEntry(id);
      setDeletingId(null);
      setJournals((prev) => prev.filter((j) => j.journal_id !== id));
    } catch {
      setListError('Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  // ── Rewrite ────────────────────────────────────────────────────────────────

  function closeRewrite() {
    setShowRewritePrompt(false);
    setSuggestion(null);
    setRewriteError(null);
    setRewritePrompt('');
  }

  function openRewrite() {
    setSuggestion(null);
    setRewriteError(null);
    setRewritePrompt('');
    setShowRewritePrompt(true);
    setTimeout(() => promptRef.current?.focus(), 50);
  }

  async function handleRewrite() {
    if (!rewritePrompt.trim() || !content.trim()) return;
    setRewriting(true);
    setSuggestion(null);
    setRewriteError(null);
    try {
      const result = await rewriteJournal(content, rewritePrompt.trim());
      setSuggestion(result);
    } catch {
      setRewriteError('AI rewrite failed. Please try again.');
    } finally {
      setRewriting(false);
    }
  }

  function acceptSuggestion() {
    if (!suggestion) return;
    setContent(suggestion);
    closeRewrite();
  }

  // ── Render: List ───────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MenuBookRoundedIcon sx={{ fontSize: 22 }} className="text-indigo-500" /> My Journals
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {journals.length} {journals.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-indigo-700"
          >
            <EditNoteRoundedIcon sx={{ fontSize: 18 }} /> New Entry
          </button>
        </div>

        {listError && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{listError}</div>
        )}

        {listLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
            <p className="text-sm text-slate-400">Loading your journals…</p>
          </div>
        ) : journals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-indigo-200 bg-gradient-to-br from-violet-50 to-indigo-50 py-16 text-center">
            <div className="mb-3 text-indigo-300">
              <MenuBookRoundedIcon sx={{ fontSize: 48 }} />
            </div>
            <p className="font-semibold text-slate-700">No journal entries yet</p>
            <p className="mt-1 text-sm text-slate-400">Start writing your first entry today.</p>
            <button
              onClick={openCreate}
              className="mt-5 flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-indigo-700"
            >
              <EditNoteRoundedIcon sx={{ fontSize: 18 }} /> Write Today's Entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {journals.map((entry) => {
              const badge = formatDateBadge(entry.date);
              const words = countWords(entry.content ?? '');
              const preview = (entry.content ?? '').slice(0, 140).trim();
              const isDeleting = deletingId === entry.journal_id;
              const isToday = entry.date === todayStr();

              return (
                <div
                  key={entry.journal_id}
                  className={`group relative flex gap-4 rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                    isDeleting
                      ? 'border-red-200 bg-red-50'
                      : isToday
                      ? 'border-indigo-200 hover:border-indigo-300'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Date badge */}
                  <div
                    className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl py-3 text-center ${
                      isToday ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {badge.month}
                    </span>
                    <span className="text-2xl font-extrabold leading-none">{badge.day}</span>
                    <span className="text-[10px] opacity-60">{badge.year}</span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">{badge.weekday}</span>
                      {isToday && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                          Today
                        </span>
                      )}
                      <span className="ml-auto text-xs text-slate-400">{words.toLocaleString()} words</span>
                    </div>

                    {isDeleting ? (
                      <div className="flex items-center gap-3 py-1">
                        <p className="text-sm font-medium text-red-600">Delete this entry?</p>
                        <button
                          onClick={() => confirmDelete(entry.journal_id)}
                          disabled={deleting}
                          className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                        >
                          {deleting ? 'Deleting…' : 'Yes, delete'}
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p
                        className="line-clamp-2 text-sm leading-relaxed text-slate-600"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        {preview || (
                          <span className="italic text-slate-300">No content written yet.</span>
                        )}
                        {(entry.content ?? '').length > 140 && '…'}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!isDeleting && (
                    <div className="flex shrink-0 flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEdit(entry)}
                        title="Edit"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-indigo-100 hover:text-indigo-600"
                      >
                        <EditRoundedIcon sx={{ fontSize: 16 }} />
                      </button>
                      <button
                        onClick={() => setDeletingId(entry.journal_id)}
                        title="Delete"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-red-100 hover:text-red-500"
                      >
                        <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Render: Editor ─────────────────────────────────────────────────────────

  const wordCount = countWords(content);
  const overLimit = wordCount > WORD_LIMIT;
  const isCreateMode = editorTarget?.mode === 'create';

  const wordCountColor =
    wordCount > WORD_LIMIT ? 'text-red-500' :
    wordCount > WORD_LIMIT * 0.9 ? 'text-orange-500' :
    'text-slate-400';

  const saveStatusEl = () => {
    if (saveStatus === 'saving') return <span className="text-sm text-indigo-500 animate-pulse">Saving…</span>;
    if (saveStatus === 'saved') return <span className="flex items-center gap-1 text-sm font-medium text-emerald-600"><CheckCircleRoundedIcon sx={{ fontSize: 15 }} /> Saved</span>;
    if (saveStatus === 'unsaved') return <span className="text-sm font-medium text-amber-500">● Unsaved</span>;
    if (saveStatus === 'error') return <span className="text-sm text-red-500">Save failed</span>;
    return null;
  };

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={goBack}
        className="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-700"
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 20 }} /> All Journals
      </button>

      <div className="rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-400 via-indigo-400 to-sky-400" />

        <div className="p-3">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                {isCreateMode ? 'New Journal Entry' : 'Edit Journal Entry'}
              </h2>

              {isCreateMode ? (
                <div className="flex items-center gap-2 mt-1">
                  <label className="text-xs font-medium text-slate-400">Date:</label>
                  <input
                    type="date"
                    value={editorDate}
                    max={todayStr()}
                    onChange={(e) => setEditorDate(e.target.value)}
                    className="rounded-lg border border-indigo-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none focus:border-indigo-400"
                  />
                </div>
              ) : (
                <p className="text-xs text-indigo-400 font-medium mt-0.5">{formatDateFull(editorDate)}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleSave}
                disabled={overLimit || saveStatus === 'saving' || saveStatus === 'idle' || saveStatus === 'saved'}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={openRewrite}
                disabled={!content.trim() || showRewritePrompt}
                className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Rewrite
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`How was your day? What's on your mind?\n\nWrite freely — this is your space…`}
            rows={18}
            className="w-full resize-none rounded-xl border border-indigo-100 bg-white px-4 py-3 text-lg leading-8 text-slate-700 placeholder-slate-300 shadow-inner outline-none transition focus:border-indigo-300 focus:shadow-md"
            style={{ fontFamily: 'Georgia, serif' }}
          />

          {/* Footer — word count only */}
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className={`text-sm font-medium ${wordCountColor}`}>
              {wordCount.toLocaleString()} / {WORD_LIMIT.toLocaleString()} words
            </span>
            {saveStatusEl()}
          </div>

          {overLimit && (
            <p className="mt-1 text-sm text-red-500">
              Over the {WORD_LIMIT.toLocaleString()}-word limit. Please shorten your entry.
            </p>
          )}
          {saveError && (
            <p className="mt-1 text-sm text-red-500">{saveError}</p>
          )}

          {/* Rewrite prompt */}
          {showRewritePrompt && (
            <div className="mt-4 rounded-2xl border border-violet-200 bg-white/80 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AutoFixHighRoundedIcon sx={{ fontSize: 18 }} className="text-violet-500" />
                  <p className="text-sm font-semibold text-slate-700">AI Rewrite</p>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-600">HomieAgent</span>
                </div>
                <button onClick={closeRewrite} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition">
                  <CloseRoundedIcon sx={{ fontSize: 14 }} /> Cancel
                </button>
              </div>

              <p className="mb-2 text-xs text-slate-500">Give a one-line instruction:</p>
              <div className="flex gap-2">
                <input
                  ref={promptRef}
                  type="text"
                  value={rewritePrompt}
                  onChange={(e) => setRewritePrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRewrite()}
                  placeholder="e.g. Make it concise · Make it professional · Add more emotion"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 transition"
                  disabled={rewriting}
                />
                <button
                  onClick={handleRewrite}
                  disabled={!rewritePrompt.trim() || rewriting}
                  className="shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:from-violet-600 hover:to-indigo-700 disabled:opacity-40"
                >
                  {rewriting ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
                      Rewriting…
                    </span>
                  ) : 'Rewrite'}
                </button>
              </div>

              {rewriteError && <p className="mt-2 text-xs text-red-500">{rewriteError}</p>}

              {/* AI Suggestion */}
              {suggestion && (
                <div className="mt-4 rounded-2xl border border-amber-200 border-l-4 border-l-amber-400 bg-amber-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <LightbulbRoundedIcon sx={{ fontSize: 16 }} className="text-amber-500" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">AI Suggestion</p>
                  </div>
                  <p
                    className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-700"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {suggestion}
                  </p>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={closeRewrite}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <CloseRoundedIcon sx={{ fontSize: 13 }} /> Reject
                    </button>
                    <button
                      onClick={acceptSuggestion}
                      className="flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                    >
                      <CheckRoundedIcon sx={{ fontSize: 13 }} /> Accept
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
