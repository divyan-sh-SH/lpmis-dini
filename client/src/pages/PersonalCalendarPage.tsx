import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserCalendarEvents, getUserHabits, getUserHabitLogsRange, getUserTodos,
} from '../lib/moneyApi';
import type { CalendarEvent, Habit, HabitLog, Todo } from '../types/dashboard';
import CalendarView from '../components/CalendarView';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

export default function PersonalCalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 30);
  const startDate = rangeStart.toISOString().split('T')[0];
  const endDate = rangeEnd.toISOString().split('T')[0];

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const [eventsRes, habitsRes, logsRes, todosRes] = await Promise.allSettled([
      getUserCalendarEvents(user.user_id),
      getUserHabits(user.user_id),
      getUserHabitLogsRange(user.user_id, startDate, endDate),
      getUserTodos(user.user_id),
    ]);
    if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value);
    if (habitsRes.status === 'fulfilled') setHabits(habitsRes.value);
    if (logsRes.status === 'fulfilled') setLogs(logsRes.value);
    if (todosRes.status === 'fulfilled') setTodos(todosRes.value);
    if (eventsRes.status === 'rejected') setError('Failed to load calendar data');
    setLoading(false);
  }, [user, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="w-full">
      <header className="mb-5 flex items-center gap-3">
        <Link to="/personal" className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition">
          <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(today + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </header>

      {loading && <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">Loading…</div>}
      {error && <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && (
        <CalendarView
          events={events}
          habits={habits}
          logs={logs}
          todos={todos}
          scope={{ user_id: user?.user_id }}
          onRefresh={load}
        />
      )}
    </div>
  );
}
