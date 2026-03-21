import { useEffect, useState } from 'react';
import { addTransaction, fetchSummary, fetchTransactions } from '../lib/moneyApi';
import type { Summary, Transaction, TransactionType } from '../types/dashboard';

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

export default function ExpensePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(todayIso());

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, txData] = await Promise.all([
        fetchSummary(),
        fetchTransactions(),
      ]);
      setSummary(summaryData);
      setTransactions(txData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load expense data';
      setError(msg);
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
      await addTransaction({
        date: txDate || todayIso(),
        type: txType,
        amount: amountNumber,
        description: txDescription.trim() || null,
      });
      setTxAmount('');
      setTxDescription('');
      setTxDate(todayIso());
      await fetchAll();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add transaction';
      setError(msg);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Daily Expense</h2>
        {summary && (
          <span className="panel-period">
            Current month: {summary.monthStart} → {summary.monthEnd}
          </span>
        )}
      </div>

      {loading && <div className="banner info">Loading data…</div>}
      {error && <div className="banner error">{error}</div>}

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

      <section className="panel-content two-column">
        <form className="card form-card" onSubmit={handleAddTransaction}>
          <h3>Add income / expense</h3>
          <div className="form-row">
            <label>
              Type
              <select value={txType} onChange={(e) => setTxType(e.target.value as TransactionType)}>
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
              <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} required />
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
            <p className="empty-text">No transactions yet. Add your first income or expense.</p>
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
                      <td className="numeric">{formatCurrency(tx.amount)}</td>
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

