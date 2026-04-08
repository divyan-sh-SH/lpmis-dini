import API_BASE from '../apiConfig';
import type { CartItem, CartItemCreate, Summary, Transaction, TransactionCreate, TransactionType, User, UserCreate, Group, GroupCreate, Stock, StockCreate } from '../types/dashboard';

async function extractError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error || body?.detail || res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function fetchSummary(): Promise<Summary> {
  const res = await fetch(`${API_BASE}/summary`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/transactions`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function fetchCarts(): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/carts`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function addTransaction(input: {
  date: string;
  type: TransactionType;
  amount: number;
  description?: string | null;
}): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function addCart(input: {
  itemName: string;
  store?: string | null;
  cost: number;
  notes?: string | null;
}): Promise<CartItem> {
  const res = await fetch(`${API_BASE}/carts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function removeCart(cartId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/carts/${cartId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
}

export async function buyCart(input: { cartId: number; date: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/carts/${input.cartId}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: input.date }),
  });
  if (!res.ok) throw new Error(await extractError(res));
}

// User API functions
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
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function createUser(user: UserCreate): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

// Group API functions
export async function getGroupsForUser(user_id: number): Promise<Group[]> {
  const res = await fetch(`${API_BASE}/groups/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function createGroup(group: GroupCreate): Promise<Group> {
  const res = await fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

// Transaction API functions
export async function getUserTransactions(user_id: number): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/transactions/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function getGroupTransactions(group_id: string): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/transactions/group/${group_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function createTransaction(transaction: TransactionCreate): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateTransaction(transaction_id: number, transaction: Partial<TransactionCreate>): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions/${transaction_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteTransaction(transaction_id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/transactions/${transaction_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
}

// Cart API functions
export async function getUserCarts(user_id: number): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/carts/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function getGroupCarts(group_id: string): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/carts/group/${group_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function createCart(cart: CartItemCreate): Promise<CartItem> {
  const res = await fetch(`${API_BASE}/carts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cart),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateCart(cart_id: number, cart: Partial<CartItemCreate>): Promise<CartItem> {
  const res = await fetch(`${API_BASE}/carts/${cart_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cart),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteCart(cart_id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/carts/${cart_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
}

// Stock API functions
export async function getUserStocks(user_id: number): Promise<Stock[]> {
  const res = await fetch(`${API_BASE}/stocks/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function getGroupStocks(group_id: string): Promise<Stock[]> {
  const res = await fetch(`${API_BASE}/stocks/group/${group_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function createStock(stock: StockCreate): Promise<Stock> {
  const res = await fetch(`${API_BASE}/stocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stock),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateStock(stock_id: number, stock: Partial<StockCreate>): Promise<Stock> {
  const res = await fetch(`${API_BASE}/stocks/${stock_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stock),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteStock(stock_id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/stocks/${stock_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
}

