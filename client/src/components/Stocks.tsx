import type { Stock } from '../types/dashboard';

type StocksProps = {
  stocks: Stock[];
  onEdit: (stock: Stock) => void;
  onDelete: (stockId: number) => void;
};

export default function Stocks({ stocks, onEdit, onDelete }: StocksProps) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-separate border-spacing-0">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Item Name</th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quantity</th>
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.length === 0 ? (
            <tr>
              <td className="px-5 py-8 text-center text-sm text-slate-500" colSpan={3}>
                No stocks yet.
              </td>
            </tr>
          ) : (
            stocks.map((stock, index) => (
              <tr
                key={stock.id}
                className={`transition-colors ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-slate-100`}
              >
                <td className="px-5 py-4 align-top">
                  <div className="text-sm font-semibold text-slate-900">{stock.stock_item}</div>
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="text-sm font-semibold text-slate-900">{stock.quantity}</div>
                </td>
                <td className="px-5 py-4 text-right align-top">
                  <button
                    type="button"
                    onClick={() => onEdit(stock)}
                    className="rounded-full px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(stock.id)}
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
