import type { Transaction } from '../types/dashboard';

type TransactionsProps = {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
};

export default function Transactions({ transactions, onEdit, onDelete }: TransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
        No transactions yet.
      </div>
    );
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, index) => (
              <tr key={t.transaction_id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}>
                <td className="px-4 py-3 text-sm text-slate-700">{t.date.substring(0, 10)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">Rs. {t.amount}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{t.description || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onEdit(t)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition">Edit</button>
                  <button onClick={() => onDelete(t.transaction_id)} className="ml-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {transactions.map((t) => (
          <div key={t.transaction_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{t.description || '—'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.date.substring(0, 10)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'income' ? '+' : '−'}Rs.&nbsp;{t.amount}
                </p>
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {t.type}
                </span>
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-2">
              <button onClick={() => onEdit(t)} className="flex-1 rounded-lg py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition">Edit</button>
              <button onClick={() => onDelete(t.transaction_id)} className="flex-1 rounded-lg py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 transition">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
