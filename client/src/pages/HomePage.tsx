import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HomieAgent from '../components/HomieAgent';
import {
  getUserTransactions,
  getUserStocks,
  getUserCarts,
  getGroupsForUser,
} from '../lib/moneyApi';
import type { Transaction, Stock, CartItem, Group } from '../types/dashboard';

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className={`rounded-2xl border ${accent} bg-white p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 truncate">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [carts, setCarts] = useState<CartItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserTransactions(user.user_id),
      getUserStocks(user.user_id),
      getUserCarts(user.user_id),
      getGroupsForUser(user.user_id),
    ])
      .then(([txs, stks, crts, grps]) => {
        setTransactions(txs);
        setStocks(stks);
        setCarts(crts);
        setGroups(grps);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const cartTotal = carts.reduce((s, c) => s + c.cost, 0);
  const recentTxs = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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

      {/* HomieAgent — always visible at top */}
      {user && <HomieAgent userId={user.user_id} groups={groups} />}

      {loading ? (
        <div className="rounded-2xl bg-slate-100 px-4 py-10 text-center text-sm text-slate-500">Loading your data…</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Net Balance"
              value={`Rs. ${Math.abs(netBalance).toLocaleString()}`}
              sub={netBalance >= 0 ? 'surplus' : 'deficit'}
              accent={netBalance >= 0 ? 'border-emerald-200' : 'border-rose-200'}
            />
            <StatCard label="Income" value={`Rs. ${totalIncome.toLocaleString()}`} accent="border-blue-200" />
            <StatCard label="Expenses" value={`Rs. ${totalExpense.toLocaleString()}`} accent="border-orange-200" />
            <StatCard label="Cart Total" value={`Rs. ${cartTotal.toLocaleString()}`} sub={`${carts.length} item${carts.length !== 1 ? 's' : ''}`} accent="border-purple-200" />
          </div>

          {/* Quick nav tabs */}
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
            <Link to="/personal" className="no-underline flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-white hover:shadow-sm hover:text-slate-900">
              MyDash
            </Link>
            <Link to="/groups" className="no-underline flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-white hover:shadow-sm hover:text-slate-900">
              MyHomeDash
            </Link>
          </div>

          {/* Recent Transactions */}
          {recentTxs.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">Recent Transactions</h2>
                <Link to="/personal" className="text-xs text-blue-600 hover:underline">MyDash →</Link>
              </div>
              <div className="space-y-2">
                {recentTxs.map((t) => (
                  <div key={t.transaction_id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{t.description || 'No description'}</p>
                      <p className="text-xs text-slate-400">{t.date.substring(0, 10)}</p>
                    </div>
                    <span className={`shrink-0 ml-3 text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '−'}Rs.&nbsp;{t.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Stocks & Cart side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stocks */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">Stocks</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{stocks.length}</span>
              </div>
              {stocks.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">No stocks recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {stocks.slice(0, 6).map((s) => (
                    <li key={s.stock_id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-800 truncate">{s.stock_item}</span>
                      <span className="shrink-0 ml-2 text-slate-500 text-xs">{s.quantity || '—'}</span>
                    </li>
                  ))}
                  {stocks.length > 6 && <li className="text-xs text-slate-400">+{stocks.length - 6} more</li>}
                </ul>
              )}
            </div>

            {/* Cart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">Cart</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{carts.length} • Rs. {cartTotal.toLocaleString()}</span>
              </div>
              {carts.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">Cart is empty.</p>
              ) : (
                <ul className="space-y-2">
                  {carts.slice(0, 6).map((c) => (
                    <li key={c.cart_id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-800 truncate">{c.stock_item}</span>
                      <span className="shrink-0 ml-2 text-slate-600 font-medium text-xs">Rs. {c.cost}</span>
                    </li>
                  ))}
                  {carts.length > 6 && <li className="text-xs text-slate-400">+{carts.length - 6} more</li>}
                </ul>
              )}
            </div>
          </div>

          {/* Groups */}
          {groups.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">MyHomeDash Groups</h2>
                <Link to="/groups" className="text-xs text-blue-600 hover:underline">Manage</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {groups.map((g) => (
                  <Link key={g.group_id} to={`/groups/${g.group_id}`} className="no-underline">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-blue-300 hover:shadow-sm transition">
                      <p className="font-semibold text-slate-900 text-sm truncate">{g.group_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{g.users.length} member{g.users.length !== 1 ? 's' : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
