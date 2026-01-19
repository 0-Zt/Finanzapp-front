import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { CategoryBudgetsService } from '../../services/category-budgets.service';
import { CategoriesService } from '../../services/categories.service';
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
  UpdateCategoryBudgetPayload
} from '../../models/api.models';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BudgetProgressBarComponent],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly categoryBudgetsService = inject(CategoryBudgetsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);

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
    isActive: [true],
  });

  editingExpenseId: number | null = null;
  isExpenseFormOpen = false;

  budgetForm: FormGroup = this.fb.group({
    category_id: [null, Validators.required],
    budget_amount: [0, [Validators.required, Validators.min(1)]],
    rollover_enabled: [false],
  });

  editingBudgetId: number | null = null;
  isBudgetFormOpen = false;

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  get userEmail(): string {
    return this.authService.currentUser?.email || '';
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
      this.expenseForm.patchValue({
        description: expense.description,
        amount: expense.amount,
        dueDay: expense.due_day,
        isActive: expense.is_active,
      });
    } else {
      this.editingExpenseId = null;
      this.expenseForm.reset({
        description: '',
        amount: 0,
        dueDay: 1,
        isActive: true,
      });
    }
    this.isExpenseFormOpen = true;
  }

  closeExpenseForm(): void {
    this.isExpenseFormOpen = false;
    this.editingExpenseId = null;
    this.expenseForm.reset();
  }

  onSaveExpense(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSavingExpense = true;
    const formValue = this.expenseForm.value;

    if (this.editingExpenseId) {
      const payload: UpdateFixedExpensePayload = {
        description: formValue.description,
        amount: formValue.amount,
        dueDay: formValue.dueDay,
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
        amount: formValue.amount,
        dueDay: formValue.dueDay,
        isActive: formValue.isActive,
      };

      this.profileService.createFixedExpense(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success('Gasto fijo creado');
            this.closeExpenseForm();
            this.loadFixedExpenses();
            this.isSavingExpense = false;
          },
          error: () => {
            this.toastService.error('Error al crear el gasto fijo');
            this.isSavingExpense = false;
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

  getTotalFixedExpenses(): number {
    return this.fixedExpenses
      .filter((e) => e.is_active)
      .reduce((sum, e) => sum + e.amount, 0);
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
}
