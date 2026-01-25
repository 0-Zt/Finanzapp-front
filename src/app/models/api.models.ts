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
  onboarding_completed: boolean;
  timezone?: string | null;
  budget_warning_threshold?: number | null;
  budget_exceeded_threshold?: number | null;
  notification_preferences?: {
    budget_warning?: boolean;
    budget_exceeded?: boolean;
    payment_reminder?: boolean;
    payment_reminder_days?: number;
    goal_deadline?: boolean;
    goal_deadline_days?: number;
    card_payment_due?: boolean;
    card_payment_due_days?: number;
    fixed_expense_due?: boolean;
    fixed_expense_due_days?: number;
  };
  created_at?: string;
  updated_at?: string;
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
  onboardingCompleted?: boolean;
  timezone?: string;
  budgetWarningThreshold?: number;
  budgetExceededThreshold?: number;
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

export interface ApiBudgetProgress {
  id: number;
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  budget_amount: number;
  budget_month: string;
  rollover_enabled: boolean;
  rollover_amount: number;
  effective_budget_amount: number;
  suggested_budget: number | null;
  spent_amount: number;
  remaining_amount: number;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export interface ApiSuggestedBudget {
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  average_spent: number;
}

export interface ApiUnbudgetedCategorySummary {
  category_id: number | null;
  category_name: string;
  category_icon: string;
  category_color: string;
  spent_amount: number;
}

export interface ApiBudgetSummary {
  month: string;
  timezone: string;
  warning_threshold: number;
  exceeded_threshold: number;
  total_budget: number;
  total_spent: number;
  unbudgeted_total: number;
  unbudgeted_categories: number;
  top_over_budget: ApiBudgetProgress[];
  suggested_budgets: ApiSuggestedBudget[];
  unbudgeted_breakdown: ApiUnbudgetedCategorySummary[];
  budgets: ApiBudgetProgress[];
}

export interface ApiCategoryBudget {
  id: number;
  user_id: string;
  category_id: number;
  budget_amount: number;
  budget_month: string;
  rollover_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryBudgetPayload {
  category_id: number;
  budget_amount: number;
  budget_month?: string;
  rollover_enabled?: boolean;
}

export interface UpdateCategoryBudgetPayload {
  budget_amount?: number;
  rollover_enabled?: boolean;
}

// ==================== CREDIT CARDS ====================

export interface ApiCreditCard {
  id: number;
  user_id: string;
  name: string;
  bank_name: string;
  last_four_digits?: string | null;
  card_type: string;
  credit_limit: number;
  current_balance: number;
  billing_cycle_day?: number | null;
  payment_due_day?: number | null;
  minimum_payment_percentage: number;
  interest_rate: number;
  currency: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiCreditCardWithSummary extends ApiCreditCard {
  available_credit: number;
  utilization_percentage: number;
}

export interface ApiCreditCardTransaction {
  id: number;
  user_id: string;
  credit_card_id: number;
  transaction_date: string;
  description: string;
  amount: number;
  category_id?: number | null;
  status: string;
  installments: number;
  current_installment: number;
  installment_amount?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiCreditCardPayment {
  id: number;
  user_id: string;
  credit_card_id: number;
  payment_date: string;
  amount: number;
  payment_type: string;
  notes?: string | null;
  created_at: string;
}

export interface CreditCardsSummary {
  cards: ApiCreditCardWithSummary[];
  totals: {
    total_balance: number;
    total_limit: number;
    total_available: number;
    card_count: number;
  };
}

export interface CreditCardDetailSummary {
  card: ApiCreditCard;
  summary: {
    current_balance: number;
    credit_limit: number;
    available_credit: number;
    utilization_percentage: number;
    total_spent_period: number;
    total_payments_period: number;
    transaction_count: number;
  };
  recent_transactions: ApiCreditCardTransaction[];
}

export interface CreateCreditCardPayload {
  name: string;
  bank_name: string;
  last_four_digits?: string;
  card_type?: string;
  credit_limit?: number;
  billing_cycle_day?: number;
  payment_due_day?: number;
  minimum_payment_percentage?: number;
  interest_rate?: number;
  currency?: string;
  color?: string;
  is_active?: boolean;
}

export interface UpdateCreditCardPayload {
  name?: string;
  bank_name?: string;
  last_four_digits?: string;
  card_type?: string;
  credit_limit?: number;
  billing_cycle_day?: number;
  payment_due_day?: number;
  minimum_payment_percentage?: number;
  interest_rate?: number;
  currency?: string;
  color?: string;
  is_active?: boolean;
}

export interface CreateCardTransactionPayload {
  credit_card_id: number;
  transaction_date: string;
  description: string;
  amount: number;
  category_id?: number;
  status?: string;
  installments?: number;
  notes?: string;
}

export interface UpdateCardTransactionPayload {
  transaction_date?: string;
  description?: string;
  amount?: number;
  category_id?: number;
  status?: string;
  installments?: number;
  current_installment?: number;
  notes?: string;
}

export interface CreateCardPaymentPayload {
  credit_card_id: number;
  payment_date: string;
  amount: number;
  payment_type?: string;
  notes?: string;
}

// ==================== NOTIFICATIONS ====================

export interface NotificationMetadata {
  entity_type?: string;
  entity_id?: number;
  action_url?: string;
  [key: string]: any;
}

export interface ApiNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  icon: string | null;
  color: string | null;
  priority: string;
  category: string | null;
  metadata: NotificationMetadata;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface ApiNotificationsResponse {
  notifications: ApiNotification[];
  unreadCount: number;
  totalCount: number;
  hasMore: boolean;
}

export interface ApiUnreadCountResponse {
  unreadCount: number;
}
