import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { CategoryBudgetsService } from '../../services/category-budgets.service';
import { CategoriesService } from '../../services/categories.service';
import { TransactionsService } from '../../services/transactions.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { BudgetProgressBarComponent } from '../../components/budget-progress-bar/budget-progress-bar.component';
import {
  UserProfile,
  FixedExpense,
  CreateFixedExpensePayload,
  UpdateFixedExpensePayload,
  ApiBudgetProgress,
  ApiBudgetSummary,
  ApiExpenseCategory,
  ApiSuggestedBudget,
  CreateCategoryBudgetPayload,
  UpdateCategoryBudgetPayload,
  NotificationPreferences,
  CreateTransactionPayload
} from '../../models/api.models';

export type ProfileSection = 'personal' | 'fixed-expenses' | 'budgets' | 'notifications';

export interface ProfileMenuItem {
  id: ProfileSection;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BudgetProgressBarComponent, PageHeaderComponent],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly categoryBudgetsService = inject(CategoryBudgetsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Navigation
  activeSection: ProfileSection = 'personal';
  menuItems: ProfileMenuItem[] = [
    {
      id: 'personal',
      label: 'Informacion personal',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      description: 'Datos basicos y configuracion'
    },
    {
      id: 'fixed-expenses',
      label: 'Gastos fijos',
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      description: 'Pagos recurrentes mensuales'
    },
    {
      id: 'budgets',
      label: 'Presupuestos',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      description: 'Limites por categoria'
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
      description: 'Alertas y recordatorios'
    }
  ];

  profile: UserProfile | null = null;
  fixedExpenses: FixedExpense[] = [];
  budgetSummary: ApiBudgetSummary | null = null;
  categories: ApiExpenseCategory[] = [];
  selectedBudgetSuggestion: ApiSuggestedBudget | null = null;
  isLoading = true;
  isSavingProfile = false;
  isSavingExpense = false;
  isSavingBudget = false;
  private readonly defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  private profileTimeZone = this.defaultTimeZone;
  selectedBudgetMonth = this.getCurrentMonth(this.defaultTimeZone);

  profileForm: FormGroup = this.fb.group({
    fullName: [''],
    monthlySalary: [0, [Validators.min(0)]],
    salaryDay: [1, [Validators.min(1), Validators.max(31)]],
    currency: ['CLP'],
    timezone: [this.defaultTimeZone],
    budgetWarningThreshold: [80, [Validators.min(0), Validators.max(100)]],
    budgetExceededThreshold: [100, [Validators.min(0), Validators.max(100)]],
  });

  expenseForm: FormGroup = this.fb.group({
    description: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
    dueDay: [1, [Validators.min(1), Validators.max(31)]],
    categoryId: [null],
    isActive: [true],
    applyToCurrentMonth: [false],
  });

  editingExpenseId: number | null = null;
  isExpenseFormOpen = false;
  private applyToCurrentMonthTouched = false;

  budgetForm: FormGroup = this.fb.group({
    category_id: [null, Validators.required],
    budget_amount: [0, [Validators.required, Validators.min(1)]],
    rollover_enabled: [false],
  });

  editingBudgetId: number | null = null;
  isBudgetFormOpen = false;

  // Notification preferences
  notificationPreferencesForm: FormGroup = this.fb.group({
    budget_warning: [true],
    budget_exceeded: [true],
    payment_reminder: [true],
    payment_reminder_days: [3, [Validators.min(1), Validators.max(30)]],
    goal_deadline: [true],
    goal_deadline_days: [7, [Validators.min(1), Validators.max(30)]],
    card_payment_due: [true],
    card_payment_due_days: [3, [Validators.min(1), Validators.max(30)]],
    fixed_expense_due: [true],
    fixed_expense_due_days: [2, [Validators.min(1), Validators.max(30)]],
  });
  isSavingNotificationPreferences = false;

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  get userEmail(): string {
    return this.authService.currentUser?.email || '';
  }

  setActiveSection(section: ProfileSection): void {
    this.activeSection = section;
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadFixedExpenses();
    this.loadCategories();
    this.budgetForm.get('category_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categoryId) => {
        if (this.editingBudgetId) {
          this.selectedBudgetSuggestion = null;
          return;
        }
        this.selectedBudgetSuggestion = this.getSuggestedBudget(categoryId ?? null);
      });
    this.expenseForm.get('dueDay')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (this.editingExpenseId || this.applyToCurrentMonthTouched) {
          return;
        }
        const dueDay = this.normalizeDueDay(value);
        const shouldApply = this.shouldApplyToCurrentMonth(dueDay);
        this.expenseForm.patchValue({ applyToCurrentMonth: shouldApply }, { emitEvent: false });
      });
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const section = params.get('section');
        if (this.isProfileSection(section)) {
          this.setActiveSection(section);
        }
      });
  }

  private isProfileSection(section: string | null): section is ProfileSection {
    if (!section) {
      return false;
    }
    return this.menuItems.some((item) => item.id === section);
  }

  loadProfile(): void {
    this.profileService.getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          const resolvedTimeZone = profile.timezone || this.defaultTimeZone;
          this.profileTimeZone = resolvedTimeZone;
          const warningThreshold = profile.budget_warning_threshold ?? 80;
          const exceededThreshold = profile.budget_exceeded_threshold ?? 100;
          this.profileForm.patchValue({
            fullName: profile.full_name || '',
            monthlySalary: profile.monthly_salary,
            salaryDay: profile.salary_day,
            currency: profile.currency,
            timezone: resolvedTimeZone,
            budgetWarningThreshold: warningThreshold,
            budgetExceededThreshold: exceededThreshold,
          });
          // Load notification preferences
          if (profile.notification_preferences) {
            this.notificationPreferencesForm.patchValue({
              budget_warning: profile.notification_preferences.budget_warning ?? true,
              budget_exceeded: profile.notification_preferences.budget_exceeded ?? true,
              payment_reminder: profile.notification_preferences.payment_reminder ?? true,
              payment_reminder_days: profile.notification_preferences.payment_reminder_days ?? 3,
              goal_deadline: profile.notification_preferences.goal_deadline ?? true,
              goal_deadline_days: profile.notification_preferences.goal_deadline_days ?? 7,
              card_payment_due: profile.notification_preferences.card_payment_due ?? true,
              card_payment_due_days: profile.notification_preferences.card_payment_due_days ?? 3,
              fixed_expense_due: profile.notification_preferences.fixed_expense_due ?? true,
              fixed_expense_due_days: profile.notification_preferences.fixed_expense_due_days ?? 2,
            });
          }
          const currentMonth = this.getCurrentMonth(resolvedTimeZone);
          if (this.selectedBudgetMonth !== currentMonth) {
            this.selectedBudgetMonth = currentMonth;
          }
          this.isLoading = false;
          this.loadBudgets();
        },
        error: () => {
          this.toastService.error('Error al cargar el perfil');
          this.isLoading = false;
          this.loadBudgets();
        },
      });
  }

  loadFixedExpenses(): void {
    this.profileService.getFixedExpenses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (expenses) => {
          this.fixedExpenses = expenses;
        },
        error: () => {
          this.toastService.error('Error al cargar los gastos fijos');
        },
      });
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    const formValue = this.profileForm.value;
    const warningThreshold = Number(formValue.budgetWarningThreshold);
    const exceededThreshold = Number(formValue.budgetExceededThreshold);

    if (Number.isFinite(warningThreshold) && Number.isFinite(exceededThreshold) && warningThreshold >= exceededThreshold) {
      this.toastService.error('El umbral de alerta debe ser menor que el de exceso.');
      return;
    }

    this.isSavingProfile = true;
    this.profileService.updateProfile({
      fullName: formValue.fullName,
      monthlySalary: formValue.monthlySalary,
      salaryDay: formValue.salaryDay,
      currency: formValue.currency,
      timezone: formValue.timezone || this.defaultTimeZone,
      budgetWarningThreshold: Number.isFinite(warningThreshold) ? warningThreshold : undefined,
      budgetExceededThreshold: Number.isFinite(exceededThreshold) ? exceededThreshold : undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.toastService.success('Perfil actualizado correctamente');
          this.isSavingProfile = false;
        },
        error: () => {
          this.toastService.error('Error al actualizar el perfil');
          this.isSavingProfile = false;
        },
      });
  }

  openExpenseForm(expense?: FixedExpense): void {
    if (expense) {
      this.editingExpenseId = expense.id;
      this.applyToCurrentMonthTouched = false;
      this.expenseForm.patchValue({
        description: expense.description,
        amount: expense.amount,
        dueDay: expense.due_day,
        categoryId: expense.category_id ?? null,
        isActive: expense.is_active,
        applyToCurrentMonth: false,
      });
    } else {
      this.editingExpenseId = null;
      this.applyToCurrentMonthTouched = false;
      this.expenseForm.reset({
        description: '',
        amount: 0,
        dueDay: 1,
        categoryId: null,
        isActive: true,
        applyToCurrentMonth: this.shouldApplyToCurrentMonth(1),
      });
    }
    this.isExpenseFormOpen = true;
  }

  closeExpenseForm(): void {
    this.isExpenseFormOpen = false;
    this.editingExpenseId = null;
    this.applyToCurrentMonthTouched = false;
    this.expenseForm.reset();
  }

  onApplyToCurrentMonthTouched(): void {
    this.applyToCurrentMonthTouched = true;
  }

  onSaveExpense(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSavingExpense = true;
    const formValue = this.expenseForm.value;
    const amount = Number(formValue.amount) || 0;
    const dueDay = this.normalizeDueDay(formValue.dueDay);
    const shouldRegisterTransaction =
      !this.editingExpenseId &&
      !!formValue.applyToCurrentMonth &&
      amount > 0;
    const transactionPayload = shouldRegisterTransaction
      ? this.buildFixedExpenseTransactionPayload({
          description: String(formValue.description || '').trim(),
          amount,
          dueDay,
          categoryId: formValue.categoryId ?? null,
        })
      : null;

    if (this.editingExpenseId) {
      const payload: UpdateFixedExpensePayload = {
        description: formValue.description,
        amount: formValue.amount,
        dueDay: formValue.dueDay,
        categoryId: formValue.categoryId ?? undefined,
        isActive: formValue.isActive,
      };

      this.profileService.updateFixedExpense(this.editingExpenseId, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success('Gasto fijo actualizado');
            this.closeExpenseForm();
            this.loadFixedExpenses();
            this.isSavingExpense = false;
          },
          error: () => {
            this.toastService.error('Error al actualizar el gasto fijo');
            this.isSavingExpense = false;
          },
        });
    } else {
      const payload: CreateFixedExpensePayload = {
        description: formValue.description,
        amount,
        dueDay,
        categoryId: formValue.categoryId ?? undefined,
        isActive: formValue.isActive,
      };

      const registerTransaction$ = shouldRegisterTransaction && transactionPayload
        ? this.transactionsService.createTransaction(transactionPayload).pipe(
            map(() => ({ transactionCreated: true })),
            catchError(() => of({ transactionCreated: false }))
          )
        : of({ transactionCreated: null });

      this.profileService.createFixedExpense(payload)
        .pipe(
          switchMap(() => registerTransaction$),
          finalize(() => {
            this.isSavingExpense = false;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (result) => {
            if (shouldRegisterTransaction) {
              if (result.transactionCreated) {
                this.toastService.success('Gasto fijo creado y cobro registrado');
              } else {
                this.toastService.success('Gasto fijo creado');
                this.toastService.error('No se pudo registrar el cobro de este mes');
              }
            } else {
              this.toastService.success('Gasto fijo creado');
            }
            this.closeExpenseForm();
            this.loadFixedExpenses();
          },
          error: () => {
            this.toastService.error('Error al crear el gasto fijo');
          },
        });
    }
  }

  onDeleteExpense(expense: FixedExpense): void {
    if (!confirm(`Eliminar "${expense.description}"?`)) {
      return;
    }

    this.profileService.deleteFixedExpense(expense.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Gasto fijo eliminado');
          this.loadFixedExpenses();
        },
        error: () => {
          this.toastService.error('Error al eliminar el gasto fijo');
        },
      });
  }

  formatCurrency(amount: number): string {
    return this.currencyFormatter.format(amount);
  }

  get currentFixedExpenseDueDate(): string | null {
    if (this.editingExpenseId) {
      return null;
    }
    const dueDay = this.normalizeDueDay(this.expenseForm.get('dueDay')?.value);
    return this.buildFixedExpenseDueDate(dueDay);
  }

  get isFixedExpenseDueDatePassed(): boolean {
    if (this.editingExpenseId) {
      return false;
    }
    const dueDay = this.normalizeDueDay(this.expenseForm.get('dueDay')?.value);
    return this.isDueDayPastOrToday(dueDay);
  }

  getTotalFixedExpenses(): number {
    return this.fixedExpenses
      .filter((e) => e.is_active)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getExpenseCategoryName(categoryId: number | null): string {
    if (!categoryId) {
      return 'Sin categoria';
    }
    const match = this.categories.find((category) => category.id === categoryId);
    return match?.name ?? 'Sin categoria';
  }

  onBudgetMonthChange(month: string): void {
    if (!month) return;
    this.selectedBudgetMonth = month;
    this.loadBudgets();
  }

  getSuggestedBudget(categoryId: number | null): ApiSuggestedBudget | null {
    if (!this.budgetSummary || categoryId === null) return null;
    return this.budgetSummary.suggested_budgets.find((suggestion) => suggestion.category_id === categoryId) || null;
  }

  applySuggestedBudget(suggestion: ApiSuggestedBudget): void {
    this.selectedBudgetSuggestion = suggestion;
    this.editingBudgetId = null;
    this.budgetForm.patchValue({
      category_id: suggestion.category_id,
      budget_amount: suggestion.average_spent,
      rollover_enabled: false,
    });
    this.isBudgetFormOpen = true;
  }

  useSuggestionAmount(): void {
    if (!this.selectedBudgetSuggestion) return;
    this.budgetForm.patchValue({
      budget_amount: this.selectedBudgetSuggestion.average_spent,
    });
  }

  formatBudgetMonthLabel(month: string): string {
    return month;
  }

  private getCurrentMonth(timeZone: string): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((part) => part.type === 'year')?.value ?? `${new Date().getUTCFullYear()}`;
    const month = parts.find((part) => part.type === 'month')?.value ?? `${new Date().getUTCMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}`;
  }

  private normalizeDueDay(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 1;
    }
    return Math.min(Math.max(Math.round(parsed), 1), 31);
  }

  private shouldApplyToCurrentMonth(dueDay: number): boolean {
    return this.isDueDayPastOrToday(dueDay);
  }

  private isDueDayPastOrToday(dueDay: number): boolean {
    const { day } = this.getCurrentDateParts(this.profileTimeZone);
    return dueDay <= day;
  }

  private buildFixedExpenseDueDate(dueDay: number): string {
    const { year, month } = this.getCurrentDateParts(this.profileTimeZone);
    const safeDay = this.getSafeDueDay(dueDay, year, month);
    return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
  }

  private getSafeDueDay(dueDay: number, year: number, month: number): number {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Math.min(Math.max(dueDay, 1), daysInMonth);
  }

  private getCurrentDateParts(timeZone: string): { year: number; month: number; day: number } {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year = Number(parts.find((part) => part.type === 'year')?.value ?? new Date().getUTCFullYear());
    const month = Number(parts.find((part) => part.type === 'month')?.value ?? new Date().getUTCMonth() + 1);
    const day = Number(parts.find((part) => part.type === 'day')?.value ?? new Date().getUTCDate());
    return { year, month, day };
  }

  private buildFixedExpenseTransactionPayload(input: {
    description: string;
    amount: number;
    dueDay: number;
    categoryId: number | null;
  }): CreateTransactionPayload {
    const dueDate = this.buildFixedExpenseDueDate(input.dueDay);
    const amount = Math.abs(input.amount);
    return {
      transaction_date: new Date(`${dueDate}T00:00:00`).toISOString(),
      description: input.description,
      category_id: input.categoryId ?? null,
      amount: amount * -1,
      status: this.isDueDayPastOrToday(input.dueDay) ? 'completed' : 'pending',
    };
  }

  loadBudgets(): void {
    this.categoryBudgetsService.getProgress(this.selectedBudgetMonth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.budgetSummary = summary;
          this.selectedBudgetSuggestion = null;
        },
        error: () => {
          this.toastService.error('Error al cargar los presupuestos');
        },
      });
  }

  loadCategories(): void {
    this.categoriesService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: () => {
          this.toastService.error('Error al cargar las categorias');
        },
      });
  }

  get availableCategories(): ApiExpenseCategory[] {
    if (!this.budgetSummary) return this.categories;
    const usedCategoryIds = new Set(this.budgetSummary.budgets.map(b => b.category_id));
    if (this.editingBudgetId) {
      const editingBudget = this.budgetSummary.budgets.find(b => b.id === this.editingBudgetId);
      if (editingBudget) {
        usedCategoryIds.delete(editingBudget.category_id);
      }
    }
    return this.categories.filter(c => !usedCategoryIds.has(c.id));
  }

  get editingBudgetCategoryName(): string {
    if (!this.editingBudgetId || !this.budgetSummary) return '';
    const budget = this.budgetSummary.budgets.find(b => b.id === this.editingBudgetId);
    return budget?.category_name || '';
  }

  openBudgetForm(budget?: ApiBudgetProgress): void {
    this.selectedBudgetSuggestion = null;
    if (budget) {
      this.editingBudgetId = budget.id;
      this.budgetForm.patchValue({
        category_id: budget.category_id,
        budget_amount: budget.budget_amount,
        rollover_enabled: budget.rollover_enabled,
      });
    } else {
      this.editingBudgetId = null;
      this.budgetForm.reset({
        category_id: null,
        budget_amount: 0,
        rollover_enabled: false,
      });
    }
    this.isBudgetFormOpen = true;
  }

  closeBudgetForm(): void {
    this.isBudgetFormOpen = false;
    this.editingBudgetId = null;
    this.budgetForm.reset({
      category_id: null,
      budget_amount: 0,
      rollover_enabled: false,
    });
    this.selectedBudgetSuggestion = null;
  }

  onSaveBudget(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    this.isSavingBudget = true;
    const formValue = this.budgetForm.value;

    if (this.editingBudgetId) {
      const payload: UpdateCategoryBudgetPayload = {
        budget_amount: formValue.budget_amount,
        rollover_enabled: formValue.rollover_enabled,
      };

      this.categoryBudgetsService.updateBudget(this.editingBudgetId, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success('Presupuesto actualizado');
            this.closeBudgetForm();
            this.loadBudgets();
            this.isSavingBudget = false;
          },
          error: () => {
            this.toastService.error('Error al actualizar el presupuesto');
            this.isSavingBudget = false;
          },
        });
    } else {
      const payload: CreateCategoryBudgetPayload = {
        category_id: formValue.category_id,
        budget_amount: formValue.budget_amount,
        budget_month: this.selectedBudgetMonth,
        rollover_enabled: formValue.rollover_enabled,
      };

      this.categoryBudgetsService.createBudget(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success('Presupuesto creado');
            this.closeBudgetForm();
            this.loadBudgets();
            this.isSavingBudget = false;
          },
          error: () => {
            this.toastService.error('Error al crear el presupuesto');
            this.isSavingBudget = false;
          },
        });
    }
  }

  onDeleteBudget(budget: ApiBudgetProgress): void {
    if (!confirm(`Eliminar presupuesto de "${budget.category_name}"?`)) {
      return;
    }

    this.categoryBudgetsService.deleteBudget(budget.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Presupuesto eliminado');
          this.loadBudgets();
        },
        error: () => {
          this.toastService.error('Error al eliminar el presupuesto');
        },
      });
  }

  onSaveNotificationPreferences(): void {
    if (this.notificationPreferencesForm.invalid) {
      return;
    }

    this.isSavingNotificationPreferences = true;
    const formValue = this.notificationPreferencesForm.value;

    const notificationPreferences: NotificationPreferences = {
      budget_warning: formValue.budget_warning,
      budget_exceeded: formValue.budget_exceeded,
      payment_reminder: formValue.payment_reminder,
      payment_reminder_days: formValue.payment_reminder_days,
      goal_deadline: formValue.goal_deadline,
      goal_deadline_days: formValue.goal_deadline_days,
      card_payment_due: formValue.card_payment_due,
      card_payment_due_days: formValue.card_payment_due_days,
      fixed_expense_due: formValue.fixed_expense_due,
      fixed_expense_due_days: formValue.fixed_expense_due_days,
    };

    this.profileService.updateProfile({ notificationPreferences })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.toastService.success('Preferencias de notificaciones actualizadas');
          this.isSavingNotificationPreferences = false;
        },
        error: () => {
          this.toastService.error('Error al actualizar las preferencias');
          this.isSavingNotificationPreferences = false;
        },
      });
  }
}
