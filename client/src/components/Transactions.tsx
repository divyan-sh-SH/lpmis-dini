import { useMemo, useState } from 'react';
import type { Transaction } from '../types/dashboard';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';

type TransactionsProps = {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
};

function fmtMonthKey(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function fmtAmount(n: number): string {
  return `Rs. ${n.toLocaleString('en-IN')}`;
}

const currentMonthKey = new Date().toISOString().slice(0, 7);

export default function Transactions({ transactions, onEdit, onDelete }: TransactionsProps) {
  const grouped = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const map: Record<string, Transaction[]> = {};
    for (const t of sorted) {
      const key = t.date.slice(0, 7);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set([currentMonthKey]));

  function toggle(key: string) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
        No transactions yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map(([key, txs]) => {
        const isOpen = openMonths.has(key);
        const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const net = income - expense;
        const isCurrent = key === currentMonthKey;

        return (
          <div
            key={key}
            className={`overflow-hidden rounded-2xl border shadow-sm ${isCurrent ? 'border-indigo-200' : 'border-slate-200'} bg-white`}
          >
            {/* Accordion header */}
            <button
              type="button"
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between px-5 py-3.5 gap-3 text-left transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm">{fmtMonthKey(key)}</p>
                    {isCurrent && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                        This month
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{txs.length} transaction{txs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex items-center gap-4 text-xs">
                  <span className="text-emerald-600 font-semibold">+{fmtAmount(income)}</span>
                  <span className="text-rose-500 font-semibold">−{fmtAmount(expense)}</span>
                  <span className={`font-bold ${net >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {net >= 0 ? '+' : '−'}{fmtAmount(Math.abs(net))}
                  </span>
                </div>
                <span className="text-slate-400">
                  {isOpen
                    ? <KeyboardArrowUpRoundedIcon sx={{ fontSize: 20 }} />
                    : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />}
                </span>
              </div>
            </button>

            {/* Mobile summary (visible inside header on sm-) */}
            {!isOpen && (
              <div className="sm:hidden flex items-center gap-3 px-5 pb-3 text-xs">
                <span className="text-emerald-600 font-semibold">+{fmtAmount(income)}</span>
                <span className="text-rose-500 font-semibold">−{fmtAmount(expense)}</span>
                <span className={`font-bold ${net >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  net {net >= 0 ? '+' : '−'}{fmtAmount(Math.abs(net))}
                </span>
              </div>
            )}

            {/* Accordion body */}
            {isOpen && (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block border-t border-slate-100 overflow-hidden">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Type</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map((t, index) => (
                        <tr
                          key={t.transaction_id}
                          className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-blue-50/40 transition-colors`}
                        >
                          <td className="px-4 py-3 text-sm text-slate-500">{t.date.substring(0, 10)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">Rs. {t.amount.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{t.description || '—'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {t.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => onEdit(t)}
                              className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(t.transaction_id)}
                              className="ml-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden border-t border-slate-100 p-3 space-y-2">
                  {txs.map((t) => (
                    <div key={t.transaction_id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{t.description || '—'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{t.date.substring(0, 10)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'income' ? '+' : '−'}Rs.&nbsp;{t.amount.toLocaleString('en-IN')}
                          </p>
                          <span
                            className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                              t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {t.type}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2.5 flex gap-2 border-t border-slate-100 pt-2">
                        <button
                          onClick={() => onEdit(t)}
                          className="flex-1 rounded-lg py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(t.transaction_id)}
                          className="flex-1 rounded-lg py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
