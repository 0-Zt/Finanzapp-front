import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { CreateFixedExpensePayload, UpdateProfilePayload } from '../../models/api.models';

interface OnboardingStep {
  title: string;
  description: string;
}

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './onboarding-page.component.html',
})
export class OnboardingPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly steps: OnboardingStep[] = [
    {
      title: 'Bienvenido a Finanzapp',
      description: 'Configura tu perfil para calcular tu presupuesto real del mes.',
    },
    {
      title: 'Datos base',
      description: 'Tu sueldo y dia de pago nos ayudan a estimar tu disponible.',
    },
    {
      title: 'Gastos fijos',
      description: 'Agrega pagos recurrentes para tener un panorama completo.',
    },
    {
      title: 'Resumen',
      description: 'Revisa tu configuracion inicial antes de empezar.',
    },
  ];

  currentStep = 0;
  isSaving = false;
  errorMessage = '';

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

  fixedExpenses: CreateFixedExpensePayload[] = [];

  get userEmail(): string {
    return this.authService.currentUser?.email || '';
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  get progressWidth(): string {
    const progress = ((this.currentStep + 1) / this.steps.length) * 100;
    return `${Math.round(progress)}%`;
  }

  get totalFixedExpenses(): number {
    return this.fixedExpenses
      .filter((expense) => expense.isActive !== false)
      .reduce((sum, expense) => sum + this.toNumber(expense.amount), 0);
  }

  get monthlySalary(): number {
    return this.toNumber(this.profileForm.value.monthlySalary);
  }

  get availableBalance(): number {
    return this.monthlySalary - this.totalFixedExpenses;
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep += 1;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep -= 1;
    }
  }

  addFixedExpense(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const formValue = this.expenseForm.value;
    const payload: CreateFixedExpensePayload = {
      description: String(formValue.description || '').trim(),
      amount: this.toNumber(formValue.amount),
      dueDay: this.toNumber(formValue.dueDay, 1),
      isActive: !!formValue.isActive,
    };

    if (!payload.description) {
      return;
    }

    this.fixedExpenses = [...this.fixedExpenses, payload];
    this.expenseForm.reset({
      description: '',
      amount: 0,
      dueDay: 1,
      isActive: true,
    });
  }

  removeFixedExpense(index: number): void {
    this.fixedExpenses = this.fixedExpenses.filter((_, i) => i !== index);
  }

  skipOnboarding(): void {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    this.profileService.updateProfile({ onboardingCompleted: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isSaving = false;
          this.errorMessage = 'No se pudo finalizar el onboarding.';
        },
      });
  }

  finishOnboarding(): void {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const profilePayload: UpdateProfilePayload = {
      fullName: String(this.profileForm.value.fullName || '').trim() || undefined,
      monthlySalary: this.monthlySalary,
      salaryDay: this.toNumber(this.profileForm.value.salaryDay, 1),
      currency: String(this.profileForm.value.currency || 'CLP'),
      onboardingCompleted: true,
    };

    const profileRequest = this.profileService.updateProfile(profilePayload);
    const expensesRequest = this.fixedExpenses.length
      ? forkJoin(this.fixedExpenses.map((expense) => this.profileService.createFixedExpense(expense)))
      : of([]);

    forkJoin([profileRequest, expensesRequest])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isSaving = false;
          this.errorMessage = 'No se pudo completar el onboarding.';
        },
      });
  }

  private loadProfile(): void {
    this.profileService.getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          if (profile?.onboarding_completed) {
            this.router.navigate(['/dashboard']);
            return;
          }

          this.profileForm.patchValue({
            fullName: profile.full_name ?? this.authService.currentUser?.fullName ?? '',
            monthlySalary: profile.monthly_salary ?? 0,
            salaryDay: profile.salary_day ?? 1,
            currency: profile.currency ?? 'CLP',
          });
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar tu perfil.';
        },
      });
  }

  private toNumber(value: unknown, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
