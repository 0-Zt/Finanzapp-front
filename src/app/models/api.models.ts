export interface ApiTransaction {
  id: number;
  user_id: number;
  transaction_date: string;
  description: string;
  category_id: number | null;
  amount: number;
  status: string;
  account?: string | null;
}

export interface ApiExpenseCategory {
  id: number;
  user_id?: number | null;
  name: string;
  icon: string;
  icon_color: string;
  is_default?: boolean | null;
}

export interface ApiUpcomingPayment {
  id: number;
  user_id: number;
  payment_date: string;
  description: string;
  amount: number;
  category_id: number;
  status: string;
  icon?: string | null;
  icon_color?: string | null;
}

export interface ApiFinancialGoal {
  id: number;
  user_id: number;
  title: string;
  current_amount: number;
  target_amount: number;
  deadline: string;
  icon?: string | null;
}

export interface DashboardPayload {
  transactions: ApiTransaction[];
  categories: ApiExpenseCategory[];
  upcomingPayments: ApiUpcomingPayment[];
  financialGoals: ApiFinancialGoal[];
}

export interface CreateTransactionPayload {
  user_id: number;
  transaction_date: string;
  description: string;
  category_id: number;
  amount: number;
  status: string;
  account?: string | null;
}

export interface UpdateTransactionPayload {
  transaction_date?: string;
  description?: string;
  category_id?: number;
  amount?: number;
  status?: string;
}

export interface CreateFinancialGoalPayload {
  user_id: number;
  title: string;
  current_amount: number;
  target_amount: number;
  deadline: string;
  icon?: string | null;
}

export interface UpdateFinancialGoalPayload {
  title?: string;
  current_amount?: number;
  target_amount?: number;
  deadline?: string;
  icon?: string | null;
}
