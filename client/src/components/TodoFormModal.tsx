import { useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import type { Todo, TodoCreate, TodoUpdate } from '../types/dashboard';

type Props = {
  onClose: () => void;
  onSave: (data: TodoCreate | TodoUpdate) => Promise<void>;
  initial?: Todo | null;
  defaultUserId?: number;
  defaultGroupId?: string;
};

const fieldCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition';
const fieldLabel = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5';

const PRIORITIES = [
  { value: 'low', label: 'Low', cls: 'bg-slate-100 text-slate-600', active: 'bg-slate-500 text-white' },
  { value: 'medium', label: 'Medium', cls: 'bg-amber-50 text-amber-700', active: 'bg-amber-500 text-white' },
  { value: 'high', label: 'High', cls: 'bg-rose-50 text-rose-700', active: 'bg-rose-500 text-white' },
] as const;

export default function TodoFormModal({ onClose, onSave, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initial?.priority ?? 'medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        priority,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <span className="text-base font-bold text-slate-900">{initial ? 'Edit Todo' : 'New Todo'}</span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition">
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
        {error && <div className="mx-5 mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <div>
            <label className={fieldLabel}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} placeholder="What needs to be done?" required />
          </div>
          <div>
            <label className={fieldLabel}>Notes <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={fieldCls} placeholder="Optional detail…" />
          </div>
          <div>
            <label className={fieldLabel}>Due Date <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className={fieldLabel}>Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${priority === p.value ? p.active : p.cls + ' hover:opacity-80'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
