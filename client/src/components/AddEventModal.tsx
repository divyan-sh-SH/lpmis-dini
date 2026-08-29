import { useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import type { CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from '../types/dashboard';

type Props = {
  onClose: () => void;
  onSave: (data: CalendarEventCreate | CalendarEventUpdate) => Promise<void>;
  initial?: CalendarEvent | null;
  defaultDate?: string;
};

const fieldCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition';
const fieldLabel = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5';

export default function AddEventModal({ onClose, onSave, initial, defaultDate }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? today);
  const [timeStart, setTimeStart] = useState(initial?.time_start ?? '');
  const [timeEnd, setTimeEnd] = useState(initial?.time_end ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        date,
        time_start: timeStart || null,
        time_end: timeEnd || null,
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
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <span className="text-base font-bold text-slate-900">{initial ? 'Edit Event' : 'New Event'}</span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition">
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
        {error && <div className="mx-5 mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <div>
            <label className={fieldLabel}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} placeholder="e.g. Doctor's appointment, Pay bills…" required />
          </div>
          <div>
            <label className={fieldLabel}>Description <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={fieldCls} placeholder="Optional detail…" />
          </div>
          <div>
            <label className={fieldLabel}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} required />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={fieldLabel}>Start Time <span className="normal-case font-normal text-slate-400">(optional)</span></label>
              <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className={fieldCls} />
            </div>
            <div className="flex-1">
              <label className={fieldLabel}>End Time <span className="normal-case font-normal text-slate-400">(optional)</span></label>
              <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className={fieldCls} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
