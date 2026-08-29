import API_BASE from '../apiConfig';
import { apiCache } from './cache';
import type {
  CartItem, CartItemCreate,
  Transaction, TransactionCreate,
  User, UserCreate,
  Group, GroupCreate,
  Stock, StockCreate,
  ChatMessage, AgentChatResponse,
  Note, NoteCreate, NoteUpdate,
  Habit, HabitCreate, HabitUpdate,
  HabitLog, HabitLogUpsert,
  Todo, TodoCreate, TodoUpdate,
  CalendarEvent, CalendarEventCreate, CalendarEventUpdate,
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

// --- Notes ---

export async function getUserNotes(user_id: number): Promise<Note[]> {
  const key = `notes:user:${user_id}`;
  const cached = apiCache.get<Note[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/notes/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getGroupNotes(group_id: string): Promise<Note[]> {
  const key = `notes:group:${group_id}`;
  const cached = apiCache.get<Note[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/notes/group/${group_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function createNote(note: NoteCreate): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('notes');
  return res.json();
}

export async function updateNote(note_id: string, update: NoteUpdate): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes/${note_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('notes');
  return res.json();
}

export async function deleteNote(note_id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/${note_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
  apiCache.invalidate('notes');
}

export async function rewriteNote(content: string, instruction: string): Promise<string> {
  const res = await fetch(`${API_BASE}/notes/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, instruction }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  return data.rewritten;
}

// --- Habits ---

export async function getUserHabits(user_id: number): Promise<Habit[]> {
  const key = `habits:user:${user_id}`;
  const cached = apiCache.get<Habit[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/habits/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getAllUserHabits(user_id: number): Promise<Habit[]> {
  const key = `habits:user:${user_id}:all`;
  const cached = apiCache.get<Habit[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/habits/user/${user_id}/all`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getGroupHabits(group_id: string): Promise<Habit[]> {
  const key = `habits:group:${group_id}`;
  const cached = apiCache.get<Habit[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/habits/group/${group_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getAllGroupHabits(group_id: string): Promise<Habit[]> {
  const key = `habits:group:${group_id}:all`;
  const cached = apiCache.get<Habit[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/habits/group/${group_id}/all`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function createHabit(habit: HabitCreate): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habit),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('habits');
  return res.json();
}

export async function updateHabit(habit_id: string, update: HabitUpdate): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits/${habit_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('habits');
  return res.json();
}

export async function archiveHabit(habit_id: string): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits/${habit_id}/archive`, { method: 'PATCH' });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('habits');
  return res.json();
}

export async function deleteHabit(habit_id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/habits/${habit_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
  apiCache.invalidate('habits');
}

// --- Habit Logs ---

export async function getUserHabitLogsByDate(user_id: number, date: string): Promise<HabitLog[]> {
  const key = `habit-logs:user:${user_id}:date:${date}`;
  const cached = apiCache.get<HabitLog[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/habit-logs/user/${user_id}/date/${date}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getUserHabitLogsRange(user_id: number, start: string, end: string): Promise<HabitLog[]> {
  const key = `habit-logs:user:${user_id}:range:${start}:${end}`;
  const cached = apiCache.get<HabitLog[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/habit-logs/user/${user_id}/range?start=${start}&end=${end}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getGroupHabitLogsByDate(group_id: string, date: string): Promise<HabitLog[]> {
  const key = `habit-logs:group:${group_id}:date:${date}`;
  const cached = apiCache.get<HabitLog[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/habit-logs/group/${group_id}/date/${date}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getGroupHabitLogsRange(group_id: string, start: string, end: string): Promise<HabitLog[]> {
  const key = `habit-logs:group:${group_id}:range:${start}:${end}`;
  const cached = apiCache.get<HabitLog[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/habit-logs/group/${group_id}/range?start=${start}&end=${end}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function upsertHabitLog(log: HabitLogUpsert): Promise<HabitLog> {
  const res = await fetch(`${API_BASE}/habit-logs/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('habit-logs');
  return res.json();
}

// --- Todos ---

export async function getUserTodos(user_id: number): Promise<Todo[]> {
  const key = `todos:user:${user_id}`;
  const cached = apiCache.get<Todo[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/todos/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getGroupTodos(group_id: string): Promise<Todo[]> {
  const key = `todos:group:${group_id}`;
  const cached = apiCache.get<Todo[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/todos/group/${group_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function createTodo(todo: TodoCreate): Promise<Todo> {
  const res = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todo),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('todos');
  return res.json();
}

export async function updateTodo(todo_id: string, update: TodoUpdate): Promise<Todo> {
  const res = await fetch(`${API_BASE}/todos/${todo_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('todos');
  return res.json();
}

export async function toggleTodoComplete(todo_id: string): Promise<Todo> {
  const res = await fetch(`${API_BASE}/todos/${todo_id}/complete`, { method: 'PATCH' });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('todos');
  return res.json();
}

export async function deleteTodo(todo_id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/todos/${todo_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
  apiCache.invalidate('todos');
}

// --- Calendar Events ---

export async function getUserCalendarEvents(user_id: number): Promise<CalendarEvent[]> {
  const key = `calendar:user:${user_id}`;
  const cached = apiCache.get<CalendarEvent[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/calendar/user/${user_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function getGroupCalendarEvents(group_id: string): Promise<CalendarEvent[]> {
  const key = `calendar:group:${group_id}`;
  const cached = apiCache.get<CalendarEvent[]>(key);
  if (cached) return cached;
  const res = await fetch(`${API_BASE}/calendar/group/${group_id}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  apiCache.set(key, data);
  return data;
}

export async function createCalendarEvent(event: CalendarEventCreate): Promise<CalendarEvent> {
  const res = await fetch(`${API_BASE}/calendar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('calendar');
  return res.json();
}

export async function updateCalendarEvent(event_id: string, update: CalendarEventUpdate): Promise<CalendarEvent> {
  const res = await fetch(`${API_BASE}/calendar/${event_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(await extractError(res));
  apiCache.invalidate('calendar');
  return res.json();
}

export async function deleteCalendarEvent(event_id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/calendar/${event_id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await extractError(res));
  apiCache.invalidate('calendar');
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
