export interface ApiTransaction {
  id: number;
  user_id: string;
  transaction_date: string;
  description: string;
  category_id: number | null;
  amount: number;
  status: string;
  account?: string | null;
}

export interface ApiExpenseCategory {
  id: number;
  user_id?: string | null;
  name: string;
  icon: string;
  icon_color: string;
  is_default?: boolean | null;
}

export interface ApiUpcomingPayment {
  id: number;
  user_id: string;
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
  user_id: string;
  title: string;
  current_amount: number;
  target_amount: number;
  deadline: string;
  icon?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  monthly_salary: number;
  salary_day: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface FixedExpense {
  id: number;
  user_id: string;
  description: string;
  amount: number;
  category_id: number | null;
  due_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardPayload {
  transactions: ApiTransaction[];
  categories: ApiExpenseCategory[];
  upcomingPayments: ApiUpcomingPayment[];
  financialGoals: ApiFinancialGoal[];
  userProfile: UserProfile | null;
  fixedExpenses: FixedExpense[];
}

export interface CreateTransactionPayload {
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

export interface UpdateProfilePayload {
  fullName?: string;
  monthlySalary?: number;
  salaryDay?: number;
  currency?: string;
}

export interface CreateFixedExpensePayload {
  description: string;
  amount: number;
  categoryId?: number;
  dueDay?: number;
  isActive?: boolean;
}

export interface UpdateFixedExpensePayload {
  description?: string;
  amount?: number;
  categoryId?: number;
  dueDay?: number;
  isActive?: boolean;
}
