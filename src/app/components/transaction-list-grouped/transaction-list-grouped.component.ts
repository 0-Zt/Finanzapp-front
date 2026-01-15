import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transaction, TransactionGroup, PaginationState } from '../../models/dashboard.models';
import { CategoryIconComponent } from '../category-icon/category-icon.component';

@Component({
  selector: 'app-transaction-list-grouped',
  standalone: true,
  imports: [CommonModule, CategoryIconComponent],
  templateUrl: './transaction-list-grouped.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionListGroupedComponent {
  @Input({ required: true }) groups: TransactionGroup[] = [];
  @Input({ required: true }) pagination!: PaginationState;
  @Input() isLoading = false;

  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();
  @Output() pageChange = new EventEmitter<number>();

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.pagination.totalPages;
    const current = this.pagination.currentPage;

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, -1, total);
      } else if (current >= total - 2) {
        pages.push(1, -1, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, total);
      }
    }

    return pages;
  }

  onPrevPage(): void {
    if (this.pagination.currentPage > 1) {
      this.pageChange.emit(this.pagination.currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.pagination.currentPage < this.pagination.totalPages) {
      this.pageChange.emit(this.pagination.currentPage + 1);
    }
  }

  onPageClick(page: number): void {
    if (page > 0 && page !== this.pagination.currentPage) {
      this.pageChange.emit(page);
    }
  }

  categoryStyle(transaction: Transaction): Record<string, string> {
    if (!transaction.categoryColor) {
      return {};
    }

    return {
      backgroundColor: `${transaction.categoryColor}1A`,
      color: transaction.categoryColor,
    };
  }

  amountClass(type: Transaction['type']): string {
    return type === 'expense'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-emerald-600 dark:text-emerald-400';
  }

  trackByGroupKey(_: number, group: TransactionGroup): string {
    return group.key;
  }

  trackByTransactionId(_: number, transaction: Transaction): string {
    return transaction.id;
  }
}
