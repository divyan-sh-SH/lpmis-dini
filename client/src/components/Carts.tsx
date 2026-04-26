import type { CartItem } from '../types/dashboard';

type CartsProps = {
  carts: CartItem[];
  onEdit: (cart: CartItem) => void;
  onDelete: (cartId: string) => void;
};

export default function Carts({ carts, onEdit, onDelete }: CartsProps) {
  if (carts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
        No cart items yet.
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Store</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Cost</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Note</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {carts.map((c, index) => (
              <tr key={c.cart_id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{c.stock_item}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{c.store_name || '—'}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">Rs. {c.cost}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{c.description || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onEdit(c)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition">Edit</button>
                  <button onClick={() => onDelete(c.cart_id)} className="ml-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {carts.map((c) => (
          <div key={c.cart_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{c.stock_item}</p>
                {c.store_name && <p className="text-xs text-slate-500 mt-0.5">{c.store_name}</p>}
                {c.description && <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>}
              </div>
              <p className="shrink-0 text-sm font-bold text-slate-900">Rs. {c.cost}</p>
            </div>
            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-2">
              <button onClick={() => onEdit(c)} className="flex-1 rounded-lg py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition">Edit</button>
              <button onClick={() => onDelete(c.cart_id)} className="flex-1 rounded-lg py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 transition">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
