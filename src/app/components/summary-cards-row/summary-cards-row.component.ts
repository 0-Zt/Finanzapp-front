import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummaryCard, AccentTone } from '../../models/dashboard.models';
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

  readonly accentClasses: Record<AccentTone, string> = {
    emerald: '!border-l-emerald-400 dark:!border-l-emerald-400',
    amber: '!border-l-amber-400 dark:!border-l-amber-400',
    violet: '!border-l-brand-400 dark:!border-l-brand-400',
    slate: '!border-l-slate-400 dark:!border-l-slate-400',
    blue: '!border-l-sky-400 dark:!border-l-sky-400',
    teal: '!border-l-teal-400 dark:!border-l-teal-400',
  };

  readonly glowClasses: Record<AccentTone, string> = {
    emerald: 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.08]',
    amber: 'bg-amber-500/[0.03] dark:bg-amber-500/[0.08]',
    violet: 'bg-brand-500/[0.03] dark:bg-brand-500/[0.08]',
    slate: 'bg-slate-500/[0.03] dark:bg-slate-500/[0.08]',
    blue: 'bg-sky-500/[0.03] dark:bg-sky-500/[0.08]',
    teal: 'bg-teal-500/[0.03] dark:bg-teal-500/[0.08]',
  };

  readonly iconClasses: Record<AccentTone, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300',
    violet: 'bg-brand-500/15 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300',
    slate: 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300',
    blue: 'bg-sky-500/15 text-sky-600 dark:bg-sky-400/20 dark:text-sky-300',
    teal: 'bg-teal-500/15 text-teal-600 dark:bg-teal-400/20 dark:text-teal-300',
  };

  trendClass(trend: SummaryCard['trend']): string {
    if (trend === 'down') {
      return 'text-red-600 dark:text-red-400';
    }
    if (trend === 'up') {
      return 'text-emerald-600 dark:text-emerald-400';
    }
    return 'text-slate-600 dark:text-slate-400';
  }
}
