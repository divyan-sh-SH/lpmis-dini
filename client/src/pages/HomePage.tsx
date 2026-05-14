import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LineChart from '../components/LineChart';
import { getUserTransactions, getGroupsForUser } from '../lib/moneyApi';
import type { Transaction, Group } from '../types/dashboard';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import NorthRoundedIcon from '@mui/icons-material/NorthRounded';
import SouthRoundedIcon from '@mui/icons-material/SouthRounded';

type Period = 'week' | 'month';

const GROUP_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-orange-400 to-rose-500',
  'from-cyan-500 to-blue-500',
  'from-fuchsia-500 to-pink-600',
];

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('week');

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserTransactions(user.user_id), getGroupsForUser(user.user_id)])
      .then(([txs, grps]) => {
        setTransactions(txs);
        setGroups(grps);
      })
      .finally(() => setLoading(false));
  }, [user]);

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

  return (
    <div className="w-full space-y-5">

      {/* ── Hero card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 px-6 py-6 text-white shadow-lg shadow-indigo-200/50">
        {/* Decorative circles */}
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

          {/* Avatar */}
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
            icon: <SwapVertRoundedIcon sx={{ fontSize: 18 }} className="text-blue-600" />,
            label: 'MyDash',
            bg: 'bg-blue-50 border-blue-200 hover:border-blue-400',
          },
          {
            to: '/groups',
            icon: <HomeRoundedIcon sx={{ fontSize: 18 }} className="text-indigo-600" />,
            label: 'MyHomeDash',
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

      {/* ── Data sections ── */}
      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-100 px-4 py-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
          </div>
          <p className="text-sm text-slate-500">Loading your data…</p>
        </div>
      ) : (
        <>
          {/* MyDash Overview */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">MyDash Overview</h2>
                <p className="text-xs text-slate-400 mt-0.5">Your personal financials</p>
              </div>
              <Link
                to="/personal"
                className="flex items-center gap-0.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
              >
                Manage <ChevronRightRoundedIcon sx={{ fontSize: 14 }} />
              </Link>
            </div>

            <div className="px-5 pb-2">
              <LineChart transactions={transactions} onPeriodChange={setPeriod} />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 px-5 pb-5">
              {/* Net Balance */}
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
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Net
                </p>
                <p
                  className={`mt-0.5 text-base font-bold truncate ${
                    net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {fmtMoney(Math.abs(net))}
                </p>
                <p className="text-[10px] text-slate-400">{net >= 0 ? 'surplus' : 'deficit'}</p>
              </div>

              {/* Income */}
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-3.5">
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100">
                  <NorthRoundedIcon sx={{ fontSize: 15 }} className="text-blue-600" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Income
                </p>
                <p className="mt-0.5 text-base font-bold text-blue-700 truncate">
                  {fmtMoney(income)}
                </p>
                <p className="text-[10px] text-slate-400">this {period}</p>
              </div>

              {/* Expenses */}
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-3.5">
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-xl bg-orange-100">
                  <SouthRoundedIcon sx={{ fontSize: 15 }} className="text-orange-600" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Expenses
                </p>
                <p className="mt-0.5 text-base font-bold text-orange-700 truncate">
                  {fmtMoney(expense)}
                </p>
                <p className="text-[10px] text-slate-400">this {period}</p>
              </div>
            </div>
          </section>

          {/* My HomeDash List */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">My HomeDash</h2>
                <p className="text-xs text-slate-400">Your shared households</p>
              </div>
              <Link
                to="/groups"
                className="flex items-center gap-0.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition"
              >
                Manage <ChevronRightRoundedIcon sx={{ fontSize: 14 }} />
              </Link>
            </div>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                  <HomeRoundedIcon sx={{ fontSize: 24 }} className="text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No home groups yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Create a group to manage shared expenses
                </p>
                <Link
                  to="/groups"
                  className="mt-3 inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition no-underline"
                >
                  Create group →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {groups.map((g, idx) => {
                  const initials = g.group_name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const gradient = GROUP_GRADIENTS[idx % GROUP_GRADIENTS.length];
                  return (
                    <Link
                      key={g.group_id}
                      to={`/groups/${g.group_id}`}
                      className="no-underline group"
                    >
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-sm`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900 text-sm">
                            {g.group_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {g.users.length} member{g.users.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronRightRoundedIcon
                          sx={{ fontSize: 18 }}
                          className="shrink-0 text-slate-300 group-hover:text-indigo-400 transition"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
}
