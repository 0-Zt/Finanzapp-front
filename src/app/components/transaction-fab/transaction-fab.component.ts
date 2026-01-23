import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FabComponent } from '../fab/fab.component';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';
import { CategoriesService } from '../../services/categories.service';
import { TransactionsService } from '../../services/transactions.service';
import { TransactionEventsService } from '../../services/transaction-events.service';
import { ToastService } from '../../services/toast.service';
import { ApiExpenseCategory, CreateTransactionPayload } from '../../models/api.models';

@Component({
  selector: 'app-transaction-fab',
  standalone: true,
  imports: [FabComponent, TransactionDialogComponent],
  templateUrl: './transaction-fab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionFabComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly transactionEventsService = inject(TransactionEventsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  categories: ApiExpenseCategory[] = [];
  isDialogOpen = false;
  private categoriesLoaded = false;

  onFabClick(): void {
    if (!this.categoriesLoaded) {
      this.loadCategories();
    } else {
      this.isDialogOpen = true;
    }
  }

  onCreateTransaction(payload: CreateTransactionPayload): void {
    this.transactionsService
      .createTransaction(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDialogOpen = false;
          this.cdr.markForCheck();
          this.toastService.success('Transacción creada correctamente');
          this.transactionEventsService.emitTransactionCreated();
        },
        error: () => {
          this.toastService.error('No se pudo guardar la transacción');
        },
      });
  }

  onCloseDialog(): void {
    this.isDialogOpen = false;
  }

  private loadCategories(): void {
    this.categoriesService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.categoriesLoaded = true;
          this.isDialogOpen = true;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toastService.error('No se pudieron cargar las categorías');
        },
      });
  }
}
