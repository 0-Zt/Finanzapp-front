import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CreditCardsService } from '../../services/credit-cards.service';
import { CategoriesService } from '../../services/categories.service';
import {
  ApiCreditCardWithSummary,
  ApiCreditCardTransaction,
  ApiExpenseCategory,
  CreditCardsSummary,
  CreateCreditCardPayload,
  UpdateCreditCardPayload,
  CreateCardTransactionPayload,
  CreateCardPaymentPayload,
} from '../../models/api.models';

interface CardFormState {
  name: string;
  bank_name: string;
  last_four_digits: string;
  card_type: string;
  credit_limit: number | null;
  billing_cycle_day: number | null;
  payment_due_day: number | null;
  color: string;
}

interface TransactionFormState {
  credit_card_id: number | null;
  transaction_date: string;
  description: string;
  amount: number | null;
  category_id: number | null;
  installments: number;
  notes: string;
}

interface PaymentFormState {
  credit_card_id: number | null;
  payment_date: string;
  amount: number | null;
  payment_type: string;
  notes: string;
}

type ActiveView = 'cards' | 'transactions';
type FormType = 'card' | 'transaction' | 'payment' | null;

@Component({
  selector: 'app-credit-cards-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credit-cards-page.component.html',
})
export class CreditCardsPageComponent implements OnInit {
  private readonly creditCardsService = inject(CreditCardsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);

  // Data
  cardsSummary: CreditCardsSummary | null = null;
  selectedCard: ApiCreditCardWithSummary | null = null;
  cardTransactions: ApiCreditCardTransaction[] = [];
  categories: ApiExpenseCategory[] = [];

  // UI State
  isLoading = true;
  errorMessage = '';
  activeView: ActiveView = 'cards';
  activeForm: FormType = null;
  formMode: 'create' | 'edit' = 'create';
  editingCard: ApiCreditCardWithSummary | null = null;

  // Form States
  cardForm: CardFormState = this.createInitialCardForm();
  transactionForm: TransactionFormState = this.createInitialTransactionForm();
  paymentForm: PaymentFormState = this.createInitialPaymentForm();

  // Card type options
  cardTypes = [
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' },
    { value: 'amex', label: 'American Express' },
    { value: 'other', label: 'Otra' },
  ];

  // Color options
  cardColors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#0ea5e9', // Sky
    '#1e293b', // Slate dark
  ];

  ngOnInit(): void {
    this.loadData();
  }

  // ==================== COMPUTED ====================

  get cards(): ApiCreditCardWithSummary[] {
    return this.cardsSummary?.cards ?? [];
  }

  get totals() {
    return this.cardsSummary?.totals ?? {
      total_balance: 0,
      total_limit: 0,
      total_available: 0,
      card_count: 0,
    };
  }

  get totalUtilization(): number {
    if (!this.totals.total_limit) return 0;
    return Math.round((this.totals.total_balance / this.totals.total_limit) * 100);
  }

  // ==================== DATA LOADING ====================

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.creditCardsService
      .getCardsSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.cardsSummary = data;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar las tarjetas.';
          this.isLoading = false;
        },
      });

    this.categoriesService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories = categories ?? [];
        },
      });
  }

  private loadCardTransactions(cardId: number): void {
    this.creditCardsService
      .getCardTransactions(cardId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (transactions) => {
          this.cardTransactions = transactions ?? [];
        },
        error: () => {
          this.cardTransactions = [];
        },
      });
  }

  // ==================== VIEW NAVIGATION ====================

  onSelectCard(card: ApiCreditCardWithSummary): void {
    this.selectedCard = card;
    this.activeView = 'transactions';
    this.loadCardTransactions(card.id);
  }

  onBackToCards(): void {
    this.selectedCard = null;
    this.activeView = 'cards';
    this.cardTransactions = [];
  }

  // ==================== CARD FORM ====================

  onOpenCreateCard(): void {
    this.formMode = 'create';
    this.editingCard = null;
    this.cardForm = this.createInitialCardForm();
    this.activeForm = 'card';
  }

  onEditCard(card: ApiCreditCardWithSummary): void {
    this.formMode = 'edit';
    this.editingCard = card;
    this.cardForm = {
      name: card.name,
      bank_name: card.bank_name,
      last_four_digits: card.last_four_digits ?? '',
      card_type: card.card_type,
      credit_limit: card.credit_limit,
      billing_cycle_day: card.billing_cycle_day ?? null,
      payment_due_day: card.payment_due_day ?? null,
      color: card.color,
    };
    this.activeForm = 'card';
  }

  onDeleteCard(card: ApiCreditCardWithSummary): void {
    if (!confirm(`¿Eliminar la tarjeta "${card.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.isLoading = true;
    this.creditCardsService
      .deleteCard(card.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadData();
        },
        error: () => {
          this.errorMessage = 'No se pudo eliminar la tarjeta.';
          this.isLoading = false;
        },
      });
  }

  onSubmitCard(): void {
    if (!this.cardForm.name || !this.cardForm.bank_name) {
      return;
    }

    const payload: CreateCreditCardPayload = {
      name: this.cardForm.name.trim(),
      bank_name: this.cardForm.bank_name.trim(),
      last_four_digits: this.cardForm.last_four_digits?.trim() || undefined,
      card_type: this.cardForm.card_type,
      credit_limit: this.cardForm.credit_limit ?? 0,
      billing_cycle_day: this.cardForm.billing_cycle_day ?? undefined,
      payment_due_day: this.cardForm.payment_due_day ?? undefined,
      color: this.cardForm.color,
    };

    this.isLoading = true;

    if (this.formMode === 'edit' && this.editingCard) {
      this.creditCardsService
        .updateCard(this.editingCard.id, payload as UpdateCreditCardPayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.onCloseForm();
            this.loadData();
          },
          error: () => {
            this.errorMessage = 'No se pudo actualizar la tarjeta.';
            this.isLoading = false;
          },
        });
    } else {
      this.creditCardsService
        .createCard(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.onCloseForm();
            this.loadData();
          },
          error: () => {
            this.errorMessage = 'No se pudo crear la tarjeta.';
            this.isLoading = false;
          },
        });
    }
  }

  // ==================== TRANSACTION FORM ====================

  onOpenCreateTransaction(): void {
    this.transactionForm = this.createInitialTransactionForm();
    if (this.selectedCard) {
      this.transactionForm.credit_card_id = this.selectedCard.id;
    }
    this.activeForm = 'transaction';
  }

  onSubmitTransaction(): void {
    if (
      !this.transactionForm.credit_card_id ||
      !this.transactionForm.description ||
      !this.transactionForm.amount
    ) {
      return;
    }

    const payload: CreateCardTransactionPayload = {
      credit_card_id: this.transactionForm.credit_card_id,
      transaction_date: this.transactionForm.transaction_date,
      description: this.transactionForm.description.trim(),
      amount: this.transactionForm.amount,
      category_id: this.transactionForm.category_id ?? undefined,
      installments: this.transactionForm.installments,
      notes: this.transactionForm.notes?.trim() || undefined,
    };

    this.isLoading = true;
    this.creditCardsService
      .createTransaction(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.onCloseForm();
          this.loadData();
          if (this.selectedCard) {
            this.loadCardTransactions(this.selectedCard.id);
          }
        },
        error: () => {
          this.errorMessage = 'No se pudo registrar el gasto.';
          this.isLoading = false;
        },
      });
  }

  onDeleteTransaction(transaction: ApiCreditCardTransaction): void {
    if (!confirm('¿Eliminar esta transacción?')) {
      return;
    }

    this.creditCardsService
      .deleteTransaction(transaction.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadData();
          if (this.selectedCard) {
            this.loadCardTransactions(this.selectedCard.id);
          }
        },
        error: () => {
          this.errorMessage = 'No se pudo eliminar la transacción.';
        },
      });
  }

  // ==================== PAYMENT FORM ====================

  onOpenCreatePayment(): void {
    this.paymentForm = this.createInitialPaymentForm();
    if (this.selectedCard) {
      this.paymentForm.credit_card_id = this.selectedCard.id;
      this.paymentForm.amount = this.selectedCard.current_balance;
    }
    this.activeForm = 'payment';
  }

  onSubmitPayment(): void {
    if (!this.paymentForm.credit_card_id || !this.paymentForm.amount) {
      return;
    }

    const payload: CreateCardPaymentPayload = {
      credit_card_id: this.paymentForm.credit_card_id,
      payment_date: this.paymentForm.payment_date,
      amount: this.paymentForm.amount,
      payment_type: this.paymentForm.payment_type,
      notes: this.paymentForm.notes?.trim() || undefined,
    };

    this.isLoading = true;
    this.creditCardsService
      .createPayment(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.onCloseForm();
          this.loadData();
          if (this.selectedCard) {
            this.loadCardTransactions(this.selectedCard.id);
          }
        },
        error: () => {
          this.errorMessage = 'No se pudo registrar el pago.';
          this.isLoading = false;
        },
      });
  }

  // ==================== FORM UTILITIES ====================

  onCloseForm(): void {
    this.activeForm = null;
    this.editingCard = null;
    this.formMode = 'create';
  }

  selectColor(color: string): void {
    this.cardForm.color = color;
  }

  private createInitialCardForm(): CardFormState {
    return {
      name: '',
      bank_name: '',
      last_four_digits: '',
      card_type: 'visa',
      credit_limit: null,
      billing_cycle_day: null,
      payment_due_day: null,
      color: '#6366f1',
    };
  }

  private createInitialTransactionForm(): TransactionFormState {
    return {
      credit_card_id: null,
      transaction_date: this.getTodayDate(),
      description: '',
      amount: null,
      category_id: null,
      installments: 1,
      notes: '',
    };
  }

  private createInitialPaymentForm(): PaymentFormState {
    return {
      credit_card_id: null,
      payment_date: this.getTodayDate(),
      amount: null,
      payment_type: 'full',
      notes: '',
    };
  }

  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // ==================== HELPERS ====================

  getUtilizationClass(percentage: number): string {
    if (percentage >= 90) return 'bg-rose-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-emerald-400';
  }

  getUtilizationTextClass(percentage: number): string {
    if (percentage >= 90) return 'text-rose-500';
    if (percentage >= 70) return 'text-amber-500';
    return 'text-emerald-500';
  }

  getCategoryName(categoryId: number | null | undefined): string {
    if (!categoryId) return 'Sin categoría';
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.name ?? 'Sin categoría';
  }

  formatCardNumber(lastFour: string | null | undefined): string {
    if (!lastFour) return '•••• ••••';
    return `•••• ${lastFour}`;
  }
}
