import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Transactions from '../components/Transactions';
import Stocks from '../components/Stocks';
import Carts from '../components/Carts';
import {
  getUserTransactions,
  getUserStocks,
  getUserCarts,
  createTransaction,
  createStock,
  createCart,
  updateTransaction,
  deleteTransaction,
  updateStock,
  deleteStock,
  updateCart,
  deleteCart,
} from '../lib/moneyApi';
import type { Transaction, Stock, CartItem, TransactionCreate, StockCreate, CartItemCreate } from '../types/dashboard';

const createEmptyTransaction = (user_id?: number): TransactionCreate => ({
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  description: '',
  type: 'expense',
  user_id,
});

const createEmptyStock = (user_id?: number): StockCreate => ({
  stock_item: '',
  quantity: 0,
  user_id,
});

const createEmptyCart = (user_id?: number): CartItemCreate => ({
  item_name: '',
  store: '',
  cost: 0,
  note: '',
  user_id,
});

export default function PersonalPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [carts, setCarts] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedUserIdRef = useRef<number | null>(null);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [showEditCartModal, setShowEditCartModal] = useState(false);

  const [transactionForm, setTransactionForm] = useState<TransactionCreate>(createEmptyTransaction(user?.user_id));
  const [stockForm, setStockForm] = useState<StockCreate>(createEmptyStock(user?.user_id));
  const [cartForm, setCartForm] = useState<CartItemCreate>(createEmptyCart(user?.user_id));

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [editingCart, setEditingCart] = useState<CartItem | null>(null);

  const [editTransactionForm, setEditTransactionForm] = useState<TransactionCreate>(createEmptyTransaction());
  const [editStockForm, setEditStockForm] = useState<StockCreate>(createEmptyStock());
  const [editCartForm, setEditCartForm] = useState<CartItemCreate>(createEmptyCart());

  useEffect(() => {
    if (!user) {
      fetchedUserIdRef.current = null;
      setTransactionForm(createEmptyTransaction());
      setStockForm(createEmptyStock());
      setCartForm(createEmptyCart());
      return;
    }

    setTransactionForm(createEmptyTransaction(user.user_id));
    setStockForm(createEmptyStock(user.user_id));
    setCartForm(createEmptyCart(user.user_id));

    if (fetchedUserIdRef.current === user.user_id) {
      return;
    }

    fetchedUserIdRef.current = user.user_id;
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [transactionsData, stocksData, cartsData] = await Promise.all([
        getUserTransactions(user.user_id),
        getUserStocks(user.user_id),
        getUserCarts(user.user_id),
      ]);
      setTransactions(transactionsData);
      setStocks(stocksData);
      setCarts(cartsData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTransaction() {
    if (!user) return;
    try {
      await createTransaction({ ...transactionForm, user_id: user.user_id });
      setShowTransactionModal(false);
      setTransactionForm(createEmptyTransaction(user.user_id));
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add transaction';
      setError(msg);
    }
  }

  async function handleAddStock() {
    if (!user) return;
    try {
      await createStock({ ...stockForm, user_id: user.user_id });
      setShowStockModal(false);
      setStockForm(createEmptyStock(user.user_id));
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add stock';
      setError(msg);
    }
  }

  async function handleAddCart() {
    if (!user) return;
    try {
      await createCart({ ...cartForm, user_id: user.user_id });
      setShowCartModal(false);
      setCartForm(createEmptyCart(user.user_id));
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add cart item';
      setError(msg);
    }
  }

  function openEditTransaction(transaction: Transaction) {
    setEditingTransaction(transaction);
    setEditTransactionForm({
      date: transaction.date,
      amount: transaction.amount,
      description: transaction.description || '',
      type: transaction.type,
    });
    setShowEditTransactionModal(true);
  }

  async function handleUpdateTransaction() {
    if (!editingTransaction) return;
    try {
      await updateTransaction(editingTransaction.id, editTransactionForm);
      setShowEditTransactionModal(false);
      setEditingTransaction(null);
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update transaction';
      setError(msg);
    }
  }

  async function handleDeleteTransaction(transactionId: number) {
    try {
      await deleteTransaction(transactionId);
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete transaction';
      setError(msg);
    }
  }

  function openEditStock(stock: Stock) {
    setEditingStock(stock);
    setEditStockForm({ stock_item: stock.stock_item, quantity: stock.quantity });
    setShowEditStockModal(true);
  }

  async function handleUpdateStock() {
    if (!editingStock) return;
    try {
      await updateStock(editingStock.id, editStockForm);
      setShowEditStockModal(false);
      setEditingStock(null);
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update stock';
      setError(msg);
    }
  }

  async function handleDeleteStock(stockId: number) {
    try {
      await deleteStock(stockId);
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete stock';
      setError(msg);
    }
  }

  function openEditCart(cart: CartItem) {
    setEditingCart(cart);
    setEditCartForm({
      item_name: cart.itemName,
      store: cart.store || '',
      cost: cart.cost,
      note: cart.notes || '',
    });
    setShowEditCartModal(true);
  }

  async function handleUpdateCart() {
    if (!editingCart) return;
    try {
      await updateCart(editingCart.id, editCartForm);
      setShowEditCartModal(false);
      setEditingCart(null);
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update cart item';
      setError(msg);
    }
  }

  async function handleDeleteCart(cartId: number) {
    try {
      await deleteCart(cartId);
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete cart item';
      setError(msg);
    }
  }

  return (
    <div className="w-full">
      <header className="mb-5">
        <h1 className="text-4xl font-bold tracking-tight mb-2">My Dashboard</h1>
        <p className="text-slate-500">Manage your personal transactions, stocks, and carts.</p>
      </header>

      {loading && <div className="p-3 rounded-lg bg-blue-100 text-blue-800">Loading data…</div>}
      {error && <div className="p-3 rounded-lg bg-red-100 text-red-800">{error}</div>}

      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">My Transactions</h2>
              <p className="text-sm text-slate-500">Track every income and expense in one place.</p>
            </div>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add Transaction
            </button>
          </div>
          <Transactions transactions={transactions} onEdit={openEditTransaction} onDelete={handleDeleteTransaction} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">My Stocks</h2>
              <p className="text-sm text-slate-500">Manage your stock items and quantities easily.</p>
            </div>
            <button
              onClick={() => setShowStockModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add Stock
            </button>
          </div>
          <Stocks stocks={stocks} onEdit={openEditStock} onDelete={handleDeleteStock} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">My Carts</h2>
              <p className="text-sm text-slate-500">Keep cart items organized with notes and stores.</p>
            </div>
            <button
              onClick={() => setShowCartModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add Cart Item
            </button>
          </div>
          <Carts carts={carts} onEdit={openEditCart} onDelete={handleDeleteCart} />
        </section>

        {showTransactionModal && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-4">Add Transaction</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleAddTransaction(); }}>
                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Date
                    <input
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Amount
                    <input
                      type="number"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: parseFloat(e.target.value) })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Description
                    <input
                      type="text"
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Type
                    <select
                      value={transactionForm.type}
                      onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value as 'income' | 'expense' })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(false)}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showStockModal && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-4">Add Stock</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleAddStock(); }}>
                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Item Name
                    <input
                      type="text"
                      value={stockForm.stock_item}
                      onChange={(e) => setStockForm({ ...stockForm, stock_item: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Quantity
                    <input
                      type="number"
                      value={stockForm.quantity}
                      onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCartModal && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-4">Add Cart Item</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleAddCart(); }}>
                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Item Name
                    <input
                      type="text"
                      value={cartForm.item_name}
                      onChange={(e) => setCartForm({ ...cartForm, item_name: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Store
                    <input
                      type="text"
                      value={cartForm.store}
                      onChange={(e) => setCartForm({ ...cartForm, store: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Cost
                    <input
                      type="number"
                      value={cartForm.cost}
                      onChange={(e) => setCartForm({ ...cartForm, cost: parseFloat(e.target.value) })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Note
                    <input
                      type="text"
                      value={cartForm.note}
                      onChange={(e) => setCartForm({ ...cartForm, note: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCartModal(false)}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditTransactionModal && editingTransaction && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-4">Edit Transaction</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateTransaction(); }}>
                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Date
                    <input
                      type="date"
                      value={editTransactionForm.date}
                      onChange={(e) => setEditTransactionForm({ ...editTransactionForm, date: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Amount
                    <input
                      type="number"
                      value={editTransactionForm.amount}
                      onChange={(e) => setEditTransactionForm({ ...editTransactionForm, amount: parseFloat(e.target.value) })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Description
                    <input
                      type="text"
                      value={editTransactionForm.description}
                      onChange={(e) => setEditTransactionForm({ ...editTransactionForm, description: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Type
                    <select
                      value={editTransactionForm.type}
                      onChange={(e) => setEditTransactionForm({ ...editTransactionForm, type: e.target.value as 'income' | 'expense' })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowEditTransactionModal(false); setEditingTransaction(null); }}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditStockModal && editingStock && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-4">Edit Stock</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateStock(); }}>
                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Item Name
                    <input
                      type="text"
                      value={editStockForm.stock_item}
                      onChange={(e) => setEditStockForm({ ...editStockForm, stock_item: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Quantity
                    <input
                      type="number"
                      value={editStockForm.quantity}
                      onChange={(e) => setEditStockForm({ ...editStockForm, quantity: parseInt(e.target.value) })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowEditStockModal(false); setEditingStock(null); }}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditCartModal && editingCart && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-4">Edit Cart Item</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateCart(); }}>
                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Item Name
                    <input
                      type="text"
                      value={editCartForm.item_name}
                      onChange={(e) => setEditCartForm({ ...editCartForm, item_name: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Store
                    <input
                      type="text"
                      value={editCartForm.store}
                      onChange={(e) => setEditCartForm({ ...editCartForm, store: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Cost
                    <input
                      type="number"
                      value={editCartForm.cost}
                      onChange={(e) => setEditCartForm({ ...editCartForm, cost: parseFloat(e.target.value) })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Note
                    <input
                      type="text"
                      value={editCartForm.note}
                      onChange={(e) => setEditCartForm({ ...editCartForm, note: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowEditCartModal(false); setEditingCart(null); }}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
