import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from '../../services/dashboard.service';
import { TransactionsService } from '../../services/transactions.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import {
  ApiExpenseCategory,
  ApiTransaction,
  CreateTransactionPayload,
  DashboardPayload,
} from '../../models/api.models';
import { TransactionsCardComponent } from '../../components/transactions-card/transactions-card.component';
import { Transaction } from '../../models/dashboard.models';

const TRANSACTION_FETCH_LIMIT = 200;

interface SavingsFormState {
  amount: number | null;
  date: string;
  etf: string;
  note: string;
  type: 'buy' | 'deposit';
}

@Component({
  selector: 'app-savings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionsCardComponent, PageHeaderComponent],
  templateUrl: './savings-page.component.html',
})
export class SavingsPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly destroyRef = inject(DestroyRef);

  categories: ApiExpenseCategory[] = [];
  savingsCategory: ApiExpenseCategory | null = null;
  savingsTransactions: Transaction[] = [];
  isLoading = true;
  errorMessage = '';

  formState: SavingsFormState = this.createInitialState();
  etfOptions = ['VOO', 'VTI', 'QQQ', 'SPY', 'IEMG'];

  ngOnInit(): void {
    this.loadSavings();
  }

  onSubmit(): void {
    if (!this.savingsCategory) {
      this.errorMessage = 'Crea una categoria llamada Ahorro para registrar inversiones.';
      return;
    }

    if (!this.formState.amount || !this.formState.date) {
      return;
    }

    const label = this.formState.type === 'buy' ? 'Compra' : 'Aporte';
    const etfLabel = this.formState.etf ? `ETF ${this.formState.etf}` : 'Ahorro';
    const note = this.formState.note ? ` - ${this.formState.note.trim()}` : '';

    const payload: CreateTransactionPayload = {
      transaction_date: new Date(`${this.formState.date}T00:00:00`).toISOString(),
      description: `${label} ${etfLabel}${note}`,
      category_id: this.savingsCategory.id,
      amount: this.formState.amount * -1,
      status: 'completed',
    };

    this.isLoading = true;
    this.transactionsService
      .createTransaction(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.formState = this.createInitialState();
          this.loadSavings();
        },
        error: () => {
          this.errorMessage = 'No se pudo guardar el ahorro.';
          this.isLoading = false;
        },
      });
  }

  private loadSavings(): void {
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
          this.errorMessage = 'No se pudo cargar los datos de ahorro.';
          this.isLoading = false;
        },
      });
  }

  private applyData(payload: DashboardPayload): void {
    this.categories = payload.categories ?? [];
    this.savingsCategory = this.findSavingsCategory(this.categories);
    const transactions = payload.transactions ?? [];
    const savingsTransactions = this.filterSavingsTransactions(transactions);
    this.savingsTransactions = this.mapTransactions(savingsTransactions, this.categories);
  }

  private findSavingsCategory(categories: ApiExpenseCategory[]): ApiExpenseCategory | null {
    const match = categories.find((category) => {
      const name = category.name.toLowerCase();
      return name.includes('ahorro') || name.includes('inversion') || name.includes('inversiones');
    });

    return match ?? null;
  }

  private filterSavingsTransactions(transactions: ApiTransaction[]): ApiTransaction[] {
    if (!this.savingsCategory) {
      return [];
    }

    return transactions.filter((transaction) => transaction.category_id === this.savingsCategory?.id);
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

  private createInitialState(): SavingsFormState {
    return {
      amount: null,
      date: this.getTodayDate(),
      etf: '',
      note: '',
      type: 'buy',
    };
  }

  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private formatAmount(amount: number): string {
    const formatter = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    });
    const formatted = formatter.format(Math.abs(amount));
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
}
