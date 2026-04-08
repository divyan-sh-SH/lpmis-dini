export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: number;
  date: string;
  type: TransactionType;
  amount: number;
  description?: string | null;
};

export type CartItem = {
  id: number;
  itemName: string;
  store?: string | null;
  cost: number;
  notes?: string | null;
};

export type Summary = {
  monthStart: string;
  monthEnd: string;
  income: number;
  expense: number;
  remaining: number;
};

export type User = {
  user_id: number;
  username: string;
  otp: number;
  role: string;
  created_at: string;
  updated_at: string;
};

export type UserCreate = {
  username: string;
  otp: number;
};

export type Group = {
  group_id: number;
  group_name: string;
  users: number[];
  created_by: number;
  created_at: string;
};

export type GroupCreate = {
  group_name: string;
  users: number[];
  created_by: number;
};

export type Stock = {
  id: number;
  stock_item: string;
  quantity: number;
  user_id?: number;
  group_id?: number;
  created_at: string;
};

export type StockCreate = {
  stock_item: string;
  quantity: number;
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
  item_name: string;
  store?: string;
  cost: number;
  note?: string;
  user_id?: number;
  group_id?: string;
};

