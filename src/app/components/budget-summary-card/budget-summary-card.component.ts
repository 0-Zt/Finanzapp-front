import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiBudgetSummary, ApiBudgetProgress } from '../../models/api.models';
import { CategoryIconComponent } from '../category-icon/category-icon.component';

type AlertKind = 'exceeded' | 'warning';

interface AlertItem {
  kind: AlertKind;
  budget: ApiBudgetProgress;
}

@Component({
  selector: 'app-budget-summary-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CategoryIconComponent],
  templateUrl: './budget-summary-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetSummaryCardComponent implements OnChanges {
  @Input() summary: ApiBudgetSummary | null = null;
  alertIndex = 0;

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

  get alertItems(): AlertItem[] {
    return [
      ...this.overBudgetBudgets.map((budget) => ({ kind: 'exceeded' as const, budget })),
      ...this.warningBudgets.map((budget) => ({ kind: 'warning' as const, budget })),
    ];
  }

  get alertCount(): number {
    return this.alertItems.length;
  }

  get currentAlert(): AlertItem | null {
    if (!this.alertItems.length) return null;
    const index = Math.min(this.alertIndex, this.alertItems.length - 1);
    return this.alertItems[index] ?? null;
  }

  get hasAlertNavigation(): boolean {
    return this.alertItems.length > 1;
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

  alertContainerClasses(kind: AlertKind): string {
    return kind === 'exceeded'
      ? 'border-rose-200/70 bg-rose-50/40 dark:border-rose-700/40 dark:bg-rose-900/20'
      : 'border-amber-200/70 bg-amber-50/40 dark:border-amber-700/40 dark:bg-amber-900/20';
  }

  alertIconClasses(kind: AlertKind): string {
    return kind === 'exceeded'
      ? 'text-rose-600 dark:text-rose-300'
      : 'text-amber-600 dark:text-amber-300';
  }

  previousAlert(): void {
    if (!this.alertItems.length) return;
    this.alertIndex = (this.alertIndex - 1 + this.alertItems.length) % this.alertItems.length;
  }

  nextAlert(): void {
    if (!this.alertItems.length) return;
    this.alertIndex = (this.alertIndex + 1) % this.alertItems.length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['summary']) {
      this.alertIndex = 0;
    }
  }
}
