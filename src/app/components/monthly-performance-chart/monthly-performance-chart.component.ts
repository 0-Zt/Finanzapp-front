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
      this.setupChart();
    }
  }

  onPeriodChange(value: 'monthly' | 'yearly'): void {
    this.periodChange.emit(value);
  }

  private checkDarkMode(): void {
    if (typeof document !== 'undefined') {
      this.isDarkMode = document.documentElement.classList.contains('dark');
    }
  }

  private setupChart(): void {
    const labels = this.data.map((d) => d.label);
    const incomeData = this.data.map((d) => d.income);
    const expenseData = this.data.map((d) => d.expense);

    // Encontrar el valor máximo para calcular porcentajes
    const maxValue = Math.max(...incomeData, ...expenseData, 1);

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
      colors: ['#10b981', '#f43f5e'], // emerald-500, rose-500
      chart: {
        type: 'bar',
        height: 280,
        fontFamily: 'Inter, system-ui, sans-serif',
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
          columnWidth: '65%',
          borderRadius: 6,
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
          shadeIntensity: 0.2,
          opacityFrom: 1,
          opacityTo: 0.85,
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
        tickAmount: 5,
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
          right: 0,
          bottom: 0,
          left: 0,
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
          formatter: (value: number) => value.toFixed(0) + '%',
        },
      },
      legend: {
        show: false, // Usamos nuestra propia leyenda en el header
      },
    };
  }
}
