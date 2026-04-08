import type { CartItem } from '../types/dashboard';

type CartsProps = {
  carts: CartItem[];
  onEdit: (cart: CartItem) => void;
  onDelete: (cartId: number) => void;
};

export default function Carts({ carts, onEdit, onDelete }: CartsProps) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-separate border-spacing-0">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Item Name</th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Store</th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Cost</th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Note</th>
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {carts.length === 0 ? (
            <tr>
              <td className="px-5 py-8 text-center text-sm text-slate-500" colSpan={5}>
                No cart items yet.
              </td>
            </tr>
          ) : (
            carts.map((cart, index) => (
              <tr
                key={cart.id}
                className={`transition-colors ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-slate-100`}
              >
                <td className="px-5 py-4 align-top">
                  <div className="text-sm font-semibold text-slate-900">{cart.itemName}</div>
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="text-sm text-slate-700">{cart.store || '-'}</div>
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="text-sm font-semibold text-slate-900">Rs. {cart.cost}</div>
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="text-sm text-slate-700">{cart.notes || '-'}</div>
                </td>
                <td className="px-5 py-4 text-right align-top">
                  <button
                    type="button"
                    onClick={() => onEdit(cart)}
                    className="rounded-full px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(cart.id)}
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
