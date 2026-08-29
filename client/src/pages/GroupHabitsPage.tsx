import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getGroupHabits, getGroupHabitLogsByDate, getGroupsForUser } from '../lib/moneyApi';
import { useAuth } from '../contexts/AuthContext';
import type { Habit, HabitLog } from '../types/dashboard';
import HabitCheckInGrid from '../components/HabitCheckInGrid';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

export default function GroupHabitsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [groupName, setGroupName] = useState('Group');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !groupId) return;
    getGroupsForUser(user.user_id).then((groups) => {
      const match = groups.find((g) => g.group_id === groupId);
      if (match) setGroupName(match.group_name);
    }).catch(() => {});
  }, [user, groupId]);

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    const [habitsResult, logsResult] = await Promise.allSettled([
      getGroupHabits(groupId),
      getGroupHabitLogsByDate(groupId, today),
    ]);
    if (habitsResult.status === 'fulfilled') setHabits(habitsResult.value);
    if (logsResult.status === 'fulfilled') setLogs(logsResult.value);
    if (habitsResult.status === 'rejected') setError('Failed to load habits');
    setLoading(false);
  }, [groupId, today]);

  useEffect(() => { load(); }, [load]);

  const doneCount = habits.filter((h) => logs.some((l) => l.habit_id === h.habit_id && l.completed)).length;

  return (
    <div className="w-full">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/groups/${groupId}`} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition">
            <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{groupName} Habits</h1>
            {!loading && (
              <p className="text-xs text-slate-500 mt-0.5">
                Today · {doneCount} / {habits.length} done
              </p>
            )}
          </div>
        </div>
        <Link
          to={`/groups/${groupId}/habits/config`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
        >
          <SettingsRoundedIcon sx={{ fontSize: 17 }} /> Manage
        </Link>
      </header>

      {loading && <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">Loading…</div>}
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && (
        <HabitCheckInGrid
          habits={habits}
          logs={logs}
          date={today}
          onLogsChange={load}
        />
      )}
    </div>
  );
}
