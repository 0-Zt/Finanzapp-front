import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SummaryCard, CardTrend, AccentTone } from '../../models/dashboard.models';
import { SummaryCardsRowComponent } from '../summary-cards-row/summary-cards-row.component';

@Component({
  selector: 'app-dashboard-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, SummaryCardsRowComponent],
  templateUrl: './dashboard-hero.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeroComponent {
  @Input() badgeLabel = 'Finanzas personales';
  @Input() title = '';
  @Input() description =
    'Monitoriza saldos, gastos y objetivos clave en un entorno inspirado en interfaces limpias para tomar decisiones rápidas.';
  @Input() lastUpdated = '';
  @Input() exportLabel = 'Exportar';
  @Input({ required: true }) cards: SummaryCard[] = [];
  @Input() isLoading = false;
  @Output() addTransaction = new EventEmitter<void>();
  @Output() viewReports = new EventEmitter<void>();

  readonly heroCardClasses: Record<AccentTone, string> = {
    emerald: 'bg-white/80 border-l-2 !border-l-emerald-400 dark:bg-slate-900/50 dark:!border-l-emerald-400',
    amber: 'bg-white/80 border-l-2 !border-l-amber-400 dark:bg-slate-900/50 dark:!border-l-amber-400',
    violet: 'bg-white/80 border-l-2 !border-l-brand-400 dark:bg-slate-900/50 dark:!border-l-brand-400',
    slate: 'bg-white/80 border-l-2 !border-l-slate-400 dark:bg-slate-900/50 dark:!border-l-slate-400',
    blue: 'bg-white/80 border-l-2 !border-l-sky-400 dark:bg-slate-900/50 dark:!border-l-sky-400',
    teal: 'bg-white/80 border-l-2 !border-l-teal-400 dark:bg-slate-900/50 dark:!border-l-teal-400',
  };

  readonly heroCardGlow: Record<AccentTone, string> = {
    emerald: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    amber: 'bg-amber-500/5 dark:bg-amber-500/10',
    violet: 'bg-brand-500/5 dark:bg-brand-500/10',
    slate: 'bg-slate-500/5 dark:bg-slate-500/10',
    blue: 'bg-sky-500/5 dark:bg-sky-500/10',
    teal: 'bg-teal-500/5 dark:bg-teal-500/10',
  };

  trendClass(trend: CardTrend): string {
    if (trend === 'up') return 'text-emerald-600 dark:text-emerald-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-slate-600 dark:text-slate-400';
  }

  onAddTransaction(): void {
    this.addTransaction.emit();
  }

  onViewReports(): void {
    this.viewReports.emit();
  }
}
