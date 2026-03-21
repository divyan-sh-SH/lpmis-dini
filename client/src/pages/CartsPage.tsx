import { useEffect, useMemo, useState } from 'react';
import type { CartItem } from '../types/dashboard';
import { addCart, buyCart, fetchCarts, removeCart } from '../lib/moneyApi';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function CartsPage() {
  const [carts, setCarts] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cartItemName, setCartItemName] = useState('');
  const [cartStore, setCartStore] = useState('');
  const [cartCost, setCartCost] = useState('');
  const [cartNotes, setCartNotes] = useState('');

  const cartsTotal = useMemo(
    () => carts.reduce((sum, c) => sum + c.cost, 0),
    [carts],
  );

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const cartsData = await fetchCarts();
      setCarts(cartsData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load carts data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleAddCart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const costNumber = Number(cartCost);
    if (!cartItemName.trim() || !costNumber || costNumber <= 0) {
      setError('Please enter item name and a valid cost.');
      return;
    }

    try {
      await addCart({
        itemName: cartItemName.trim(),
        store: cartStore.trim() || null,
        cost: costNumber,
        notes: cartNotes.trim() || null,
      });

      setCartItemName('');
      setCartStore('');
      setCartCost('');
      setCartNotes('');

      await fetchAll();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add cart item';
      setError(msg);
    }
  }

  async function handleRemoveCart(id: number) {
    setError(null);
    try {
      await removeCart(id);
      await fetchAll();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to remove cart item';
      setError(msg);
    }
  }

  async function handleBuyCart(id: number) {
    setError(null);
    try {
      await buyCart({ cartId: id, date: todayIso() });
      await fetchAll();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to buy item';
      setError(msg);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Carts</h2>
        <span className="panel-period">Wishlist items you plan to buy later.</span>
      </div>

      <div className="panel-banner">
        <div>
          <span className="banner-label">Items</span>
          <span className="banner-value">{carts.length}</span>
        </div>
        <div>
          <span className="banner-label">Total planned</span>
          <span className="banner-value">{formatCurrency(cartsTotal)}</span>
        </div>
        <div>
          <span className="banner-label">Next step</span>
          <span className="banner-value positive">Buy later</span>
        </div>
      </div>

      {loading && <div className="banner info">Loading data…</div>}
      {error && <div className="banner error">{error}</div>}

      <section className="panel-content two-column">
        <form className="card form-card" onSubmit={handleAddCart}>
          <h3>Add item to cart</h3>
          <div className="form-row">
            <label>
              Item name
              <input
                type="text"
                value={cartItemName}
                onChange={(e) => setCartItemName(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Where to buy from
              <input
                type="text"
                value={cartStore}
                onChange={(e) => setCartStore(e.target.value)}
                placeholder="Amazon, local shop, etc."
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Estimated cost (₹)
              <input
                type="number"
                min={0}
                step="0.01"
                value={cartCost}
                onChange={(e) => setCartCost(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Notes
              <input
                type="text"
                value={cartNotes}
                onChange={(e) => setCartNotes(e.target.value)}
                placeholder="Size, color, reason to buy, etc."
              />
            </label>
          </div>
          <button type="submit" className="primary-btn">
            Add to cart
          </button>
        </form>

        <div className="card table-card">
          <h3>Cart items</h3>
          {carts.length === 0 ? (
            <p className="empty-text">
              No items in your cart yet. Add something you want to buy in future.
            </p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Where to buy</th>
                    <th className="numeric">Cost (₹)</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {carts.map((item) => (
                    <tr key={item.id}>
                      <td>{item.itemName}</td>
                      <td>{item.store || '-'}</td>
                      <td className="numeric">{formatCurrency(item.cost)}</td>
                      <td>{item.notes || '-'}</td>
                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => handleBuyCart(item.id)}
                          >
                            Buy
                          </button>
                          <button
                            type="button"
                            className="tertiary-btn"
                            onClick={() => handleRemoveCart(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

