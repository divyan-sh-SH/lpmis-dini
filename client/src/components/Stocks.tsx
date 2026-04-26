import type { Stock } from '../types/dashboard';

type StocksProps = {
  stocks: Stock[];
  onEdit: (stock: Stock) => void;
  onDelete: (stockId: string) => void;
};

export default function Stocks({ stocks, onEdit, onDelete }: StocksProps) {
  if (stocks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
        No stocks yet.
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Item</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Quantity</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s, index) => (
              <tr key={s.stock_id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{s.stock_item}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.quantity || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onEdit(s)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition">Edit</button>
                  <button onClick={() => onDelete(s.stock_id)} className="ml-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {stocks.map((s) => (
          <div key={s.stock_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{s.stock_item}</p>
                {s.quantity && <p className="text-xs text-slate-500 mt-0.5">Qty: {s.quantity}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onEdit(s)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Edit</button>
                <button onClick={() => onDelete(s.stock_id)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
