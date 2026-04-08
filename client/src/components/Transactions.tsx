import type { Transaction } from '../types/dashboard';

type TransactionsProps = {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: number) => void;
};

export default function Transactions({ transactions, onEdit, onDelete }: TransactionsProps) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-separate border-spacing-0">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Description</th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td className="px-5 py-8 text-center text-sm text-slate-500" colSpan={5}>
                No transactions yet.
              </td>
            </tr>
          ) : (
            transactions.map((transaction, index) => (
              <tr
                key={transaction.id}
                className={`transition-colors ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-slate-100`}
              >
                <td className="px-5 py-4 align-top">
                  <div className="text-sm font-semibold text-slate-900">{transaction.date.substring(0, 10)}</div>
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="text-sm font-semibold text-slate-900">Rs. {transaction.amount}</div>
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="text-sm text-slate-700">{transaction.description || '-'}</div>
                </td>
                <td className="px-5 py-4 align-top">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      transaction.type === 'income'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {transaction.type}
                  </span>
                </td>
                <td className="px-5 py-4 text-right align-top">
                  <button
                    type="button"
                    onClick={() => onEdit(transaction)}
                    className="rounded-full px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(transaction.id)}
                    className="ml-2 rounded-full px-3 py-1 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
