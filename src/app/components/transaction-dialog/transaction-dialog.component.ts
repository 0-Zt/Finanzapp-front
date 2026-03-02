import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogComponent } from '../dialog/dialog.component';
import {
  ApiExpenseCategory,
  ApiTransaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from '../../models/api.models';
import { environment } from '../../../environments/environment';

type TransactionType = 'income' | 'expense';

interface TransactionFormState {
  description: string;
  amount: number | null;
  date: string;
  categoryId: number | null;
  type: TransactionType;
}

@Component({
  selector: 'app-transaction-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  templateUrl: './transaction-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionDialogComponent implements OnChanges {
  @Input({ required: true }) categories: ApiExpenseCategory[] = [];
  @Input() isOpen = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() transaction: ApiTransaction | null = null;
  @Output() createTransaction = new EventEmitter<CreateTransactionPayload>();
  @Output() updateTransaction = new EventEmitter<{ id: number; payload: UpdateTransactionPayload }>();
  @Output() close = new EventEmitter<void>();

  formState: TransactionFormState = this.createInitialState();

  get dialogTitle(): string {
    return this.mode === 'edit' ? 'Editar transacción' : 'Nueva transacción';
  }

  get dialogSubtitle(): string {
    return this.mode === 'edit'
      ? 'Actualiza los datos del movimiento.'
      : 'Registra un gasto o ingreso.';
  }

  get submitLabel(): string {
    return this.mode === 'edit' ? 'Guardar cambios' : 'Guardar';
  }

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
        transaction_date: this.toDateValue(this.formState.date),
        description: this.formState.description.trim(),
        category_id: this.formState.categoryId,
        amount: signedAmount,
        status: this.transaction.status ?? 'completed',
      };

      this.updateTransaction.emit({ id: this.transaction.id, payload });
    } else {
      const payload: CreateTransactionPayload = {
        transaction_date: this.toDateValue(this.formState.date),
        description: this.formState.description.trim(),
        category_id: this.formState.categoryId,
        amount: signedAmount,
        status: 'completed',
      };

      this.createTransaction.emit(payload);
    }

    this.formState = this.createInitialState(this.formState.categoryId);
  }

  onClose(): void {
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
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: environment.defaultTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((part) => part.type === 'year')?.value ?? `${new Date().getUTCFullYear()}`;
    const month = parts.find((part) => part.type === 'month')?.value ?? `${new Date().getUTCMonth() + 1}`.padStart(2, '0');
    const day = parts.find((part) => part.type === 'day')?.value ?? `${new Date().getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDateValue(date: string): string {
    return date.slice(0, 10);
  }
}
