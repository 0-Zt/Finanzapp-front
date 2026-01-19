import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiBudgetSummary, ApiBudgetProgress } from '../../models/api.models';
import { CategoryIconComponent } from '../category-icon/category-icon.component';

@Component({
  selector: 'app-budget-summary-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CategoryIconComponent],
  templateUrl: './budget-summary-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetSummaryCardComponent {
  @Input() summary: ApiBudgetSummary | null = null;

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  formatCurrency(amount: number): string {
    return this.currencyFormatter.format(amount);
  }

  get overBudgetBudgets(): ApiBudgetProgress[] {
    if (!this.summary) return [];
    const fromSummary = this.summary.top_over_budget ?? [];
    if (fromSummary.length > 0) return fromSummary;
    return this.summary.budgets
      .filter(b => b.status === 'exceeded')
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }

  get warningBudgets(): ApiBudgetProgress[] {
    if (!this.summary) return [];
    return this.summary.budgets
      .filter(b => b.status === 'warning')
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }

  get hasOverBudget(): boolean {
    return this.overBudgetBudgets.length > 0;
  }

  get hasWarnings(): boolean {
    return this.warningBudgets.length > 0;
  }

  get totalPercentage(): number {
    if (!this.summary || this.summary.total_budget === 0) return 0;
    return Math.round((this.summary.total_spent / this.summary.total_budget) * 100);
  }

  get progressWidth(): string {
    const percentage = Math.min(this.totalPercentage, 100);
    return `${percentage}%`;
  }

  get overallStatus(): 'safe' | 'warning' | 'exceeded' {
    if (this.totalPercentage >= this.exceededThreshold) return 'exceeded';
    if (this.totalPercentage >= this.warningThreshold) return 'warning';
    return 'safe';
  }

  get warningThreshold(): number {
    return this.summary?.warning_threshold ?? 80;
  }

  get exceededThreshold(): number {
    return this.summary?.exceeded_threshold ?? 100;
  }

  get statusClasses(): string {
    switch (this.overallStatus) {
      case 'exceeded':
        return 'bg-rose-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  }

  getAlertClasses(status: string): string {
    if (status === 'exceeded') {
      return 'text-rose-600 dark:text-rose-400';
    }
    return 'text-amber-600 dark:text-amber-400';
  }
}
