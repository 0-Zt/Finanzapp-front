import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummaryCard } from '../../models/dashboard.models';
import { SkeletonCardComponent } from '../skeleton/skeleton-card.component';

@Component({
  selector: 'app-summary-cards-row',
  standalone: true,
  imports: [CommonModule, SkeletonCardComponent],
  templateUrl: './summary-cards-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCardsRowComponent {
  @Input({ required: true }) cards: SummaryCard[] = [];
  @Input() isLoading = false;

  readonly skeletonItems = [1, 2, 3, 4, 5];

  readonly accentClasses: Record<SummaryCard['accent'], string> = {
    emerald: 'border-emerald-200/60 dark:border-emerald-500/30',
    amber: 'border-amber-200/60 dark:border-amber-500/30',
    violet: 'border-brand-200/60 dark:border-brand-500/30',
    slate: 'border-slate-200/60 dark:border-slate-600/40',
    blue: 'border-sky-200/60 dark:border-sky-500/30',
    teal: 'border-teal-200/60 dark:border-teal-500/30',
  };

  readonly iconClasses: Record<SummaryCard['accent'], string> = {
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300',
    violet: 'bg-brand-500/15 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300',
    slate: 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300',
    blue: 'bg-sky-500/15 text-sky-600 dark:bg-sky-400/20 dark:text-sky-300',
    teal: 'bg-teal-500/15 text-teal-600 dark:bg-teal-400/20 dark:text-teal-300',
  };

  trendClass(trend: SummaryCard['trend']): string {
    if (trend === 'down') {
      return 'text-rose-500 dark:text-rose-300';
    }
    if (trend === 'up') {
      return 'text-emerald-500 dark:text-emerald-300';
    }
    return 'text-slate-500 dark:text-slate-300';
  }
}
