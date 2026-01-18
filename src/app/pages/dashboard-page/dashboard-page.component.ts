import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardHeroComponent } from '../../components/dashboard-hero/dashboard-hero.component';
import {
  SummaryCard,
  MonthlyPerformancePoint,
  Transaction,
  TransactionFilters,
  SummaryCardItem,
  CategoryBreakdownItem,
} from '../../models/dashboard.models';
import { MonthlyPerformanceChartComponent } from '../../components/monthly-performance-chart/monthly-performance-chart.component';
import { TransactionsCardComponent } from '../../components/transactions-card/transactions-card.component';
import { DashboardService } from '../../services/dashboard.service';
import { TransactionsService } from '../../services/transactions.service';
import { ToastService } from '../../services/toast.service';
import {
  ApiExpenseCategory,
  ApiTransaction,
  CreateTransactionPayload,
  DashboardPayload,
  UpdateTransactionPayload,
  UserProfile,
  FixedExpense,
} from '../../models/api.models';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { CategoryBreakdownComponent } from '../../components/category-breakdown/category-breakdown.component';
import { SkeletonCardComponent } from '../../components/skeleton/skeleton-card.component';
import { SkeletonTransactionComponent } from '../../components/skeleton/skeleton-transaction.component';

const TRANSACTION_FETCH_LIMIT = 120;
const TRANSACTION_PAGE_SIZE = 6;

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    DashboardHeroComponent,
    MonthlyPerformanceChartComponent,
    TransactionsCardComponent,
    TransactionFormComponent,
    CategoryBreakdownComponent,
    SkeletonCardComponent,
    SkeletonTransactionComponent,
  ],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly dashboardService = inject(DashboardService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly title = 'Finanzapp';
  lastUpdated = '';
  isLoading = true;
  errorMessage = '';
  isFormOpen = false;

  categories: ApiExpenseCategory[] = [];
  apiTransactions: ApiTransaction[] = [];
  filteredTransactions: ApiTransaction[] = [];
  cards: SummaryCard[] = [];
  monthlyPerformance: MonthlyPerformancePoint[] = [];
  transactions: Transaction[] = [];
  categoryBreakdown: CategoryBreakdownItem[] = [];
  monthOptions: Array<{ value: string; label: string }> = [];
  transactionFilters: TransactionFilters = {
    search: '',
    categoryId: 'all',
    type: 'all',
    month: 'all',
    status: 'all',
  };
  visibleTransactionCount = TRANSACTION_PAGE_SIZE;
  editingTransaction: ApiTransaction | null = null;
  formMode: 'create' | 'edit' = 'create';
  reportPeriod: 'monthly' | 'yearly' = 'monthly';
  userProfile: UserProfile | null = null;
  fixedExpenses: FixedExpense[] = [];

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  private readonly monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  ngOnInit(): void {
    this.loadDashboard();
  }

  onAddTransaction(): void {
    this.formMode = 'create';
    this.editingTransaction = null;
    this.isFormOpen = true;
  }

  onViewReports(): void {
    const target = this.document?.getElementById('reports');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onCreateTransaction(payload: CreateTransactionPayload): void {
    this.isLoading = true;
    this.transactionsService
      .createTransaction(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isFormOpen = false;
          this.toastService.success('Transaccion creada correctamente');
          this.loadDashboard();
        },
        error: () => {
          this.toastService.error('No se pudo guardar la transaccion');
          this.isLoading = false;
        },
      });
  }

  onUpdateTransaction(event: { id: number; payload: UpdateTransactionPayload }): void {
    this.isLoading = true;
    this.transactionsService
      .updateTransaction(event.id, event.payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isFormOpen = false;
          this.editingTransaction = null;
          this.formMode = 'create';
          this.toastService.success('Transaccion actualizada correctamente');
          this.loadDashboard();
        },
        error: () => {
          this.toastService.error('No se pudo actualizar la transaccion');
          this.isLoading = false;
        },
      });
  }

  onEditTransaction(transaction: Transaction): void {
    const target = this.apiTransactions.find((item) => String(item.id) === transaction.id);
    if (!target) {
      return;
    }

    this.editingTransaction = target;
    this.formMode = 'edit';
    this.isFormOpen = true;
  }

  onDeleteTransaction(transaction: Transaction): void {
    const targetId = Number(transaction.id);
    if (!Number.isFinite(targetId)) {
      return;
    }

    if (!confirm('Estas seguro de eliminar esta transaccion?')) {
      return;
    }

    this.isLoading = true;
    this.transactionsService
      .deleteTransaction(targetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Transaccion eliminada correctamente');
          this.loadDashboard();
        },
        error: () => {
          this.toastService.error('No se pudo eliminar la transaccion');
          this.isLoading = false;
        },
      });
  }

  onFiltersChange(filters: TransactionFilters): void {
    this.transactionFilters = filters;
    this.applyFilters();
  }

  onLoadMoreTransactions(): void {
    this.visibleTransactionCount += TRANSACTION_PAGE_SIZE;
    this.updateDisplayedTransactions();
  }

  onReportPeriodChange(period: 'monthly' | 'yearly'): void {
    this.reportPeriod = period;
    this.monthlyPerformance = this.buildPerformanceSeries(this.apiTransactions, this.reportPeriod);
    this.categoryBreakdown = this.buildCategoryBreakdown(this.apiTransactions, this.categories, this.reportPeriod);
  }

  onCloseTransactionForm(): void {
    this.isFormOpen = false;
    this.editingTransaction = null;
    this.formMode = 'create';
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService
      .getDashboard(TRANSACTION_FETCH_LIMIT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          this.applyDashboardData(payload);
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar el dashboard.';
          this.isLoading = false;
        },
      });
  }

  private applyDashboardData(payload: DashboardPayload): void {
    const transactions = payload.transactions ?? [];
    this.categories = payload.categories ?? [];
    this.apiTransactions = transactions;
    this.userProfile = payload.userProfile ?? null;
    this.fixedExpenses = payload.fixedExpenses ?? [];
    this.cards = this.buildSummaryCards(payload);
    this.monthlyPerformance = this.buildPerformanceSeries(transactions, this.reportPeriod);
    this.lastUpdated = this.computeLastUpdated(transactions);
    this.monthOptions = this.buildMonthFilterOptions();
    this.categoryBreakdown = this.buildCategoryBreakdown(transactions, this.categories, this.reportPeriod);
    this.applyFilters();
  }

  get hasMoreTransactions(): boolean {
    return this.visibleTransactionCount < this.filteredTransactions.length;
  }

  private applyFilters(): void {
    const search = this.transactionFilters.search.trim().toLowerCase();
    const filtered = this.apiTransactions.filter((transaction) => {
      if (search && !transaction.description.toLowerCase().includes(search)) {
        return false;
      }

      if (this.transactionFilters.categoryId !== 'all') {
        if (transaction.category_id !== this.transactionFilters.categoryId) {
          return false;
        }
      }

      if (this.transactionFilters.type !== 'all') {
        if (this.transactionFilters.type === 'income' && transaction.amount < 0) {
          return false;
        }
        if (this.transactionFilters.type === 'expense' && transaction.amount >= 0) {
          return false;
        }
      }

      if (this.transactionFilters.month !== 'all') {
        if (this.getMonthKey(transaction.transaction_date) !== this.transactionFilters.month) {
          return false;
        }
      }

      if (this.transactionFilters.status !== 'all') {
        if (transaction.status !== this.transactionFilters.status) {
          return false;
        }
      }

      return true;
    });

    this.filteredTransactions = filtered;
    this.visibleTransactionCount = TRANSACTION_PAGE_SIZE;
    this.updateDisplayedTransactions();
  }

  private updateDisplayedTransactions(): void {
    const slice = this.filteredTransactions.slice(0, this.visibleTransactionCount);
    this.transactions = this.mapTransactions(slice, this.categories);
  }

  private mapTransactions(transactions: ApiTransaction[], categories: ApiExpenseCategory[]): Transaction[] {
    const categoryMap = new Map(categories.map((category) => [category.id, category]));

    return transactions.map((transaction) => {
      const category = categoryMap.get(transaction.category_id ?? 0);
      const categoryName = category?.name ?? 'Sin categoria';
      const type = transaction.amount < 0 ? 'expense' : 'income';

      return {
        id: String(transaction.id),
        title: transaction.description,
        date: this.formatTransactionDate(transaction.transaction_date),
        rawDate: transaction.transaction_date,
        account: transaction.account ?? 'Cuenta principal',
        amount: this.formatAmount(transaction.amount),
        category: categoryName,
        type,
        categoryId: transaction.category_id ?? undefined,
        categoryColor: category?.icon_color ?? undefined,
        categoryIcon: category?.icon ?? undefined,
        status: transaction.status,
      };
    });
  }

  private buildSummaryCards(payload: DashboardPayload): SummaryCard[] {
    const transactions = payload.transactions ?? [];
    const upcomingPayments = payload.upcomingPayments ?? [];
    const financialGoals = payload.financialGoals ?? [];
    const categories = payload.categories ?? [];
    const userProfile = payload.userProfile;
    const fixedExpenses = payload.fixedExpenses ?? [];

    const totals = this.calculateTotals(transactions);
    const balance = totals.income - totals.expense;
    const monthlyExpense = totals.monthlyExpense;
    const expenseComparison = this.getExpenseComparison(monthlyExpense, totals.previousMonthlyExpense);
    const upcomingPayment = this.getUpcomingPayment(upcomingPayments);
    const goalsProgress = this.getGoalsProgress(financialGoals);
    const topCategories = this.getTopCategories(transactions, categories);
    const largestTransaction = this.getLargestMonthlyTransaction(transactions);
    const largestCategory = this.getCategoryName(largestTransaction?.category_id, categories);

    // Calculate available balance (salary - fixed expenses - monthly expense)
    const monthlySalary = userProfile?.monthly_salary ?? 0;
    const totalFixedExpenses = fixedExpenses.filter((e) => e.is_active).reduce((sum, e) => sum + e.amount, 0);
    const availableBalance = monthlySalary - totalFixedExpenses - monthlyExpense;

    const cards: SummaryCard[] = [
      {
        title: 'Saldo general',
        value: this.currencyFormatter.format(balance),
        description: 'Disponible en cuentas y billeteras vinculadas.',
        trend: balance > 0 ? 'up' : balance < 0 ? 'down' : 'neutral',
        accent: 'emerald',
      },
    ];

    // Add salary card if user has a profile with salary
    if (userProfile && monthlySalary > 0) {
      cards.push({
        title: 'Sueldo mensual',
        value: this.currencyFormatter.format(monthlySalary),
        description: `Dia de pago: ${userProfile.salary_day} de cada mes.`,
        trend: 'up',
        accent: 'emerald',
        items: [
          { label: 'Disponible', value: this.currencyFormatter.format(availableBalance) },
          { label: 'Gastos fijos', value: this.currencyFormatter.format(totalFixedExpenses) },
        ],
      });
    }

    cards.push(
      {
        title: 'Gastos del mes',
        value: this.currencyFormatter.format(monthlyExpense),
        description: 'Gasto acumulado en el mes actual.',
        trend: expenseComparison.trend,
        delta: expenseComparison.delta,
        deltaLabel: expenseComparison.label,
        accent: 'amber',
        items: topCategories,
      },
      {
        title: 'Movimiento mayor',
        value: largestTransaction
          ? this.currencyFormatter.format(Math.abs(largestTransaction.amount))
          : 'Sin datos',
        description: largestTransaction
          ? `${largestTransaction.description} - ${largestCategory ?? 'Sin categoria'}.`
          : 'No hay movimientos en el mes actual.',
        trend: largestTransaction
          ? largestTransaction.amount >= 0
            ? 'up'
            : 'down'
          : 'neutral',
        tag: 'Mes actual',
        accent: 'blue',
      },
      {
        title: 'Proximo pago',
        value: upcomingPayment ? this.currencyFormatter.format(upcomingPayment.amount) : 'Sin pagos',
        description: upcomingPayment
          ? `${upcomingPayment.description} - vence el ${this.formatDateOnly(upcomingPayment.payment_date)}.`
          : 'No hay pagos registrados.',
        trend: 'neutral',
        tag: upcomingPayment ? 'Recordatorio' : 'Sin datos',
        accent: 'slate',
      },
      {
        title: 'Metas de ahorro',
        value: `${goalsProgress.progress}% cumplido`,
        description: 'Seguimiento de tus metas de ahorro vigentes.',
        trend: goalsProgress.progress >= 50 ? 'up' : 'neutral',
        accent: 'violet',
        items: goalsProgress.items,
      },
    );

    return cards;
  }

  private buildPerformanceSeries(
    transactions: ApiTransaction[],
    period: 'monthly' | 'yearly'
  ): MonthlyPerformancePoint[] {
    return period === 'yearly'
      ? this.buildYearlyPerformance(transactions)
      : this.buildMonthlyPerformance(transactions);
  }

  private buildMonthlyPerformance(transactions: ApiTransaction[]): MonthlyPerformancePoint[] {
    const buckets = this.buildMonthBuckets();
    const totals = new Map<string, { income: number; expense: number }>();

    buckets.forEach((bucket) => {
      totals.set(bucket.key, { income: 0, expense: 0 });
    });

    transactions.forEach((transaction) => {
      const date = new Date(transaction.transaction_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const entry = totals.get(key);
      if (!entry) {
        return;
      }
      if (transaction.amount >= 0) {
        entry.income += transaction.amount;
      } else {
        entry.expense += Math.abs(transaction.amount);
      }
    });

    const maxValue = Math.max(
      0,
      ...Array.from(totals.values()).flatMap((entry) => [entry.income, entry.expense])
    );

    return buckets.map((bucket) => {
      const entry = totals.get(bucket.key) ?? { income: 0, expense: 0 };
      return {
        label: bucket.label,
        income: maxValue ? Math.round((entry.income / maxValue) * 100) : 0,
        expense: maxValue ? Math.round((entry.expense / maxValue) * 100) : 0,
      };
    });
  }

  private buildYearlyPerformance(transactions: ApiTransaction[]): MonthlyPerformancePoint[] {
    const now = new Date();
    const years = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()];
    const totals = new Map<number, { income: number; expense: number }>();

    years.forEach((year) => {
      totals.set(year, { income: 0, expense: 0 });
    });

    transactions.forEach((transaction) => {
      const date = new Date(transaction.transaction_date);
      const year = date.getFullYear();
      const entry = totals.get(year);
      if (!entry) {
        return;
      }
      if (transaction.amount >= 0) {
        entry.income += transaction.amount;
      } else {
        entry.expense += Math.abs(transaction.amount);
      }
    });

    const maxValue = Math.max(
      0,
      ...Array.from(totals.values()).flatMap((entry) => [entry.income, entry.expense])
    );

    return years.map((year) => {
      const entry = totals.get(year) ?? { income: 0, expense: 0 };
      return {
        label: String(year),
        income: maxValue ? Math.round((entry.income / maxValue) * 100) : 0,
        expense: maxValue ? Math.round((entry.expense / maxValue) * 100) : 0,
      };
    });
  }

  private buildMonthBuckets(): Array<{ key: string; label: string }> {
    const buckets: Array<{ key: string; label: string }> = [];
    const now = new Date();

    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      buckets.push({ key, label: this.monthLabels[date.getMonth()] });
    }

    return buckets;
  }

  private buildMonthFilterOptions(): Array<{ value: string; label: string }> {
    const options: Array<{ value: string; label: string }> = [];
    const now = new Date();

    for (let offset = 0; offset < 12; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      options.push({
        value: this.getMonthKey(date.toISOString()),
        label: `${this.monthLabels[date.getMonth()]} ${date.getFullYear()}`,
      });
    }

    return options;
  }

  private calculateTotals(transactions: ApiTransaction[]): {
    income: number;
    expense: number;
    monthlyExpense: number;
    previousMonthlyExpense: number;
  } {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let income = 0;
    let expense = 0;
    let monthlyExpense = 0;
    let previousMonthlyExpense = 0;

    transactions.forEach((transaction) => {
      if (transaction.amount >= 0) {
        income += transaction.amount;
      } else {
        const absAmount = Math.abs(transaction.amount);
        expense += absAmount;

        const transactionDate = new Date(transaction.transaction_date);
        if (transactionDate.getFullYear() === now.getFullYear() && transactionDate.getMonth() === now.getMonth()) {
          monthlyExpense += absAmount;
        }

        if (
          transactionDate.getFullYear() === previousMonth.getFullYear() &&
          transactionDate.getMonth() === previousMonth.getMonth()
        ) {
          previousMonthlyExpense += absAmount;
        }
      }
    });

    return { income, expense, monthlyExpense, previousMonthlyExpense };
  }

  private getExpenseComparison(
    currentExpense: number,
    previousExpense: number
  ): { delta?: string; label?: string; trend: SummaryCard['trend'] } {
    if (!previousExpense) {
      return { trend: 'neutral' };
    }

    const change = ((currentExpense - previousExpense) / previousExpense) * 100;
    const trend: SummaryCard['trend'] = change <= 0 ? 'up' : 'down';
    const delta = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;

    return { delta, label: 'vs. mes anterior', trend };
  }

  private getTopCategories(
    transactions: ApiTransaction[],
    categories: ApiExpenseCategory[]
  ): SummaryCardItem[] {
    const now = new Date();
    const totals = new Map<number, number>();

    transactions.forEach((transaction) => {
      if (transaction.amount >= 0) {
        return;
      }

      const date = new Date(transaction.transaction_date);
      if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) {
        return;
      }

      if (!transaction.category_id) {
        return;
      }

      const current = totals.get(transaction.category_id) ?? 0;
      totals.set(transaction.category_id, current + Math.abs(transaction.amount));
    });

    if (!totals.size) {
      return [{ label: 'Sin categorias', value: '0%' }];
    }

    const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
    const totalExpense = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([categoryId, amount]) => {
        const name = categoryMap.get(categoryId) ?? 'Sin categoria';
        const percent = totalExpense ? Math.round((amount / totalExpense) * 100) : 0;
        return { label: name, value: `${percent}%` };
      });
  }

  private buildCategoryBreakdown(
    transactions: ApiTransaction[],
    categories: ApiExpenseCategory[],
    period: 'monthly' | 'yearly'
  ): CategoryBreakdownItem[] {
    const now = new Date();
    const totals = new Map<number, number>();
    const fallbackColors = ['#3b82f6', '#38bdf8', '#34d399', '#f97316', '#f43f5e'];

    transactions.forEach((transaction) => {
      if (transaction.amount >= 0) {
        return;
      }

      const date = new Date(transaction.transaction_date);
      if (period === 'monthly') {
        if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) {
          return;
        }
      } else if (date.getFullYear() !== now.getFullYear()) {
        return;
      }

      if (!transaction.category_id) {
        return;
      }

      const current = totals.get(transaction.category_id) ?? 0;
      totals.set(transaction.category_id, current + Math.abs(transaction.amount));
    });

    if (!totals.size) {
      return [];
    }

    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const totalExpense = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);

    return sorted.slice(0, 5).map(([categoryId, amount], index) => {
      const category = categoryMap.get(categoryId);
      const color = category?.icon_color ?? fallbackColors[index % fallbackColors.length];
      const percent = totalExpense ? Math.round((amount / totalExpense) * 100) : 0;
      return {
        label: category?.name ?? 'Sin categoria',
        value: amount,
        percent,
        color,
      };
    });
  }

  private getLargestMonthlyTransaction(transactions: ApiTransaction[]): ApiTransaction | null {
    const now = new Date();
    const monthly = transactions.filter((transaction) => {
      const date = new Date(transaction.transaction_date);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });

    if (!monthly.length) {
      return null;
    }

    return monthly.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
  }

  private getCategoryName(categoryId: number | null | undefined, categories: ApiExpenseCategory[]): string | null {
    if (!categoryId) {
      return null;
    }

    return categories.find((category) => category.id === categoryId)?.name ?? null;
  }

  private getUpcomingPayment(upcomingPayments: DashboardPayload['upcomingPayments']) {
    if (!upcomingPayments.length) {
      return null;
    }

    return upcomingPayments
      .map((payment) => ({ ...payment, date: new Date(payment.payment_date) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  }

  private getGoalsProgress(financialGoals: DashboardPayload['financialGoals']): {
    progress: number;
    items: Array<{ label: string; value: string }>;
  } {
    if (!financialGoals.length) {
      return {
        progress: 0,
        items: [{ label: 'Sin metas', value: '0%' }],
      };
    }

    const totals = financialGoals.reduce(
      (accumulator, goal) => {
        return {
          current: accumulator.current + goal.current_amount,
          target: accumulator.target + goal.target_amount,
        };
      },
      { current: 0, target: 0 }
    );

    const progress = totals.target ? Math.round((totals.current / totals.target) * 100) : 0;
    const items = financialGoals.slice(0, 3).map((goal) => {
      const goalProgress = goal.target_amount
        ? Math.round((goal.current_amount / goal.target_amount) * 100)
        : 0;
      return { label: goal.title, value: `${goalProgress}%` };
    });

    return { progress, items };
  }

  private computeLastUpdated(transactions: ApiTransaction[]): string {
    if (!transactions.length) {
      return 'hoy';
    }

    const latest = transactions
      .map((transaction) => new Date(transaction.transaction_date))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return this.formatDateOnly(latest.toISOString());
  }

  private formatAmount(amount: number): string {
    const formatted = this.currencyFormatter.format(Math.abs(amount));
    return amount < 0 ? `-${formatted}` : `+${formatted}`;
  }

  private formatTransactionDate(date: string): string {
    const value = new Date(date);
    const datePart = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' })
      .format(value)
      .replace('.', '');
    const timePart = new Intl.DateTimeFormat('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(value);

    return `${datePart} - ${timePart}`;
  }

  private formatDateOnly(date: string): string {
    const value = new Date(date);
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
    })
      .format(value)
      .replace('.', '');
  }

  private getMonthKey(date: string): string {
    const value = new Date(date);
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return `${value.getFullYear()}-${month}`;
  }
}
