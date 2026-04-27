import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Transactions from '../components/Transactions';
import Stocks from '../components/Stocks';
import Carts from '../components/Carts';
import JournalEditor from '../components/JournalEditor';
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

type DashTab = 'transactions' | 'stocks' | 'cart' | 'journal';

const TABS: { id: DashTab; label: string;}[] = [
  { id: 'transactions', label: 'Transactions'},
  { id: 'stocks', label: 'Stocks' },
  { id: 'cart', label: 'Cart' },
  { id: 'journal', label: 'Journal'},
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
  user_id,
});

const emptyCart = (user_id?: number): CartItemCreate => ({
  stock_item: '',
  store_name: '',
  cost: 0,
  description: '',
  user_id,
});

const inputCls = 'mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500';
const btnCancel = 'rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200';
const btnPrimary = 'rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700';

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
    try {
      const [txs, stks, crts] = await Promise.all([
        getUserTransactions(user.user_id),
        getUserStocks(user.user_id),
        getUserCarts(user.user_id),
      ]);
      setTransactions(txs);
      setStocks(stks);
      setCarts(crts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTx() {
    if (!user) return;
    try {
      await createTransaction({ ...txForm, user_id: user.user_id });
      setShowTxModal(false);
      setTxForm(emptyTransaction(user.user_id));
      fetchData();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to add transaction'); }
  }

  async function handleAddStock() {
    if (!user) return;
    try {
      await createStock({ ...stockForm, user_id: user.user_id });
      setShowStockModal(false);
      setStockForm(emptyStock(user.user_id));
      fetchData();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to add stock'); }
  }

  async function handleAddCart() {
    if (!user) return;
    try {
      await createCart({ ...cartForm, user_id: user.user_id });
      setShowCartModal(false);
      setCartForm(emptyCart(user.user_id));
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
    setEditStockForm({ stock_item: stock.stock_item, quantity: stock.quantity || '' });
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
    journal: '',
  };

  function openAddModal() {
    if (activeTab === 'transactions') setShowTxModal(true);
    else if (activeTab === 'stocks') setShowStockModal(true);
    else if (activeTab === 'cart') setShowCartModal(true);
  }

  return (
    <div className="w-full">
      <header className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight">MyDash</h1>
        <p className="text-slate-500 mt-1">Manage your personal transactions, stocks, cart, and journal.</p>
      </header>

      {loading && <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">Loading…</div>}
      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Tab bar */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? tab.id === 'journal'
                  ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'journal' ? (
        user && <JournalEditor userId={user.user_id} />
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
      )}

      {/* Add Modals */}
      {showTxModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Add Transaction</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddTx(); }} className="space-y-4">
              <label className="block text-sm font-medium">Date<input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} className={inputCls} required /></label>
              <label className="block text-sm font-medium">Amount<input type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: parseFloat(e.target.value) })} className={inputCls} required /></label>
              <label className="block text-sm font-medium">Description<input type="text" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} className={inputCls} /></label>
              <label className="block text-sm font-medium">Type<select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value as 'income' | 'expense' })} className={inputCls}><option value="income">Income</option><option value="expense">Expense</option></select></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowTxModal(false)} className={btnCancel}>Cancel</button><button type="submit" className={btnPrimary}>Add</button></div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Add Stock</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddStock(); }} className="space-y-4">
              <label className="block text-sm font-medium">Item Name<input type="text" value={stockForm.stock_item} onChange={(e) => setStockForm({ ...stockForm, stock_item: e.target.value })} className={inputCls} required /></label>
              <label className="block text-sm font-medium">Quantity<input type="text" value={stockForm.quantity || ''} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} placeholder="e.g. 500g, 2 kg, 10 pcs" className={inputCls} /></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowStockModal(false)} className={btnCancel}>Cancel</button><button type="submit" className={btnPrimary}>Add</button></div>
            </form>
          </div>
        </div>
      )}

      {showCartModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Add Cart Item</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddCart(); }} className="space-y-4">
              <label className="block text-sm font-medium">Item Name<input type="text" value={cartForm.stock_item} onChange={(e) => setCartForm({ ...cartForm, stock_item: e.target.value })} className={inputCls} required /></label>
              <label className="block text-sm font-medium">Store<input type="text" value={cartForm.store_name || ''} onChange={(e) => setCartForm({ ...cartForm, store_name: e.target.value })} className={inputCls} /></label>
              <label className="block text-sm font-medium">Cost<input type="number" value={cartForm.cost} onChange={(e) => setCartForm({ ...cartForm, cost: parseFloat(e.target.value) })} className={inputCls} required /></label>
              <label className="block text-sm font-medium">Note<input type="text" value={cartForm.description || ''} onChange={(e) => setCartForm({ ...cartForm, description: e.target.value })} className={inputCls} /></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowCartModal(false)} className={btnCancel}>Cancel</button><button type="submit" className={btnPrimary}>Add</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modals */}
      {showEditTxModal && editingTx && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Edit Transaction</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateTx(); }} className="space-y-4">
              <label className="block text-sm font-medium">Date<input type="date" value={editTxForm.date} onChange={(e) => setEditTxForm({ ...editTxForm, date: e.target.value })} className={inputCls} required /></label>
              <label className="block text-sm font-medium">Amount<input type="number" value={editTxForm.amount} onChange={(e) => setEditTxForm({ ...editTxForm, amount: parseFloat(e.target.value) })} className={inputCls} required /></label>
              <label className="block text-sm font-medium">Description<input type="text" value={editTxForm.description} onChange={(e) => setEditTxForm({ ...editTxForm, description: e.target.value })} className={inputCls} /></label>
              <label className="block text-sm font-medium">Type<select value={editTxForm.type} onChange={(e) => setEditTxForm({ ...editTxForm, type: e.target.value as 'income' | 'expense' })} className={inputCls}><option value="income">Income</option><option value="expense">Expense</option></select></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => { setShowEditTxModal(false); setEditingTx(null); }} className={btnCancel}>Cancel</button><button type="submit" className={btnPrimary}>Save</button></div>
            </form>
          </div>
        </div>
      )}

      {showEditStockModal && editingStock && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Edit Stock</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateStock(); }} className="space-y-4">
              <label className="block text-sm font-medium">Item Name<input type="text" value={editStockForm.stock_item} onChange={(e) => setEditStockForm({ ...editStockForm, stock_item: e.target.value })} className={inputCls} required /></label>
              <label className="block text-sm font-medium">Quantity<input type="text" value={editStockForm.quantity || ''} onChange={(e) => setEditStockForm({ ...editStockForm, quantity: e.target.value })} placeholder="e.g. 500g, 2 kg, 10 pcs" className={inputCls} /></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => { setShowEditStockModal(false); setEditingStock(null); }} className={btnCancel}>Cancel</button><button type="submit" className={btnPrimary}>Save</button></div>
            </form>
          </div>
        </div>
      )}

      {showEditCartModal && editingCart && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Edit Cart Item</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateCart(); }} className="space-y-4">
              <label className="block text-sm font-medium">Item Name<input type="text" value={editCartForm.stock_item} onChange={(e) => setEditCartForm({ ...editCartForm, stock_item: e.target.value })} className={inputCls} required /></label>
              <label className="block text-sm font-medium">Store<input type="text" value={editCartForm.store_name || ''} onChange={(e) => setEditCartForm({ ...editCartForm, store_name: e.target.value })} className={inputCls} /></label>
              <label className="block text-sm font-medium">Cost<input type="number" value={editCartForm.cost} onChange={(e) => setEditCartForm({ ...editCartForm, cost: parseFloat(e.target.value) })} className={inputCls} required /></label>
              <label className="block text-sm font-medium">Note<input type="text" value={editCartForm.description || ''} onChange={(e) => setEditCartForm({ ...editCartForm, description: e.target.value })} className={inputCls} /></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => { setShowEditCartModal(false); setEditingCart(null); }} className={btnCancel}>Cancel</button><button type="submit" className={btnPrimary}>Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
