import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SummaryCard } from '../../models/dashboard.models';
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

  onAddTransaction(): void {
    this.addTransaction.emit();
  }

  onViewReports(): void {
    this.viewReports.emit();
  }
}
