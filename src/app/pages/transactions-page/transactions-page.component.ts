import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  Transaction,
  TransactionFilters,
} from '../../models/dashboard.models';
import { TransactionsCardComponent } from '../../components/transactions-card/transactions-card.component';
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

const USER_ID = 1;
const TRANSACTION_FETCH_LIMIT = 300;
const TRANSACTION_PAGE_SIZE = 12;

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [CommonModule, TransactionsCardComponent, TransactionFormComponent],
  templateUrl: './transactions-page.component.html',
})
export class TransactionsPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly userId = USER_ID;
  isLoading = true;
  errorMessage = '';
  isFormOpen = false;
  formMode: 'create' | 'edit' = 'create';
  editingTransaction: ApiTransaction | null = null;

  categories: ApiExpenseCategory[] = [];
  apiTransactions: ApiTransaction[] = [];
  filteredTransactions: ApiTransaction[] = [];
  transactions: Transaction[] = [];
  monthOptions: Array<{ value: string; label: string }> = [];
  transactionFilters: TransactionFilters = {
    search: '',
    categoryId: 'all',
    type: 'all',
    month: 'all',
    status: 'all',
  };
  visibleTransactionCount = TRANSACTION_PAGE_SIZE;

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  private readonly monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  ngOnInit(): void {
    this.loadTransactions();
  }

  get hasMoreTransactions(): boolean {
    return this.visibleTransactionCount < this.filteredTransactions.length;
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

  onFiltersChange(filters: TransactionFilters): void {
    this.transactionFilters = filters;
    this.applyFilters();
  }

  onLoadMoreTransactions(): void {
    this.visibleTransactionCount += TRANSACTION_PAGE_SIZE;
    this.updateDisplayedTransactions();
  }

  onCloseTransactionForm(): void {
    this.isFormOpen = false;
    this.editingTransaction = null;
    this.formMode = 'create';
  }

  private loadTransactions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService
      .getDashboard(USER_ID, TRANSACTION_FETCH_LIMIT)
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
