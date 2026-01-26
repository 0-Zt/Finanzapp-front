import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonthlyPerformancePoint } from '../../models/dashboard.models';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexGrid,
  ApexLegend,
  ApexPlotOptions,
  ApexFill,
  ApexStroke,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
  colors: string[];
};

@Component({
  selector: 'app-monthly-performance-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './monthly-performance-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyPerformanceChartComponent implements OnChanges, OnInit {
  @Input({ required: true }) data: MonthlyPerformancePoint[] = [];
  @Input() title = 'Comportamiento mensual';
  @Input() description = 'Comparativa de ingresos y gastos en los últimos 12 meses.';
  @Input() actionLabel = 'Descargar';
  @Input() period: 'monthly' | 'yearly' = 'monthly';
  @Output() periodChange = new EventEmitter<'monthly' | 'yearly'>();

  chartOptions: Partial<ChartOptions> = {};
  private isDarkMode = false;

  // Summary stats computed from data
  totalIncome = 0;
  totalExpense = 0;
  balance = 0;
  avgMonthlyExpense = 0;

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  ngOnInit(): void {
    this.checkDarkMode();
    this.setupChart();

    if (typeof window !== 'undefined') {
      const observer = new MutationObserver(() => {
        const wasDark = this.isDarkMode;
        this.checkDarkMode();
        if (wasDark !== this.isDarkMode) {
          this.setupChart();
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['period']) {
      this.computeSummaryStats();
      this.setupChart();
    }
  }

  onPeriodChange(value: 'monthly' | 'yearly'): void {
    this.periodChange.emit(value);
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  private checkDarkMode(): void {
    if (typeof document !== 'undefined') {
      this.isDarkMode = document.documentElement.classList.contains('dark');
    }
  }

  private computeSummaryStats(): void {
    this.totalIncome = this.data.reduce((sum, d) => sum + (d.incomeValue ?? 0), 0);
    this.totalExpense = this.data.reduce((sum, d) => sum + (d.expenseValue ?? 0), 0);
    this.balance = this.totalIncome - this.totalExpense;
    this.avgMonthlyExpense = this.data.length > 0 ? this.totalExpense / this.data.length : 0;
  }

  private setupChart(): void {
    const labels = this.data.map((d) => d.label);
    const incomeData = this.data.map((d) => d.income);
    const expenseData = this.data.map((d) => d.expense);

    // Store real values for custom tooltip
    const incomeValues = this.data.map((d) => d.incomeValue ?? 0);
    const expenseValues = this.data.map((d) => d.expenseValue ?? 0);

    this.chartOptions = {
      series: [
        {
          name: 'Ingresos',
          data: incomeData,
        },
        {
          name: 'Gastos',
          data: expenseData,
        },
      ],
      colors: ['#059669', '#dc2626'], // emerald-600, red-600 (better contrast)
      chart: {
        type: 'bar',
        height: 260,
        fontFamily: 'Manrope, Inter, system-ui, sans-serif',
        background: 'transparent',
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 100,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 4,
          borderRadiusApplication: 'end',
          dataLabels: {
            position: 'top',
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: this.isDarkMode ? 'dark' : 'light',
          type: 'vertical',
          shadeIntensity: 0.15,
          opacityFrom: 1,
          opacityTo: 0.9,
          stops: [0, 100],
        },
      },
      xaxis: {
        categories: labels,
        labels: {
          style: {
            colors: this.isDarkMode ? '#94a3b8' : '#64748b',
            fontSize: '11px',
            fontWeight: 600,
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: this.isDarkMode ? '#94a3b8' : '#64748b',
            fontSize: '11px',
            fontWeight: 500,
          },
          formatter: (value: number) => {
            return value.toFixed(0) + '%';
          },
        },
        max: 100,
        min: 0,
        tickAmount: 4,
      },
      grid: {
        borderColor: this.isDarkMode ? '#334155' : '#e2e8f0',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 4,
          bottom: 0,
          left: 4,
        },
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        theme: this.isDarkMode ? 'dark' : 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Manrope, Inter, system-ui, sans-serif',
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const incomeVal = incomeValues[dataPointIndex];
          const expenseVal = expenseValues[dataPointIndex];
          const label = labels[dataPointIndex];
          const balanceVal = incomeVal - expenseVal;
          const balanceClass = balanceVal >= 0 ? 'text-emerald-600' : 'text-red-600';
          const balanceSign = balanceVal >= 0 ? '+' : '';

          return `
            <div class="apexcharts-tooltip-custom" style="padding: 12px 14px; min-width: 180px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${this.isDarkMode ? '#f1f5f9' : '#0f172a'};">
                ${label}
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #059669;"></span>
                  <span style="color: ${this.isDarkMode ? '#cbd5e1' : '#475569'};">Ingresos</span>
                </span>
                <span style="font-weight: 600; color: #059669;">${this.formatCurrency(incomeVal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #dc2626;"></span>
                  <span style="color: ${this.isDarkMode ? '#cbd5e1' : '#475569'};">Gastos</span>
                </span>
                <span style="font-weight: 600; color: #dc2626;">${this.formatCurrency(expenseVal)}</span>
              </div>
              <div style="border-top: 1px solid ${this.isDarkMode ? '#334155' : '#e2e8f0'}; padding-top: 8px; display: flex; justify-content: space-between;">
                <span style="color: ${this.isDarkMode ? '#94a3b8' : '#64748b'};">Balance</span>
                <span style="font-weight: 700; color: ${balanceVal >= 0 ? '#059669' : '#dc2626'};">${balanceSign}${this.formatCurrency(balanceVal)}</span>
              </div>
            </div>
          `;
        },
      },
      legend: {
        show: false,
      },
    };
  }
}
