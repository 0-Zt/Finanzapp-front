import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Transaction,
  TransactionFilters,
  TransactionGroup,
  TransactionGroupKey,
  TransactionsSummary,
  PaginationState,
} from '../../models/dashboard.models';
import { TransactionListGroupedComponent } from '../../components/transaction-list-grouped/transaction-list-grouped.component';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { DashboardService } from '../../services/dashboard.service';
import { TransactionsService } from '../../services/transactions.service';
import { ToastService } from '../../services/toast.service';
import {
  ApiExpenseCategory,
  ApiTransaction,
  CreateTransactionPayload,
  DashboardPayload,
  UpdateTransactionPayload,
} from '../../models/api.models';

const TRANSACTION_FETCH_LIMIT = 300;
const TRANSACTION_PAGE_SIZE = 15;

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionListGroupedComponent, TransactionFormComponent],
  templateUrl: './transactions-page.component.html',
})
export class TransactionsPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  isLoading = true;
  errorMessage = '';
  isFormOpen = false;
  formMode: 'create' | 'edit' = 'create';
  editingTransaction: ApiTransaction | null = null;

  categories: ApiExpenseCategory[] = [];
  apiTransactions: ApiTransaction[] = [];
  filteredTransactions: ApiTransaction[] = [];
  transactionGroups: TransactionGroup[] = [];
  monthOptions: Array<{ value: string; label: string }> = [];

  transactionFilters: TransactionFilters = {
    search: '',
    categoryId: 'all',
    type: 'all',
    month: 'all',
    status: 'all',
  };

  pagination: PaginationState = {
    currentPage: 1,
    pageSize: TRANSACTION_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
  };

  summary: TransactionsSummary = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  };

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  private readonly monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  private readonly groupLabels: Record<TransactionGroupKey, string> = {
    today: 'Hoy',
    yesterday: 'Ayer',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mes',
    older: 'Anteriores',
  };

  ngOnInit(): void {
    this.loadTransactions();
  }

  onAddTransaction(): void {
    this.formMode = 'create';
    this.editingTransaction = null;
    this.isFormOpen = true;
  }

  onCreateTransaction(payload: CreateTransactionPayload): void {
    this.isLoading = true;
    this.transactionsService
      .createTransaction(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isFormOpen = false;
          this.toastService.success('Transacción creada correctamente');
          this.loadTransactions();
        },
        error: () => {
          this.toastService.error('No se pudo guardar la transacción');
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
          this.toastService.success('Transacción actualizada correctamente');
          this.loadTransactions();
        },
        error: () => {
          this.toastService.error('No se pudo actualizar la transacción');
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

    if (!confirm('¿Estás seguro de eliminar esta transacción?')) {
      return;
    }

    this.isLoading = true;
    this.transactionsService
      .deleteTransaction(targetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Transacción eliminada correctamente');
          this.loadTransactions();
        },
        error: () => {
          this.toastService.error('No se pudo eliminar la transacción');
          this.isLoading = false;
        },
      });
  }

  onSearchChange(value: string): void {
    this.transactionFilters = { ...this.transactionFilters, search: value };
    this.applyFilters();
  }

  onCategoryChange(value: number | 'all'): void {
    this.transactionFilters = { ...this.transactionFilters, categoryId: value };
    this.applyFilters();
  }

  onTypeChange(value: 'all' | 'income' | 'expense'): void {
    this.transactionFilters = { ...this.transactionFilters, type: value };
    this.applyFilters();
  }

  onMonthChange(value: string | 'all'): void {
    this.transactionFilters = { ...this.transactionFilters, month: value };
    this.applyFilters();
  }

  onStatusChange(value: 'all' | 'completed' | 'pending'): void {
    this.transactionFilters = { ...this.transactionFilters, status: value };
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.pagination.currentPage = page;
    this.updateDisplayedTransactions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCloseTransactionForm(): void {
    this.isFormOpen = false;
    this.editingTransaction = null;
    this.formMode = 'create';
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(Math.abs(value));
  }

  private loadTransactions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService
      .getDashboard(TRANSACTION_FETCH_LIMIT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          this.applyData(payload);
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar las transacciones.';
          this.isLoading = false;
        },
      });
  }

  private applyData(payload: DashboardPayload): void {
    const transactions = payload.transactions ?? [];
    this.categories = payload.categories ?? [];
    this.apiTransactions = transactions;
    this.monthOptions = this.buildMonthFilterOptions();
    this.applyFilters();
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
    this.updateSummary();
    this.updatePagination();
    this.updateDisplayedTransactions();
  }

  private updateSummary(): void {
    let totalIncome = 0;
    let totalExpense = 0;

    for (const transaction of this.filteredTransactions) {
      if (transaction.amount >= 0) {
        totalIncome += transaction.amount;
      } else {
        totalExpense += Math.abs(transaction.amount);
      }
    }

    this.summary = {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: this.filteredTransactions.length,
    };
  }

  private updatePagination(): void {
    const totalItems = this.filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / TRANSACTION_PAGE_SIZE);

    this.pagination = {
      currentPage: 1,
      pageSize: TRANSACTION_PAGE_SIZE,
      totalItems,
      totalPages,
    };
  }

  private updateDisplayedTransactions(): void {
    const start = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    const end = start + this.pagination.pageSize;
    const pageTransactions = this.filteredTransactions.slice(start, end);

    const mapped = this.mapTransactions(pageTransactions, this.categories);
    this.transactionGroups = this.groupTransactionsByDate(mapped);
  }

  private groupTransactionsByDate(transactions: Transaction[]): TransactionGroup[] {
    const now = new Date();
    const today = this.getDateKey(now);
    const yesterday = this.getDateKey(new Date(now.getTime() - 86400000));
    const weekStart = this.getWeekStart(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const groups: Map<TransactionGroupKey, Transaction[]> = new Map([
      ['today', []],
      ['yesterday', []],
      ['thisWeek', []],
      ['thisMonth', []],
      ['older', []],
    ]);

    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.rawDate);
      const dateKey = this.getDateKey(transactionDate);

      if (dateKey === today) {
        groups.get('today')!.push(transaction);
      } else if (dateKey === yesterday) {
        groups.get('yesterday')!.push(transaction);
      } else if (transactionDate >= weekStart) {
        groups.get('thisWeek')!.push(transaction);
      } else if (transactionDate >= monthStart) {
        groups.get('thisMonth')!.push(transaction);
      } else {
        groups.get('older')!.push(transaction);
      }
    }

    const result: TransactionGroup[] = [];
    const order: TransactionGroupKey[] = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'older'];

    for (const key of order) {
      const groupTransactions = groups.get(key)!;
      if (groupTransactions.length > 0) {
        result.push({
          key,
          label: this.groupLabels[key],
          transactions: groupTransactions,
          totalIncome: this.calculateGroupTotal(groupTransactions, 'income'),
          totalExpense: this.calculateGroupTotal(groupTransactions, 'expense'),
        });
      }
    }

    return result;
  }

  private calculateGroupTotal(transactions: Transaction[], type: 'income' | 'expense'): number {
    return transactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + this.parseAmount(t.amount), 0);
  }

  private parseAmount(amount: string): number {
    const cleaned = amount.replace(/[^\d,-]/g, '').replace('.', '');
    return Math.abs(parseInt(cleaned, 10)) || 0;
  }

  private getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.getFullYear(), date.getMonth(), diff);
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

  private getMonthKey(date: string): string {
    const value = new Date(date);
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return `${value.getFullYear()}-${month}`;
  }
}
