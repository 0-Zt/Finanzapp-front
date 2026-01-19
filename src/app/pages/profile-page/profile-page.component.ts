import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { CategoryBudgetsService } from '../../services/category-budgets.service';
import { DashboardService } from '../../services/dashboard.service';
import { BudgetProgressBarComponent } from '../../components/budget-progress-bar/budget-progress-bar.component';
import {
  UserProfile,
  FixedExpense,
  CreateFixedExpensePayload,
  UpdateFixedExpensePayload,
  ApiBudgetProgress,
  ApiBudgetSummary,
  ApiExpenseCategory,
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
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  profile: UserProfile | null = null;
  fixedExpenses: FixedExpense[] = [];
  budgetSummary: ApiBudgetSummary | null = null;
  categories: ApiExpenseCategory[] = [];
  isLoading = true;
  isSavingProfile = false;
  isSavingExpense = false;
  isSavingBudget = false;

  profileForm: FormGroup = this.fb.group({
    fullName: [''],
    monthlySalary: [0, [Validators.min(0)]],
    salaryDay: [1, [Validators.min(1), Validators.max(31)]],
    currency: ['CLP'],
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
    this.loadBudgets();
    this.loadCategories();
  }

  loadProfile(): void {
    this.profileService.getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.profileForm.patchValue({
            fullName: profile.full_name || '',
            monthlySalary: profile.monthly_salary,
            salaryDay: profile.salary_day,
            currency: profile.currency,
          });
          this.isLoading = false;
        },
        error: () => {
          this.toastService.error('Error al cargar el perfil');
          this.isLoading = false;
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

    this.isSavingProfile = true;
    this.profileService.updateProfile(this.profileForm.value)
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

  loadBudgets(): void {
    this.categoryBudgetsService.getProgress()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.budgetSummary = summary;
        },
        error: () => {
          this.toastService.error('Error al cargar los presupuestos');
        },
      });
  }

  loadCategories(): void {
    this.dashboardService.getDashboard(1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.categories = data.categories;
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
    if (budget) {
      this.editingBudgetId = budget.id;
      this.budgetForm.patchValue({
        category_id: budget.category_id,
        budget_amount: budget.budget_amount,
      });
    } else {
      this.editingBudgetId = null;
      this.budgetForm.reset({
        category_id: null,
        budget_amount: 0,
      });
    }
    this.isBudgetFormOpen = true;
  }

  closeBudgetForm(): void {
    this.isBudgetFormOpen = false;
    this.editingBudgetId = null;
    this.budgetForm.reset();
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
