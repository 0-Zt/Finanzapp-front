export type CardTrend = 'up' | 'down' | 'neutral';
export type AccentTone = 'blue' | 'teal' | 'emerald' | 'violet' | 'amber' | 'slate';

export interface SummaryCardItem {
  label: string;
  value: string;
}

export interface SummaryCard {
  title: string;
  value: string;
  description: string;
  trend: CardTrend;
  accent: AccentTone;
  delta?: string;
  deltaLabel?: string;
  tag?: string;
  items?: SummaryCardItem[];
}

export interface MonthlyPerformancePoint {
  label: string;
  income: number;
  expense: number;
}

export interface Transaction {
  id: string;
  title: string;
  date: string;
  account: string;
  amount: string;
  category: string;
  type: 'income' | 'expense';
  categoryId?: number;
  categoryColor?: string;
  categoryIcon?: string;
  status?: string;
}

export interface TransactionFilters {
  search: string;
  categoryId: number | 'all';
  type: 'all' | 'income' | 'expense';
  month: string | 'all';
  status: 'all' | 'completed' | 'pending';
}

export interface CategoryBreakdownItem {
  label: string;
  value: number;
  percent: number;
  color: string;
}
