import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCarts, fetchSummary } from '../lib/moneyApi';
import type { CartItem, Summary } from '../types/dashboard';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function HomePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [carts, setCarts] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartsTotal = useMemo(
    () => carts.reduce((sum, c) => sum + c.cost, 0),
    [carts],
  );

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, cartsData] = await Promise.all([
        fetchSummary(),
        fetchCarts(),
      ]);
      setSummary(summaryData);
      setCarts(cartsData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load dashboard data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>HomeDash</h1>
        <p className="subtitle">
          Track your daily expenses and maintain a personal cart of things to
          buy later.
        </p>
      </header>

      {loading && <div className="banner info">Loading data…</div>}
      {error && <div className="banner error">{error}</div>}

      <main>
        <section className="cards-section">
          <Link to="/expense" className="card-link-wrap" aria-label="Go to Daily Expense">
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
              <div className="card-action">Open →</div>
            </div>
          </Link>

          <Link to="/carts" className="card-link-wrap" aria-label="Go to Carts">
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
                <div>
                  <span className="summary-label">Next step</span>
                  <span className="summary-number positive">Buy later</span>
                </div>
              </div>
              <div className="card-action">Open →</div>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}

