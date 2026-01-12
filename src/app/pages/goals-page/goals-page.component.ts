import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinancialGoalsService } from '../../services/financial-goals.service';
import {
  ApiFinancialGoal,
  CreateFinancialGoalPayload,
  UpdateFinancialGoalPayload,
} from '../../models/api.models';

const USER_ID = 1;

interface GoalFormState {
  title: string;
  currentAmount: number | null;
  targetAmount: number | null;
  deadline: string;
}

@Component({
  selector: 'app-goals-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals-page.component.html',
})
export class GoalsPageComponent implements OnInit {
  private readonly goalsService = inject(FinancialGoalsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly userId = USER_ID;
  goals: ApiFinancialGoal[] = [];
  isLoading = true;
  errorMessage = '';
  isFormOpen = false;
  formMode: 'create' | 'edit' = 'create';
  editingGoal: ApiFinancialGoal | null = null;

  formState: GoalFormState = this.createInitialState();

  ngOnInit(): void {
    this.loadGoals();
  }

  get totalProgress(): number {
    if (!this.goals.length) {
      return 0;
    }

    const totals = this.goals.reduce(
      (accumulator, goal) => {
        return {
          current: accumulator.current + goal.current_amount,
          target: accumulator.target + goal.target_amount,
        };
      },
      { current: 0, target: 0 }
    );

    return totals.target ? Math.round((totals.current / totals.target) * 100) : 0;
  }

  onOpenCreate(): void {
    this.formMode = 'create';
    this.editingGoal = null;
    this.formState = this.createInitialState();
    this.isFormOpen = true;
  }

  onEdit(goal: ApiFinancialGoal): void {
    this.formMode = 'edit';
    this.editingGoal = goal;
    this.formState = {
      title: goal.title,
      currentAmount: goal.current_amount,
      targetAmount: goal.target_amount,
      deadline: goal.deadline,
    };
    this.isFormOpen = true;
  }

  onDelete(goal: ApiFinancialGoal): void {
    this.isLoading = true;
    this.goalsService
      .deleteGoal(goal.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadGoals();
        },
        error: () => {
          this.errorMessage = 'No se pudo eliminar la meta.';
          this.isLoading = false;
        },
      });
  }

  onCloseForm(): void {
    this.isFormOpen = false;
    this.editingGoal = null;
    this.formMode = 'create';
  }

  onSubmit(): void {
    if (!this.formState.title || !this.formState.targetAmount || !this.formState.deadline) {
      return;
    }

    const currentAmount = this.formState.currentAmount ?? 0;

    if (this.formMode === 'edit' && this.editingGoal) {
      const payload: UpdateFinancialGoalPayload = {
        title: this.formState.title.trim(),
        current_amount: currentAmount,
        target_amount: this.formState.targetAmount,
        deadline: this.formState.deadline,
      };

      this.isLoading = true;
      this.goalsService
        .updateGoal(this.editingGoal.id, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.onCloseForm();
            this.loadGoals();
          },
          error: () => {
            this.errorMessage = 'No se pudo actualizar la meta.';
            this.isLoading = false;
          },
        });

      return;
    }

    const payload: CreateFinancialGoalPayload = {
      user_id: this.userId,
      title: this.formState.title.trim(),
      current_amount: currentAmount,
      target_amount: this.formState.targetAmount,
      deadline: this.formState.deadline,
    };

    this.isLoading = true;
    this.goalsService
      .createGoal(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.onCloseForm();
          this.loadGoals();
        },
        error: () => {
          this.errorMessage = 'No se pudo crear la meta.';
          this.isLoading = false;
        },
      });
  }

  private loadGoals(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.goalsService
      .getGoals(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (goals) => {
          this.goals = goals ?? [];
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar las metas.';
          this.isLoading = false;
        },
      });
  }

  private createInitialState(): GoalFormState {
    return {
      title: '',
      currentAmount: null,
      targetAmount: null,
      deadline: this.getTodayDate(),
    };
  }

  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  progress(goal: ApiFinancialGoal): number {
    return goal.target_amount ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
  }
}
