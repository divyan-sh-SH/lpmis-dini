import API_BASE from '../apiConfig';
import type { CartItem, Summary, Transaction, TransactionType } from '../types/dashboard';

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

async function extractError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error || body?.detail || res.statusText;
  } catch {
    return res.statusText;
  }
}

