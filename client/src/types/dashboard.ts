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
  description?: string | null;
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
  description?: string;
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

export type ChatContext = 'personal' | 'group';

export type Journal = {
  journal_id: string;
  user_id: number;
  date: string;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export type JournalCreate = {
  user_id: number;
  date: string;
  content: string;
};

export type JournalUpdate = {
  content: string;
};
