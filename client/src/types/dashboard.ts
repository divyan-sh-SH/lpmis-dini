export type TransactionType = 'income' | 'expense';

export type Transaction = {
  transaction_id: string;
  date: string;
  type: TransactionType;
  amount: number;
  description?: string | null;
  user_id?: number;
  group_id?: string;
};

export type CartItem = {
  cart_id: string;
  stock_item: string;
  store_name?: string | null;
  quantity?: string | null;
  cost: number;
  description?: string | null;
  user_id?: number;
  group_id?: string;
};

export type Stock = {
  stock_id: string;
  stock_item: string;
  quantity?: string | null;
  category?: string | null;
  user_id?: number;
  group_id?: string;
};

export type User = {
  user_id: number;
  username: string;
  otp: number;
  role: string;
};

export type Group = {
  group_id: string;
  group_name: string;
  users: number[];
  created_by: number;
  created_on: string;
};

export type UserCreate = {
  user_id: number;
  username: string;
  role: string;
  otp: number;
};

export type GroupCreate = {
  name: string;
  users: number[];
  created_by: number;
};

export type StockCreate = {
  stock_item: string;
  quantity?: string;
  category?: string;
  user_id?: number;
  group_id?: string;
};

export type TransactionCreate = {
  date: string;
  amount: number;
  description?: string;
  type: TransactionType;
  user_id?: number;
  group_id?: string;
};

export type CartItemCreate = {
  stock_item: string;
  store_name?: string;
  quantity?: string;
  cost: number;
  description?: string;
  user_id?: number;
  group_id?: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type Habit = {
  habit_id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly';
  target_value: number | null;
  unit: string | null;
  is_active: boolean;
  sort_order: number;
  user_id?: number;
  group_id?: string;
};

export type HabitCreate = {
  name: string;
  description?: string | null;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly';
  target_value?: number | null;
  unit?: string | null;
  sort_order?: number;
  user_id?: number;
  group_id?: string;
};

export type HabitUpdate = {
  name?: string;
  description?: string | null;
  frequency?: 'daily' | 'weekdays' | 'weekends' | 'weekly';
  target_value?: number | null;
  unit?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type HabitLog = {
  log_id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  value: number | null;
};

export type HabitLogUpsert = {
  habit_id: string;
  date: string;
  completed: boolean;
  value?: number | null;
};

export type Todo = {
  todo_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completed_at: string | null;
  user_id?: number;
  group_id?: string;
};

export type TodoCreate = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high';
  user_id?: number;
  group_id?: string;
};

export type TodoUpdate = {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high';
};

export type CalendarEvent = {
  event_id: string;
  title: string;
  description: string | null;
  date: string;
  time_start: string | null;
  time_end: string | null;
  user_id?: number;
  group_id?: string;
};

export type CalendarEventCreate = {
  title: string;
  description?: string | null;
  date: string;
  time_start?: string | null;
  time_end?: string | null;
  user_id?: number;
  group_id?: string;
};

export type CalendarEventUpdate = {
  title?: string;
  description?: string | null;
  date?: string;
  time_start?: string | null;
  time_end?: string | null;
};

export type ActionSuggestion = {
  type: 'add' | 'update' | 'remove';
  entity: 'transaction' | 'stock' | 'cart' | 'habit' | 'todo' | 'calendar';
  label: string;
  data: Record<string, unknown>;
};

export type AgentChatResponse = {
  response: string;
  cart_suggestions: string[];
  action_suggestions: ActionSuggestion[];
  clarification: string | null;
  inferred_context?: string;
  inferred_group_id?: string;
};

export type Note = {
  note_id: string;
  user_id?: number | null;
  group_id?: string | null;
  date: string;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteCreate = {
  user_id?: number | null;
  group_id?: string | null;
  date: string;
  content: string;
};

export type NoteUpdate = {
  content: string;
};
