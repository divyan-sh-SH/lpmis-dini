import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllUserHabits, getAllGroupHabits,
  createHabit, updateHabit, archiveHabit, deleteHabit,
} from '../lib/moneyApi';
import type { Habit, HabitCreate, HabitUpdate } from '../types/dashboard';
import HabitFormModal from '../components/HabitFormModal';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

type Props = { scope: 'personal' | 'group' };

export default function HabitConfigPage({ scope }: Props) {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const backPath = scope === 'personal' ? '/personal/habits' : `/groups/${groupId}/habits`;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = scope === 'personal'
        ? await getAllUserHabits(user.user_id)
        : await getAllGroupHabits(groupId!);
      setHabits(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, [user, scope, groupId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data: HabitCreate | HabitUpdate) {
    if (editing) {
      await updateHabit(editing.habit_id, data as HabitUpdate);
    } else {
      const createData: HabitCreate = {
        ...(data as HabitCreate),
        ...(scope === 'personal' ? { user_id: user!.user_id } : { group_id: groupId }),
      };
      await createHabit(createData);
    }
    await load();
  }

  async function handleArchive(habit_id: string) {
    try { await archiveHabit(habit_id); await load(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to archive'); }
  }

  async function handleDelete(habit_id: string) {
    if (!confirm('Delete this habit and all its logs? This cannot be undone.')) return;
    try { await deleteHabit(habit_id); await load(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to delete'); }
  }

  const active = habits.filter((h) => h.is_active);
  const archived = habits.filter((h) => !h.is_active);

  return (
    <div className="w-full">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={backPath} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition">
            <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Manage Habits</h1>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          <AddRoundedIcon sx={{ fontSize: 18 }} /> Add Habit
        </button>
      </header>

      {loading && <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">Loading…</div>}
      {error && <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && active.length === 0 && (
        <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center text-sm text-slate-400">
          No active habits. Tap + Add Habit to get started.
        </div>
      )}

      {active.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Active</div>
          <div className="flex flex-col gap-2">
            {active.map((habit) => (
              <div key={habit.habit_id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">{habit.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {habit.frequency}
                    {habit.target_value ? ` · ${habit.target_value} ${habit.unit || ''}` : ' · boolean'}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(habit); setShowModal(true); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                    <EditRoundedIcon sx={{ fontSize: 15 }} />
                  </button>
                  <button onClick={() => handleArchive(habit.habit_id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition" title="Archive">
                    <ArchiveRoundedIcon sx={{ fontSize: 15 }} />
                  </button>
                  <button onClick={() => handleDelete(habit.habit_id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                    <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Archived</div>
          <div className="flex flex-col gap-2">
            {archived.map((habit) => (
              <div key={habit.habit_id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 opacity-60">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-600 truncate line-through">{habit.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{habit.frequency}</div>
                </div>
                <button onClick={() => handleDelete(habit.habit_id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                  <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <HabitFormModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
