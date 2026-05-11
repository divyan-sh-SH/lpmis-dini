import API_BASE from '../apiConfig';
import { apiCache } from './cache';
import type {
  CartItem, CartItemCreate,
  Transaction, TransactionCreate,
  User, UserCreate,
  Group, GroupCreate,
  Stock, StockCreate,
  ChatMessage, AgentChatResponse,
  Journal, JournalCreate, JournalUpdate,
} from '../types/dashboard';

async function extractError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error || body?.detail || res.statusText;
  } catch {
    return res.statusText;
  }
}

// --- Auth ---

export async function validateUser(phone_number: string, otp: string): Promise<User> {
  const res = await fetch(`${API_BASE}/users/validate-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: parseInt(phone_number), otp: parseInt(otp) }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function getAllUsers(): Promise<User[]> {
  const key = 'users:all';
  const cached = apiCache.get<User[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function createUser(user: UserCreate): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('users');
  return res.json();
}

// --- Groups ---

export async function getGroupsForUser(user_id: number): Promise<Group[]> {
  const key = `groups:user:${user_id}`;
  const cached = apiCache.get<Group[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/groups/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function createGroup(group: GroupCreate): Promise<Group> {
  const res = await fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('groups');
  return res.json();
}

// --- Transactions ---

export async function getUserTransactions(user_id: number): Promise<Transaction[]> {
  const key = `transactions:user:${user_id}`;
  const cached = apiCache.get<Transaction[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/transactions/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getGroupTransactions(group_id: string): Promise<Transaction[]> {
  const key = `transactions:group:${group_id}`;
  const cached = apiCache.get<Transaction[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/transactions/group/${group_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function createTransaction(transaction: TransactionCreate): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('transactions');
  return res.json();
}

export async function updateTransaction(transaction_id: string, transaction: Partial<TransactionCreate>): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions/${transaction_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('transactions');
  return res.json();
}

export async function deleteTransaction(transaction_id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/transactions/${transaction_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
  apiCache.invalidate('transactions');
}

// --- Stocks ---

export async function getUserStocks(user_id: number): Promise<Stock[]> {
  const key = `stocks:user:${user_id}`;
  const cached = apiCache.get<Stock[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/stocks/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getGroupStocks(group_id: string): Promise<Stock[]> {
  const key = `stocks:group:${group_id}`;
  const cached = apiCache.get<Stock[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/stocks/group/${group_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function createStock(stock: StockCreate): Promise<Stock> {
  const res = await fetch(`${API_BASE}/stocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stock),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('stocks');
  return res.json();
}

export async function updateStock(stock_id: string, stock: Partial<StockCreate>): Promise<Stock> {
  const res = await fetch(`${API_BASE}/stocks/${stock_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stock),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('stocks');
  return res.json();
}

export async function deleteStock(stock_id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/stocks/${stock_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
  apiCache.invalidate('stocks');
}

// --- Carts ---

export async function getUserCarts(user_id: number): Promise<CartItem[]> {
  const key = `carts:user:${user_id}`;
  const cached = apiCache.get<CartItem[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/carts/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getGroupCarts(group_id: string): Promise<CartItem[]> {
  const key = `carts:group:${group_id}`;
  const cached = apiCache.get<CartItem[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/carts/group/${group_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function createCart(cart: CartItemCreate): Promise<CartItem> {
  const res = await fetch(`${API_BASE}/carts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cart),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('carts');
  return res.json();
}

export async function updateCart(cart_id: string, cart: Partial<CartItemCreate>): Promise<CartItem> {
  const res = await fetch(`${API_BASE}/carts/${cart_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cart),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('carts');
  return res.json();
}

export async function deleteCart(cart_id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/carts/${cart_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
  apiCache.invalidate('carts');
}

// --- Journal ---

export async function getJournalEntries(user_id: number): Promise<Journal[]> {
  const key = `journal:user:${user_id}`;
  const cached = apiCache.get<Journal[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/journal/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getJournalEntry(user_id: number, date: string): Promise<Journal | null> {
  const res = await fetch(`${API_BASE}/journal/user/${user_id}/date/${date}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function createJournalEntry(entry: JournalCreate): Promise<Journal> {
  const res = await fetch(`${API_BASE}/journal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('journal');
  return res.json();
}

export async function updateJournalEntry(journal_id: string, update: JournalUpdate): Promise<Journal> {
  const res = await fetch(`${API_BASE}/journal/${journal_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('journal');
  return res.json();
}

export async function deleteJournalEntry(journal_id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/journal/${journal_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
  apiCache.invalidate('journal');
}

export async function rewriteJournal(content: string, instruction: string): Promise<string> {
  const res = await fetch(`${API_BASE}/journal/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, instruction }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  return data.rewritten;
}

// --- HomieAgent Chat ---

export async function chatWithHomie(
  messages: ChatMessage[],
  user_id: number,
  available_groups: { group_id: string; group_name: string }[],
): Promise<AgentChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, user_id, available_groups }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}
