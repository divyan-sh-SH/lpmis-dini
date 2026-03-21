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

