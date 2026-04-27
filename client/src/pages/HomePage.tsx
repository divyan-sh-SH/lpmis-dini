import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HomieAgent from '../components/HomieAgent';
import LineChart from '../components/LineChart';
import { getUserTransactions, getGroupsForUser } from '../lib/moneyApi';
import type { Transaction, Group } from '../types/dashboard';

type Period = 'week' | 'month';

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

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}{user?.username ? `, ${user.username}` : ''}!
        </h1>
        <p className="text-slate-500 mt-1">Here's your household overview.</p>
      </header>

      {/* HomieAgent */}
      {user && <HomieAgent userId={user.user_id} groups={groups} />}

      {loading ? (
        <div className="rounded-2xl bg-slate-100 px-4 py-10 text-center text-sm text-slate-500">Loading your data…</div>
      ) : (
        <>
          {/* MyDash section */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">MyDash Overview</h2>
              <Link to="/personal" className="text-xs font-semibold text-blue-600 hover:underline">
                Manage MyDash →
              </Link>
            </div>

            {/* Chart */}
            <LineChart transactions={transactions} onPeriodChange={setPeriod} />

            {/* Period stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className={`rounded-xl border p-3 ${net >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Balance</p>
                <p className={`mt-1 text-lg font-bold truncate ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {fmtMoney(Math.abs(net))}
                </p>
                <p className="text-xs text-slate-400">{net >= 0 ? 'surplus' : 'deficit'}</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Income</p>
                <p className="mt-1 text-lg font-bold text-blue-700 truncate">{fmtMoney(income)}</p>
                <p className="text-xs text-slate-400">this {period}</p>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expenses</p>
                <p className="mt-1 text-lg font-bold text-orange-700 truncate">{fmtMoney(expense)}</p>
                <p className="text-xs text-slate-400">this {period}</p>
              </div>
            </div>
          </section>

          {/* My HomeDash List */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">My HomeDash List</h2>
              <Link to="/groups" className="text-xs font-semibold text-blue-600 hover:underline">
                Manage →
              </Link>
            </div>
            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
                No groups yet.{' '}
                <Link to="/groups" className="text-blue-600 hover:underline">Create one →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {groups.map((g) => {
                  const initials = g.group_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <Link key={g.group_id} to={`/groups/${g.group_id}`} className="no-underline group">
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 text-sm">{g.group_name}</p>
                          <p className="text-xs text-slate-400">{g.users.length} member{g.users.length !== 1 ? 's' : ''}</p>
                        </div>
                        <span className="ml-auto shrink-0 text-slate-300 group-hover:text-blue-400 transition text-sm">→</span>
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
