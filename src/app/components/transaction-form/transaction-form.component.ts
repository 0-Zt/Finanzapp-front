import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiExpenseCategory,
  ApiTransaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from '../../models/api.models';

type TransactionType = 'income' | 'expense';

interface TransactionFormState {
  description: string;
  amount: number | null;
  date: string;
  categoryId: number | null;
  type: TransactionType;
}

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionFormComponent implements OnChanges {
  @Input({ required: true }) categories: ApiExpenseCategory[] = [];
  @Input() isOpen = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() transaction: ApiTransaction | null = null;
  @Output() createTransaction = new EventEmitter<CreateTransactionPayload>();
  @Output() updateTransaction = new EventEmitter<{ id: number; payload: UpdateTransactionPayload }>();
  @Output() close = new EventEmitter<void>();

  formState: TransactionFormState = this.createInitialState();

  ngOnChanges(): void {
    if (this.transaction) {
      this.formState = {
        description: this.transaction.description,
        amount: Math.abs(this.transaction.amount),
        date: this.transaction.transaction_date.slice(0, 10),
        categoryId: this.transaction.category_id ?? null,
        type: this.transaction.amount < 0 ? 'expense' : 'income',
      };
      return;
    }

    if (this.isOpen && this.mode === 'create') {
      this.formState = this.createInitialState(this.formState.categoryId);
    }

    if (!this.formState.categoryId && this.categories.length) {
      this.formState = {
        ...this.formState,
        categoryId: this.categories[0].id,
      };
    }
  }

  submit(): void {
    if (!this.formState.description || !this.formState.amount || !this.formState.categoryId) {
      return;
    }

    const normalizedAmount = Math.abs(this.formState.amount);
    const signedAmount = this.formState.type === 'expense' ? -normalizedAmount : normalizedAmount;

    if (this.mode === 'edit' && this.transaction) {
      const payload: UpdateTransactionPayload = {
        transaction_date: this.toIsoDate(this.formState.date),
        description: this.formState.description.trim(),
        category_id: this.formState.categoryId,
        amount: signedAmount,
        status: this.transaction.status ?? 'completed',
      };

      this.updateTransaction.emit({ id: this.transaction.id, payload });
    } else {
      const payload: CreateTransactionPayload = {
        transaction_date: this.toIsoDate(this.formState.date),
        description: this.formState.description.trim(),
        category_id: this.formState.categoryId,
        amount: signedAmount,
        status: 'completed',
      };

      this.createTransaction.emit(payload);
    }

    this.formState = this.createInitialState(this.formState.categoryId);
  }

  cancel(): void {
    this.close.emit();
  }

  private createInitialState(categoryId: number | null = null): TransactionFormState {
    return {
      description: '',
      amount: null,
      date: this.getTodayDate(),
      categoryId,
      type: 'expense',
    };
  }

  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private toIsoDate(date: string): string {
    return new Date(`${date}T00:00:00`).toISOString();
  }
}
