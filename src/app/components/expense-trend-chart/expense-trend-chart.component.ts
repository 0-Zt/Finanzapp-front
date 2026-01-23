import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TrendChartPoint } from '../../models/dashboard.models';

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  label: string;
  date: string;
}

@Component({
  selector: 'app-expense-trend-chart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './expense-trend-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseTrendChartComponent implements OnChanges {
  @Input({ required: true }) data: TrendChartPoint[] = [];
  @Input() title = 'Tendencia de gastos';
  @Input() description = 'Evolución de tus gastos en el tiempo.';
  @Input() showIncome = false;

  readonly chartWidth = 100;
  readonly chartHeight = 50;
  readonly padding = { top: 5, right: 5, bottom: 8, left: 5 };

  expensePoints: ChartPoint[] = [];
  incomePoints: ChartPoint[] = [];
  expensePath = '';
  expenseAreaPath = '';
  incomePath = '';
  incomeAreaPath = '';
  gridLines: number[] = [];
  maxValue = 0;
  hoveredPoint: ChartPoint | null = null;

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['showIncome']) {
      this.calculateChart();
    }
  }

  onPointHover(point: ChartPoint): void {
    this.hoveredPoint = point;
  }

  onPointLeave(): void {
    this.hoveredPoint = null;
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  private calculateChart(): void {
    if (!this.data.length) {
      this.expensePoints = [];
      this.incomePoints = [];
      this.expensePath = '';
      this.incomePath = '';
      return;
    }

    const expenses = this.data.filter((d) => d.type === 'expense');
    const incomes = this.data.filter((d) => d.type === 'income');

    const allValues = this.data.map((d) => d.value);
    this.maxValue = Math.max(...allValues, 1);

    // Generate grid lines (4 horizontal lines)
    this.gridLines = [0.25, 0.5, 0.75, 1].map((p) => this.maxValue * p);

    const innerWidth = this.chartWidth - this.padding.left - this.padding.right;
    const innerHeight = this.chartHeight - this.padding.top - this.padding.bottom;

    // Calculate expense points
    this.expensePoints = expenses.map((point, index) => ({
      x: this.padding.left + (index / Math.max(expenses.length - 1, 1)) * innerWidth,
      y: this.padding.top + innerHeight - (point.value / this.maxValue) * innerHeight,
      value: point.value,
      label: point.label,
      date: point.date,
    }));

    // Calculate income points
    this.incomePoints = incomes.map((point, index) => ({
      x: this.padding.left + (index / Math.max(incomes.length - 1, 1)) * innerWidth,
      y: this.padding.top + innerHeight - (point.value / this.maxValue) * innerHeight,
      value: point.value,
      label: point.label,
      date: point.date,
    }));

    // Generate paths
    this.expensePath = this.generateLinePath(this.expensePoints);
    this.expenseAreaPath = this.generateAreaPath(this.expensePoints, innerHeight);

    if (this.showIncome) {
      this.incomePath = this.generateLinePath(this.incomePoints);
      this.incomeAreaPath = this.generateAreaPath(this.incomePoints, innerHeight);
    }
  }

  private generateLinePath(points: ChartPoint[]): string {
    if (points.length < 2) {
      return '';
    }

    return points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L';
        return `${command}${point.x},${point.y}`;
      })
      .join(' ');
  }

  private generateAreaPath(points: ChartPoint[], innerHeight: number): string {
    if (points.length < 2) {
      return '';
    }

    const baseline = this.padding.top + innerHeight;
    const linePath = this.generateLinePath(points);
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];

    return `${linePath} L${lastPoint.x},${baseline} L${firstPoint.x},${baseline} Z`;
  }

  getYPosition(value: number): number {
    const innerHeight = this.chartHeight - this.padding.top - this.padding.bottom;
    return this.padding.top + innerHeight - (value / this.maxValue) * innerHeight;
  }

  getAverageExpense(): number {
    if (!this.expensePoints.length) {
      return 0;
    }
    const sum = this.expensePoints.reduce((acc, p) => acc + p.value, 0);
    return Math.round(sum / this.expensePoints.length);
  }

  getMinExpense(): number {
    if (!this.expensePoints.length) {
      return 0;
    }
    return Math.min(...this.expensePoints.map((p) => p.value));
  }

  getVisibleLabels(): ChartPoint[] {
    if (this.expensePoints.length <= 6) {
      return this.expensePoints;
    }

    const step = Math.ceil(this.expensePoints.length / 6);
    const result: ChartPoint[] = [];

    for (let i = 0; i < this.expensePoints.length; i += step) {
      result.push(this.expensePoints[i]);
    }

    // Siempre incluir el último punto
    const lastPoint = this.expensePoints[this.expensePoints.length - 1];
    if (result[result.length - 1] !== lastPoint) {
      result.push(lastPoint);
    }

    return result;
  }
}
