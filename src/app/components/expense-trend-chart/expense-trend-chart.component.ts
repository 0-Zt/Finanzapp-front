import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrendChartPoint } from '../../models/dashboard.models';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexFill,
  ApexDataLabels,
  ApexTooltip,
  ApexGrid,
  ApexMarkers,
  ApexLegend,
  ApexTheme,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  fill: ApexFill;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  markers: ApexMarkers;
  legend: ApexLegend;
  theme: ApexTheme;
  colors: string[];
};

@Component({
  selector: 'app-expense-trend-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './expense-trend-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseTrendChartComponent implements OnChanges, OnInit {
  @Input({ required: true }) data: TrendChartPoint[] = [];
  @Input() title = 'Tendencia de gastos';
  @Input() description = 'Evolución de tus gastos en los últimos 30 días.';
  @Input() showIncome = false;

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  chartOptions: Partial<ChartOptions> = {};
  maxValue = 0;
  avgValue = 0;
  minValue = 0;

  private isDarkMode = false;

  ngOnInit(): void {
    this.checkDarkMode();
    this.setupChart();

    // Observar cambios en el modo oscuro
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
    if (changes['data'] || changes['showIncome']) {
      this.calculateStats();
      this.setupChart();
    }
  }

  private checkDarkMode(): void {
    if (typeof document !== 'undefined') {
      this.isDarkMode = document.documentElement.classList.contains('dark');
    }
  }

  private calculateStats(): void {
    const expenses = this.data.filter((d) => d.type === 'expense');
    if (expenses.length === 0) {
      this.maxValue = 0;
      this.avgValue = 0;
      this.minValue = 0;
      return;
    }

    const values = expenses.map((d) => d.value);
    this.maxValue = Math.max(...values);
    this.minValue = Math.min(...values);
    this.avgValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  private setupChart(): void {
    const expenses = this.data.filter((d) => d.type === 'expense');
    const incomes = this.data.filter((d) => d.type === 'income');

    const expenseData = expenses.map((d) => ({
      x: d.label,
      y: d.value,
    }));

    const incomeData = incomes.map((d) => ({
      x: d.label,
      y: d.value,
    }));

    const series: ApexAxisChartSeries = [
      {
        name: 'Gastos',
        data: expenseData,
      },
    ];

    if (this.showIncome && incomeData.length > 0) {
      series.push({
        name: 'Ingresos',
        data: incomeData,
      });
    }

    const colors = this.showIncome ? ['#f43f5e', '#10b981'] : ['#f43f5e'];

    this.chartOptions = {
      series,
      colors,
      chart: {
        type: 'area',
        height: 280,
        fontFamily: 'Inter, system-ui, sans-serif',
        background: 'transparent',
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        dropShadow: {
          enabled: true,
          top: 3,
          left: 0,
          blur: 6,
          opacity: 0.15,
          color: '#f43f5e',
        },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        lineCap: 'round',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: 0,
        strokeWidth: 2,
        strokeColors: this.isDarkMode ? '#1e293b' : '#ffffff',
        hover: {
          size: 7,
          sizeOffset: 3,
        },
      },
      xaxis: {
        type: 'category',
        labels: {
          style: {
            colors: this.isDarkMode ? '#94a3b8' : '#64748b',
            fontSize: '11px',
            fontWeight: 500,
          },
          rotate: 0,
          hideOverlappingLabels: true,
          trim: true,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        crosshairs: {
          show: true,
          stroke: {
            color: this.isDarkMode ? '#475569' : '#cbd5e1',
            width: 1,
            dashArray: 4,
          },
        },
        tooltip: {
          enabled: false,
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
            if (value >= 1000000) {
              return '$' + (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return '$' + (value / 1000).toFixed(0) + 'K';
            }
            return '$' + value.toFixed(0);
          },
        },
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
          right: 10,
          bottom: 0,
          left: 10,
        },
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        theme: this.isDarkMode ? 'dark' : 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        y: {
          formatter: (value: number) => this.formatCurrency(value),
        },
        marker: {
          show: true,
        },
        custom: undefined,
      },
      legend: {
        show: this.showIncome,
        position: 'top',
        horizontalAlign: 'right',
        floating: true,
        offsetY: -25,
        offsetX: -5,
        labels: {
          colors: this.isDarkMode ? '#e2e8f0' : '#334155',
        },
        markers: {
          shape: 'circle',
          strokeWidth: 0,
          offsetX: -2,
        },
        itemMargin: {
          horizontal: 12,
        },
      },
      theme: {
        mode: this.isDarkMode ? 'dark' : 'light',
      },
    };
  }
}
