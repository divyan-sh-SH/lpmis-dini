import { useEffect, useMemo, useState } from 'react';
import './App.css';

type TransactionType = 'income' | 'expense';

type Transaction = {
  id: number;
  date: string;
  type: TransactionType;
  amount: number;
  description?: string | null;
};

type CartItem = {
  id: number;
  itemName: string;
  store?: string | null;
  cost: number;
  notes?: string | null;
};

type Summary = {
  monthStart: string;
  monthEnd: string;
  income: number;
  expense: number;
  remaining: number;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

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

function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [carts, setCarts] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Daily expense form state
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(todayIso());

  // Cart form state
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
      const [summaryRes, txRes, cartsRes] = await Promise.all([
        fetch(`${API_BASE}/summary`),
        fetch(`${API_BASE}/transactions`),
        fetch(`${API_BASE}/carts`),
      ]);

      if (!summaryRes.ok || !txRes.ok || !cartsRes.ok) {
        throw new Error('Failed to load data from server');
      }

      const [summaryData, txData, cartsData] = await Promise.all([
        summaryRes.json(),
        txRes.json(),
        cartsRes.json(),
      ]);

      setSummary(summaryData);
      setTransactions(txData);
      setCarts(cartsData);
    } catch (err) {
      console.error(err);
      setError(
        'Unable to load data. Make sure the backend API is running (e.g. /api on Vercel or set VITE_API_BASE for local).',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNumber = Number(txAmount);
    if (!amountNumber || Number.isNaN(amountNumber) || amountNumber <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: txDate || todayIso(),
          type: txType,
          amount: amountNumber,
          description: txDescription.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to add transaction');
      }

      setTxAmount('');
      setTxDescription('');
      setTxDate(todayIso());

      await fetchAll();
    } catch (err: any) {
      setError(err.message || 'Failed to add transaction');
    }
  }

  async function handleAddCart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const costNumber = Number(cartCost);
    if (!cartItemName.trim() || !costNumber || costNumber <= 0) {
      setError('Please enter item name and a valid cost.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/carts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: cartItemName.trim(),
          store: cartStore.trim() || null,
          cost: costNumber,
          notes: cartNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to add cart item');
      }

      setCartItemName('');
      setCartStore('');
      setCartCost('');
      setCartNotes('');

      await fetchAll();
    } catch (err: any) {
      setError(err.message || 'Failed to add cart item');
    }
  }

  async function handleRemoveCart(id: number) {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/carts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to remove cart item');
      }
      await fetchAll();
    } catch (err: any) {
      setError(err.message || 'Failed to remove cart item');
    }
  }

  async function handleBuyCart(id: number) {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/carts/${id}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayIso() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to buy item');
      }
      await fetchAll();
    } catch (err: any) {
      setError(err.message || 'Failed to buy item');
    }
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>My Money Dashboard</h1>
        <p className="subtitle">
          Track your daily expenses and maintain a personal cart of things to
          buy later.
        </p>
      </header>

      <main>
        <section className="cards-section">
          <div className="summary-card">
            <h2>Daily Expense</h2>
            <p className="card-caption">Current month in rupees</p>
            <div className="summary-values">
              <div>
                <span className="summary-label">Income</span>
                <span className="summary-number">
                  {summary ? formatCurrency(summary.income) : '—'}
                </span>
              </div>
              <div>
                <span className="summary-label">Expenses</span>
                <span className="summary-number negative">
                  {summary ? formatCurrency(summary.expense) : '—'}
                </span>
              </div>
              <div>
                <span className="summary-label">Left this month</span>
                <span
                  className={`summary-number ${
                    summary && summary.remaining < 0 ? 'negative' : 'positive'
                  }`}
                >
                  {summary ? formatCurrency(summary.remaining) : '—'}
                </span>
              </div>
            </div>
            <a href="#daily-expense" className="card-link">
              Go to Daily Expense ↓
            </a>
          </div>

          <div className="summary-card">
            <h2>Carts</h2>
            <p className="card-caption">Personal wishlist / to-buy list</p>
            <div className="summary-values">
              <div>
                <span className="summary-label">Items</span>
                <span className="summary-number">{carts.length}</span>
              </div>
              <div>
                <span className="summary-label">Total planned</span>
                <span className="summary-number">
                  {formatCurrency(cartsTotal)}
                </span>
              </div>
            </div>
            <a href="#carts" className="card-link">
              Go to Carts ↓
            </a>
          </div>
        </section>

        {loading && <div className="banner info">Loading data…</div>}
        {error && <div className="banner error">{error}</div>}

        <section id="daily-expense" className="panel">
          <div className="panel-header">
            <h2>Daily Expense</h2>
            {summary && (
              <span className="panel-period">
                Current month: {summary.monthStart} → {summary.monthEnd}
              </span>
            )}
          </div>

          <div className="panel-banner">
            <div>
              <span className="banner-label">Income</span>
              <span className="banner-value">
                {summary ? formatCurrency(summary.income) : '—'}
              </span>
            </div>
            <div>
              <span className="banner-label">Expenses</span>
              <span className="banner-value negative">
                {summary ? formatCurrency(summary.expense) : '—'}
              </span>
            </div>
            <div>
              <span className="banner-label">Left this month</span>
              <span
                className={`banner-value ${
                  summary && summary.remaining < 0 ? 'negative' : 'positive'
                }`}
              >
                {summary ? formatCurrency(summary.remaining) : '—'}
              </span>
            </div>
          </div>

          <div className="panel-content two-column">
            <form className="card form-card" onSubmit={handleAddTransaction}>
              <h3>Add income / expense</h3>
              <div className="form-row">
                <label>
                  Type
                  <select
                    value={txType}
                    onChange={(e) =>
                      setTxType(e.target.value as TransactionType)
                    }
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Amount (₹)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Date
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Description
                  <input
                    type="text"
                    placeholder="Salary, groceries, rent, etc."
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                  />
                </label>
              </div>
              <button type="submit" className="primary-btn">
                Save transaction
              </button>
            </form>

            <div className="card table-card">
              <h3>Transactions</h3>
              {transactions.length === 0 ? (
                <p className="empty-text">
                  No transactions yet. Add your first income or expense.
                </p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th className="numeric">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.date}</td>
                          <td className={tx.type === 'expense' ? 'negative' : ''}>
                            {tx.type === 'income' ? 'Income' : 'Expense'}
                          </td>
                          <td>{tx.description || '-'}</td>
                          <td className="numeric">
                            {formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="carts" className="panel">
          <div className="panel-header">
            <h2>Carts</h2>
            <span className="panel-period">
              Wishlist items you plan to buy later.
            </span>
          </div>

          <div className="panel-content two-column">
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
                  No items in your cart yet. Add something you want to buy in
                  future.
                </p>
              ) : (
                <>
                  <div className="cart-summary-row">
                    <span>Total planned spend</span>
                    <span className="summary-number">
                      {formatCurrency(cartsTotal)}
                    </span>
                  </div>
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
                            <td className="numeric">
                              {formatCurrency(item.cost)}
                            </td>
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
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
