import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiBudgetProgress } from '../../models/api.models';
import { CategoryIconComponent } from '../category-icon/category-icon.component';

@Component({
  selector: 'app-budget-progress-bar',
  standalone: true,
  imports: [CommonModule, CategoryIconComponent],
  templateUrl: './budget-progress-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetProgressBarComponent {
  @Input() budget!: ApiBudgetProgress;

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  formatCurrency(amount: number): string {
    return this.currencyFormatter.format(amount);
  }

  get progressWidth(): string {
    const percentage = Math.min(this.budget.percentage, 100);
    return `${percentage}%`;
  }

  get statusClasses(): string {
    switch (this.budget.status) {
      case 'exceeded':
        return 'bg-rose-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  }

  get statusBadgeClasses(): string {
    switch (this.budget.status) {
      case 'exceeded':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
      case 'warning':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
    }
  }

  get statusLabel(): string {
    switch (this.budget.status) {
      case 'exceeded':
        return 'Excedido';
      case 'warning':
        return 'Alerta';
      default:
        return 'OK';
    }
  }

  get exceededAmount(): number {
    return Math.abs(this.budget.remaining_amount);
  }
}
