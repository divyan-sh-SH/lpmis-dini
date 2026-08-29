import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LineChart from '../components/LineChart';
import CalendarView from '../components/CalendarView';
import {
  getUserTransactions,
  getUserCalendarEvents, getUserHabits, getUserHabitLogsRange, getUserTodos,
} from '../lib/moneyApi';
import type { Transaction, CalendarEvent, Habit, HabitLog, Todo } from '../types/dashboard';
import MyDashIcon from '../components/icons/MyDashIcon';
import MyHomeDashIcon from '../components/icons/MyHomeDashIcon';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import NorthRoundedIcon from '@mui/icons-material/NorthRounded';
import SouthRoundedIcon from '@mui/icons-material/SouthRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';

type Period = 'week' | 'month';
type Tab = 'calendar' | 'charts';

function getPeriodStart(period: Period): Date {
  const now = new Date();
  if (period === 'week') {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function fmtMoney(n: number): string {
  if (n >= 100000) return `Rs. ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `Rs. ${(n / 1000).toFixed(1)}k`;
  return `Rs. ${Math.round(n).toLocaleString()}`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function HomePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('calendar');

  // Charts data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<Period>('week');

  // Calendar data
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);

  const [loading, setLoading] = useState(true);

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 30);
  const startDate = rangeStart.toISOString().split('T')[0];
  const endDate = rangeEnd.toISOString().split('T')[0];

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [txRes, evRes, habRes, logRes, todoRes] = await Promise.allSettled([
      getUserTransactions(user.user_id),
      getUserCalendarEvents(user.user_id),
      getUserHabits(user.user_id),
      getUserHabitLogsRange(user.user_id, startDate, endDate),
      getUserTodos(user.user_id),
    ]);
    if (txRes.status === 'fulfilled') setTransactions(txRes.value);
    if (evRes.status === 'fulfilled') setEvents(evRes.value);
    if (habRes.status === 'fulfilled') setHabits(habRes.value);
    if (logRes.status === 'fulfilled') setLogs(logRes.value);
    if (todoRes.status === 'fulfilled') setTodos(todoRes.value);
    setLoading(false);
  }, [user, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const periodStart = getPeriodStart(period);
  const periodEnd = new Date();
  periodEnd.setHours(23, 59, 59, 999);

  const periodTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= periodStart && d <= periodEnd;
  });

  const income = periodTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = periodTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const initials = user?.username
    ? user.username.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'calendar', label: 'Calendar', icon: <CalendarMonthRoundedIcon sx={{ fontSize: 16 }} /> },
    { id: 'charts', label: 'Charts', icon: <BarChartRoundedIcon sx={{ fontSize: 16 }} /> },
  ];

  return (
    <div className="w-full space-y-5">

      {/* ── Hero card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 px-6 py-6 text-white shadow-lg shadow-indigo-200/50">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 -left-6 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-200">{greeting}</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight truncate">
              {user?.username ?? 'There'}!
            </h1>
            <p className="mt-0.5 text-xs text-blue-300">{todayLabel()}</p>

            {!loading && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                  Net this {period}
                </p>
                <div className="mt-1 flex items-end gap-2">
                  <span className="text-3xl font-bold leading-none">
                    {fmtMoney(Math.abs(net))}
                  </span>
                  <span
                    className={`mb-0.5 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      net >= 0
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'bg-rose-400/20 text-rose-300'
                    }`}
                  >
                    {net >= 0 ? (
                      <TrendingUpRoundedIcon sx={{ fontSize: 13 }} />
                    ) : (
                      <TrendingDownRoundedIcon sx={{ fontSize: 13 }} />
                    )}
                    {net >= 0 ? 'surplus' : 'deficit'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur-sm">
            {initials}
          </div>
        </div>
      </div>

      {/* ── Quick nav ── */}
      <div className="flex gap-3 overflow-x-auto pb-0.5 scrollbar-hide">
        {[
          {
            to: '/personal',
            icon: <MyDashIcon size={18} className="text-blue-600" />,
            label: 'My Dash',
            bg: 'bg-blue-50 border-blue-200 hover:border-blue-400',
          },
          {
            to: '/groups',
            icon: <MyHomeDashIcon size={18} className="text-indigo-600" />,
            label: 'My HomeDash',
            bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
          },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`shrink-0 flex items-center gap-2 rounded-2xl border px-4 py-2.5 shadow-sm transition text-slate-700 font-semibold text-sm no-underline ${item.bg}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-100 px-4 py-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
          </div>
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      ) : tab === 'calendar' ? (
        <CalendarView
          events={events}
          habits={habits}
          logs={logs}
          todos={todos}
          scope={{ user_id: user?.user_id }}
          onRefresh={load}
        />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <LineChart transactions={transactions} onPeriodChange={setPeriod} />
          </div>

          <div className="grid grid-cols-3 gap-3 px-5 pb-5">
            <div
              className={`rounded-2xl p-3.5 ${
                net >= 0
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200'
                  : 'bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200'
              }`}
            >
              <div
                className={`mb-2 flex h-7 w-7 items-center justify-center rounded-xl ${
                  net >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
                }`}
              >
                {net >= 0 ? (
                  <TrendingUpRoundedIcon sx={{ fontSize: 15 }} className="text-emerald-600" />
                ) : (
                  <TrendingDownRoundedIcon sx={{ fontSize: 15 }} className="text-rose-600" />
                )}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Net</p>
              <p className={`mt-0.5 text-base font-bold truncate ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {fmtMoney(Math.abs(net))}
              </p>
              <p className="text-[10px] text-slate-400">{net >= 0 ? 'surplus' : 'deficit'}</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-3.5">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100">
                <NorthRoundedIcon sx={{ fontSize: 15 }} className="text-blue-600" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Income</p>
              <p className="mt-0.5 text-base font-bold text-blue-700 truncate">{fmtMoney(income)}</p>
              <p className="text-[10px] text-slate-400">this {period}</p>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-3.5">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-xl bg-orange-100">
                <SouthRoundedIcon sx={{ fontSize: 15 }} className="text-orange-600" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Expenses</p>
              <p className="mt-0.5 text-base font-bold text-orange-700 truncate">{fmtMoney(expense)}</p>
              <p className="text-[10px] text-slate-400">this {period}</p>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
