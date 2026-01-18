import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { UserProfile, FixedExpense, CreateFixedExpensePayload, UpdateFixedExpensePayload } from '../../models/api.models';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  profile: UserProfile | null = null;
  fixedExpenses: FixedExpense[] = [];
  isLoading = true;
  isSavingProfile = false;
  isSavingExpense = false;

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
}
