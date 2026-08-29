import { useState, useEffect } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import type { Habit, HabitCreate, HabitUpdate } from '../types/dashboard';

type Props = {
  onClose: () => void;
  onSave: (data: HabitCreate | HabitUpdate) => Promise<void>;
  initial?: Habit | null;
};

const fieldCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition';
const fieldLabel = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'weekly', label: 'Weekly' },
] as const;

export default function HabitFormModal({ onClose, onSave, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'weekly'>(initial?.frequency ?? 'daily');
  const [isQuantifiable, setIsQuantifiable] = useState(initial?.target_value != null);
  const [targetValue, setTargetValue] = useState(String(initial?.target_value ?? ''));
  const [unit, setUnit] = useState(initial?.unit ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsQuantifiable(initial?.target_value != null);
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: HabitCreate | HabitUpdate = {
        name: name.trim(),
        description: description.trim() || null,
        frequency,
        target_value: isQuantifiable && targetValue ? parseInt(targetValue) : null,
        unit: isQuantifiable && unit.trim() ? unit.trim() : null,
      };
      await onSave(payload);
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
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <span className="text-base font-bold text-slate-900">{initial ? 'Edit Habit' : 'New Habit'}</span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition">
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
        {error && <div className="mx-5 mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <div>
            <label className={fieldLabel}>Habit Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} placeholder="e.g. Drink Water, Exercise, Read…" required />
          </div>
          <div>
            <label className={fieldLabel}>Description <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={fieldCls} placeholder="Optional detail…" />
          </div>
          <div>
            <label className={fieldLabel}>Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={`rounded-xl py-2 text-sm font-semibold transition ${frequency === f.value ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={fieldLabel}>Type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsQuantifiable(false)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${!isQuantifiable ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Done / Not done
              </button>
              <button type="button" onClick={() => setIsQuantifiable(true)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${isQuantifiable ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Quantifiable
              </button>
            </div>
          </div>
          {isQuantifiable && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={fieldLabel}>Target</label>
                <input type="number" min="1" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className={fieldCls} placeholder="e.g. 8" />
              </div>
              <div className="flex-1">
                <label className={fieldLabel}>Unit</label>
                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className={fieldCls} placeholder="e.g. glasses, pages…" />
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
