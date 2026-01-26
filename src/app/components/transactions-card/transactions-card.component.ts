import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Transaction, TransactionFilters } from '../../models/dashboard.models';
import { ApiExpenseCategory } from '../../models/api.models';
import { CategoryIconComponent } from '../category-icon/category-icon.component';

@Component({
  selector: 'app-transactions-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CategoryIconComponent],
  templateUrl: './transactions-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsCardComponent {
  @Input({ required: true }) transactions: Transaction[] = [];
  @Input() categories: ApiExpenseCategory[] = [];
  @Input() showFilters = true;
  @Input() filters: TransactionFilters = {
    search: '',
    categoryId: 'all',
    type: 'all',
    month: 'all',
    status: 'all',
  };
  @Input() monthOptions: Array<{ value: string; label: string }> = [];
  @Input() hasMore = false;
  @Input() title = 'Movimientos recientes';
  @Input() description = 'Detalle de las últimas transacciones y categorías.';
  @Input() actionLabel = 'Ver todo';
  @Input() actionLink: string | null = null;
  @Input() actionQueryParams: Record<string, string | number | boolean> | null = null;
  @Output() filtersChange = new EventEmitter<TransactionFilters>();
  @Output() loadMore = new EventEmitter<void>();
  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();

  readonly categoryClasses: Record<string, string> = {
    Comida:
      'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    Servicios:
      'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    Entretenimiento:
      'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    Salud:
      'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
    Transporte:
      'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
    Ingresos:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  };

  readonly iconMap: Record<string, string> = {
    utensils: 'CM',
    bolt: 'SV',
    sparkles: 'EN',
    heart: 'SL',
    bus: 'TR',
    wallet: 'IN',
    'piggy-bank': 'AH',
    'chart-line': 'IV',
  };

  categoryClass(category: string): string {
    return (
      this.categoryClasses[category] ??
      'bg-slate-100/80 text-slate-600 dark:bg-white/10 dark:text-slate-200'
    );
  }

  onSearchChange(value: string): void {
    this.filtersChange.emit({ ...this.filters, search: value });
  }

  onCategoryChange(value: number | 'all'): void {
    this.filtersChange.emit({ ...this.filters, categoryId: value });
  }

  onTypeChange(value: 'all' | 'income' | 'expense'): void {
    this.filtersChange.emit({ ...this.filters, type: value });
  }

  onMonthChange(value: string | 'all'): void {
    this.filtersChange.emit({ ...this.filters, month: value });
  }

  onStatusChange(value: 'all' | 'completed' | 'pending'): void {
    this.filtersChange.emit({ ...this.filters, status: value });
  }

  categoryStyle(transaction: Transaction): Record<string, string> {
    if (!transaction.categoryColor) {
      return {};
    }

    return {
      backgroundColor: `${transaction.categoryColor}1F`,
      borderColor: `${transaction.categoryColor}4D`,
      color: transaction.categoryColor,
    };
  }

  categoryIcon(transaction: Transaction): string | null {
    if (!transaction.categoryIcon) {
      return null;
    }

    return this.iconMap[transaction.categoryIcon] ?? transaction.categoryIcon.slice(0, 1).toUpperCase();
  }

  amountClass(type: Transaction['type']): string {
    // Enhanced colors for better visibility on low brightness screens
    // Using 600 variants in light mode for WCAG AA compliance
    return type === 'expense'
      ? 'text-red-600 dark:text-red-400'       // Red-600 has 4.5:1 contrast on white
      : 'text-emerald-600 dark:text-emerald-400'; // Emerald-600 has 4.5:1 contrast
  }
}
