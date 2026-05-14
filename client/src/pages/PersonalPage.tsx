import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Transactions from '../components/Transactions';
import Stocks from '../components/Stocks';
import Carts from '../components/Carts';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import NoteAltRoundedIcon from '@mui/icons-material/NoteAltRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
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

type DashTab = 'transactions' | 'stocks' | 'cart';

const TABS: { id: DashTab; label: string; icon: React.ReactNode }[] = [
  { id: 'transactions', label: 'Transactions', icon: <SwapVertRoundedIcon sx={{ fontSize: 16 }} /> },
  { id: 'stocks', label: 'Stocks', icon: <InventoryRoundedIcon sx={{ fontSize: 16 }} /> },
  { id: 'cart', label: 'Cart', icon: <ShoppingCartRoundedIcon sx={{ fontSize: 16 }} /> },
];

const emptyTransaction = (user_id?: number): TransactionCreate => ({
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  description: '',
  type: 'expense',
  user_id,
});

const emptyStock = (user_id?: number): StockCreate => ({
  stock_item: '',
  quantity: '',
  category: '',
  user_id,
});

const emptyCart = (user_id?: number): CartItemCreate => ({
  stock_item: '',
  store_name: '',
  cost: 0,
  description: '',
  user_id,
});

const fieldCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition';
const fieldLabel = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5';

export default function PersonalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashTab>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [carts, setCarts] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<number | null>(null);

  const [showTxModal, setShowTxModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [showEditCartModal, setShowEditCartModal] = useState(false);

  const [txForm, setTxForm] = useState<TransactionCreate>(emptyTransaction(user?.user_id));
  const [stockForm, setStockForm] = useState<StockCreate>(emptyStock(user?.user_id));
  const [cartForm, setCartForm] = useState<CartItemCreate>(emptyCart(user?.user_id));

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [editingCart, setEditingCart] = useState<CartItem | null>(null);
  const [editTxForm, setEditTxForm] = useState<TransactionCreate>(emptyTransaction());
  const [editStockForm, setEditStockForm] = useState<StockCreate>(emptyStock());
  const [editCartForm, setEditCartForm] = useState<CartItemCreate>(emptyCart());

  // Multi-entry success flash state
  const [txAdded, setTxAdded] = useState(false);
  const [stockAdded, setStockAdded] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    if (!user) { fetchedRef.current = null; return; }
    setTxForm(emptyTransaction(user.user_id));
    setStockForm(emptyStock(user.user_id));
    setCartForm(emptyCart(user.user_id));
    if (fetchedRef.current === user.user_id) return;
    fetchedRef.current = user.user_id;
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    setError(null);
    const [txResult, stksResult, crtsResult] = await Promise.allSettled([
      getUserTransactions(user.user_id),
      getUserStocks(user.user_id),
      getUserCarts(user.user_id),
    ]);
    if (txResult.status === 'fulfilled') setTransactions(txResult.value);
    if (stksResult.status === 'fulfilled') setStocks(stksResult.value);
    if (crtsResult.status === 'fulfilled') setCarts(crtsResult.value);
    const failed = [
      txResult.status === 'rejected' && 'transactions',
      stksResult.status === 'rejected' && 'stocks',
      crtsResult.status === 'rejected' && 'cart',
    ].filter(Boolean);
    if (failed.length) setError(`Failed to load: ${failed.join(', ')}`);
    setLoading(false);
  }

  async function handleAddTx() {
    if (!user) return;
    try {
      await createTransaction({ ...txForm, user_id: user.user_id });
      setTxForm(emptyTransaction(user.user_id));
      setTxAdded(true);
      setTimeout(() => setTxAdded(false), 2500);
      fetchData();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to add transaction'); }
  }

  async function handleAddStock() {
    if (!user) return;
    try {
      await createStock({ ...stockForm, user_id: user.user_id });
      setStockForm(emptyStock(user.user_id));
      setStockAdded(true);
      setTimeout(() => setStockAdded(false), 2500);
      fetchData();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to add stock'); }
  }

  async function handleAddCart() {
    if (!user) return;
    try {
      await createCart({ ...cartForm, user_id: user.user_id });
      setCartForm(emptyCart(user.user_id));
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2500);
      fetchData();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to add cart item'); }
  }

  function openEditTx(tx: Transaction) {
    setEditingTx(tx);
    setEditTxForm({ date: tx.date.substring(0, 10), amount: tx.amount, description: tx.description || '', type: tx.type });
    setShowEditTxModal(true);
  }

  async function handleUpdateTx() {
    if (!editingTx) return;
    try {
      await updateTransaction(editingTx.transaction_id, editTxForm);
      setShowEditTxModal(false); setEditingTx(null); fetchData();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to update transaction'); }
  }

  async function handleDeleteTx(id: string) {
    try { await deleteTransaction(id); fetchData(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to delete transaction'); }
  }

  function openEditStock(stock: Stock) {
    setEditingStock(stock);
    setEditStockForm({ stock_item: stock.stock_item, quantity: stock.quantity || '', category: stock.category || '' });
    setShowEditStockModal(true);
  }

  async function handleUpdateStock() {
    if (!editingStock) return;
    try {
      await updateStock(editingStock.stock_id, editStockForm);
      setShowEditStockModal(false); setEditingStock(null); fetchData();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to update stock'); }
  }

  async function handleDeleteStock(id: string) {
    try { await deleteStock(id); fetchData(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to delete stock'); }
  }

  function openEditCart(cart: CartItem) {
    setEditingCart(cart);
    setEditCartForm({ stock_item: cart.stock_item, store_name: cart.store_name || '', cost: cart.cost, description: cart.description || '' });
    setShowEditCartModal(true);
  }

  async function handleUpdateCart() {
    if (!editingCart) return;
    try {
      await updateCart(editingCart.cart_id, editCartForm);
      setShowEditCartModal(false); setEditingCart(null); fetchData();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to update cart item'); }
  }

  async function handleDeleteCart(id: string) {
    try { await deleteCart(id); fetchData(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to delete cart item'); }
  }

  const addLabel: Record<DashTab, string> = {
    transactions: '+ Add Transaction',
    stocks: '+ Add Stock',
    cart: '+ Add Cart Item',
  };

  function openAddModal() {
    if (activeTab === 'transactions') { setTxAdded(false); setShowTxModal(true); }
    else if (activeTab === 'stocks') { setStockAdded(false); setShowStockModal(true); }
    else if (activeTab === 'cart') { setCartAdded(false); setShowCartModal(true); }
  }

  return (
    <div className="w-full">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user?.username || 'MyDash'}</h1>
        </div>
        <Link
          to="/personal/notes"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-indigo-700"
        >
          <NoteAltRoundedIcon sx={{ fontSize: 18 }} /> Notes
        </Link>
      </header>

      {loading && <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">Loading…</div>}
      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Tab bar */}
      <div className="flex rounded-t-xl bg-slate-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <section className="rounded-b-3xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold capitalize">
              {activeTab === 'cart' ? 'Cart' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-xs text-slate-500">
              {activeTab === 'transactions' && 'Track income and expenses.'}
              {activeTab === 'stocks' && 'Manage inventory items and quantities.'}
              {activeTab === 'cart' && 'Keep shopping items organised.'}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="self-start sm:self-auto inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            {addLabel[activeTab]}
          </button>
        </div>

        {activeTab === 'transactions' && <Transactions transactions={transactions} onEdit={openEditTx} onDelete={handleDeleteTx} />}
        {activeTab === 'stocks' && <Stocks stocks={stocks} onEdit={openEditStock} onDelete={handleDeleteStock} />}
        {activeTab === 'cart' && <Carts carts={carts} onEdit={openEditCart} onDelete={handleDeleteCart} />}
      </section>

      {/* ── Add Transaction Modal ── */}
      {showTxModal && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <SwapVertRoundedIcon sx={{ fontSize: 18 }} />
                </div>
                <span className="text-base font-bold text-slate-900">Add Transaction</span>
              </div>
              <button onClick={() => setShowTxModal(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition">
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            {txAdded && (
              <div className="mx-5 mb-2 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
                <CheckCircleRoundedIcon sx={{ fontSize: 15 }} className="text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">Added! Fill another or tap Done.</span>
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleAddTx(); }} className="px-5 pb-5 space-y-3">
              <div>
                <label className={fieldLabel}>Date</label>
                <input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} className={fieldCls} required />
              </div>
              <div>
                <label className={fieldLabel}>Amount (Rs.)</label>
                <input type="number" step="0.01" min="0" value={txForm.amount || ''} onChange={(e) => setTxForm({ ...txForm, amount: parseFloat(e.target.value) || 0 })} className={fieldCls} placeholder="0.00" required />
              </div>
              <div>
                <label className={fieldLabel}>Description</label>
                <input type="text" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} className={fieldCls} placeholder="e.g. Salary, Grocery…" />
              </div>
              <div>
                <label className={fieldLabel}>Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setTxForm({ ...txForm, type: 'income' })}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${txForm.type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    Income
                  </button>
                  <button type="button" onClick={() => setTxForm({ ...txForm, type: 'expense' })}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${txForm.type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    Expense
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowTxModal(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Done</button>
                <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Stock Modal ── */}
      {showStockModal && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <InventoryRoundedIcon sx={{ fontSize: 18 }} />
                </div>
                <span className="text-base font-bold text-slate-900">Add Stock Item</span>
              </div>
              <button onClick={() => setShowStockModal(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition">
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            {stockAdded && (
              <div className="mx-5 mb-2 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
                <CheckCircleRoundedIcon sx={{ fontSize: 15 }} className="text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">Added! Fill another or tap Done.</span>
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleAddStock(); }} className="px-5 pb-5 space-y-3">
              <div>
                <label className={fieldLabel}>Item Name</label>
                <input type="text" value={stockForm.stock_item} onChange={(e) => setStockForm({ ...stockForm, stock_item: e.target.value })} className={fieldCls} placeholder="e.g. Rice, Milk…" required />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={fieldLabel}>Quantity</label>
                  <input type="text" value={stockForm.quantity || ''} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} className={fieldCls} placeholder="e.g. 500g, 2 kg" />
                </div>
                <div className="flex-1">
                  <label className={fieldLabel}>Category <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                  <input type="text" value={stockForm.category || ''} onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })} className={fieldCls} placeholder="e.g. Dairy, Grains…" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowStockModal(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Done</button>
                <button type="submit" className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Cart Modal ── */}
      {showCartModal && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShoppingCartRoundedIcon sx={{ fontSize: 18 }} />
                </div>
                <span className="text-base font-bold text-slate-900">Add Cart Item</span>
              </div>
              <button onClick={() => setShowCartModal(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition">
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            {cartAdded && (
              <div className="mx-5 mb-2 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
                <CheckCircleRoundedIcon sx={{ fontSize: 15 }} className="text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">Added! Fill another or tap Done.</span>
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleAddCart(); }} className="px-5 pb-5 space-y-3">
              <div>
                <label className={fieldLabel}>Item Name</label>
                <input type="text" value={cartForm.stock_item} onChange={(e) => setCartForm({ ...cartForm, stock_item: e.target.value })} className={fieldCls} placeholder="e.g. Eggs, Bread…" required />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={fieldLabel}>Store</label>
                  <input type="text" value={cartForm.store_name || ''} onChange={(e) => setCartForm({ ...cartForm, store_name: e.target.value })} className={fieldCls} placeholder="e.g. DMart" />
                </div>
                <div className="w-32">
                  <label className={fieldLabel}>Cost (Rs.)</label>
                  <input type="number" step="0.01" min="0" value={cartForm.cost || ''} onChange={(e) => setCartForm({ ...cartForm, cost: parseFloat(e.target.value) || 0 })} className={fieldCls} placeholder="0" required />
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Note</label>
                <input type="text" value={cartForm.description || ''} onChange={(e) => setCartForm({ ...cartForm, description: e.target.value })} className={fieldCls} placeholder="Optional note…" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCartModal(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Done</button>
                <button type="submit" className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Transaction Modal ── */}
      {showEditTxModal && editingTx && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <SwapVertRoundedIcon sx={{ fontSize: 18 }} />
                </div>
                <span className="text-base font-bold text-slate-900">Edit Transaction</span>
              </div>
              <button onClick={() => { setShowEditTxModal(false); setEditingTx(null); }} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition">
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateTx(); }} className="px-5 pb-5 space-y-3">
              <div>
                <label className={fieldLabel}>Date</label>
                <input type="date" value={editTxForm.date} onChange={(e) => setEditTxForm({ ...editTxForm, date: e.target.value })} className={fieldCls} required />
              </div>
              <div>
                <label className={fieldLabel}>Amount (Rs.)</label>
                <input type="number" step="0.01" min="0" value={editTxForm.amount || ''} onChange={(e) => setEditTxForm({ ...editTxForm, amount: parseFloat(e.target.value) || 0 })} className={fieldCls} required />
              </div>
              <div>
                <label className={fieldLabel}>Description</label>
                <input type="text" value={editTxForm.description} onChange={(e) => setEditTxForm({ ...editTxForm, description: e.target.value })} className={fieldCls} />
              </div>
              <div>
                <label className={fieldLabel}>Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditTxForm({ ...editTxForm, type: 'income' })}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${editTxForm.type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    Income
                  </button>
                  <button type="button" onClick={() => setEditTxForm({ ...editTxForm, type: 'expense' })}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${editTxForm.type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    Expense
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowEditTxModal(false); setEditingTx(null); }} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Stock Modal ── */}
      {showEditStockModal && editingStock && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <InventoryRoundedIcon sx={{ fontSize: 18 }} />
                </div>
                <span className="text-base font-bold text-slate-900">Edit Stock Item</span>
              </div>
              <button onClick={() => { setShowEditStockModal(false); setEditingStock(null); }} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition">
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateStock(); }} className="px-5 pb-5 space-y-3">
              <div>
                <label className={fieldLabel}>Item Name</label>
                <input type="text" value={editStockForm.stock_item} onChange={(e) => setEditStockForm({ ...editStockForm, stock_item: e.target.value })} className={fieldCls} required />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={fieldLabel}>Quantity</label>
                  <input type="text" value={editStockForm.quantity || ''} onChange={(e) => setEditStockForm({ ...editStockForm, quantity: e.target.value })} className={fieldCls} placeholder="e.g. 500g, 2 kg" />
                </div>
                <div className="flex-1">
                  <label className={fieldLabel}>Category <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                  <input type="text" value={editStockForm.category || ''} onChange={(e) => setEditStockForm({ ...editStockForm, category: e.target.value })} className={fieldCls} placeholder="e.g. Dairy, Grains…" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowEditStockModal(false); setEditingStock(null); }} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Cart Modal ── */}
      {showEditCartModal && editingCart && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShoppingCartRoundedIcon sx={{ fontSize: 18 }} />
                </div>
                <span className="text-base font-bold text-slate-900">Edit Cart Item</span>
              </div>
              <button onClick={() => { setShowEditCartModal(false); setEditingCart(null); }} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition">
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateCart(); }} className="px-5 pb-5 space-y-3">
              <div>
                <label className={fieldLabel}>Item Name</label>
                <input type="text" value={editCartForm.stock_item} onChange={(e) => setEditCartForm({ ...editCartForm, stock_item: e.target.value })} className={fieldCls} required />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={fieldLabel}>Store</label>
                  <input type="text" value={editCartForm.store_name || ''} onChange={(e) => setEditCartForm({ ...editCartForm, store_name: e.target.value })} className={fieldCls} />
                </div>
                <div className="w-32">
                  <label className={fieldLabel}>Cost (Rs.)</label>
                  <input type="number" step="0.01" min="0" value={editCartForm.cost || ''} onChange={(e) => setEditCartForm({ ...editCartForm, cost: parseFloat(e.target.value) || 0 })} className={fieldCls} required />
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Note</label>
                <input type="text" value={editCartForm.description || ''} onChange={(e) => setEditCartForm({ ...editCartForm, description: e.target.value })} className={fieldCls} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowEditCartModal(false); setEditingCart(null); }} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
