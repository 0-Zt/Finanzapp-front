import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonthlyPerformancePoint } from '../../models/dashboard.models';

@Component({
  selector: 'app-monthly-performance-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monthly-performance-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyPerformanceChartComponent {
  @Input({ required: true }) data: MonthlyPerformancePoint[] = [];
  @Input() title = 'Comportamiento mensual';
  @Input() description = 'Comparativa de ingresos y gastos en los últimos 12 meses.';
  @Input() actionLabel = 'Descargar';
  @Input() period: 'monthly' | 'yearly' = 'monthly';
  @Output() periodChange = new EventEmitter<'monthly' | 'yearly'>();

  onPeriodChange(value: 'monthly' | 'yearly'): void {
    this.periodChange.emit(value);
  }
}
