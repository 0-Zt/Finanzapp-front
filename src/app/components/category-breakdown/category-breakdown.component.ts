import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryBreakdownItem } from '../../models/dashboard.models';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexTooltip,
  ApexLegend,
  ApexPlotOptions,
  ApexFill,
  ApexStroke,
  ApexResponsive,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
  colors: string[];
  responsive: ApexResponsive[];
};

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './category-breakdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBreakdownComponent implements OnChanges, OnInit {
  @Input() items: CategoryBreakdownItem[] = [];
  @Input() title = 'Categorias del mes';
  @Input() description = 'Distribución de gastos del mes actual.';

  chartOptions: Partial<ChartOptions> = {};
  private isDarkMode = false;

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
    if (changes['items']) {
      this.setupChart();
    }
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.value, 0);
  }

  formatValue(value: number): string {
    return this.currencyFormatter.format(value);
  }

  private checkDarkMode(): void {
    if (typeof document !== 'undefined') {
      this.isDarkMode = document.documentElement.classList.contains('dark');
    }
  }

  private setupChart(): void {
    if (!this.items.length) {
      this.chartOptions = {};
      return;
    }

    const values = this.items.map((item) => item.value);
    const labels = this.items.map((item) => item.label);
    const colors = this.items.map((item) => item.color);

    this.chartOptions = {
      series: values,
      labels: labels,
      colors: colors,
      chart: {
        type: 'donut',
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
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontWeight: 600,
                color: this.isDarkMode ? '#e2e8f0' : '#334155',
                offsetY: -10,
              },
              value: {
                show: true,
                fontSize: '22px',
                fontWeight: 700,
                color: this.isDarkMode ? '#f8fafc' : '#0f172a',
                offsetY: 5,
                formatter: (val: string) => {
                  return this.formatValue(Number(val));
                },
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Total',
                fontSize: '12px',
                fontWeight: 500,
                color: this.isDarkMode ? '#94a3b8' : '#64748b',
                formatter: () => {
                  return this.formatValue(this.total);
                },
              },
            },
          },
          expandOnClick: true,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: [this.isDarkMode ? '#1e293b' : '#ffffff'],
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: this.isDarkMode ? 'dark' : 'light',
          type: 'vertical',
          shadeIntensity: 0.2,
          opacityFrom: 1,
          opacityTo: 0.9,
          stops: [0, 100],
        },
      },
      tooltip: {
        enabled: true,
        theme: this.isDarkMode ? 'dark' : 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        y: {
          formatter: (value: number) => this.formatValue(value),
        },
      },
      legend: {
        show: false, // Usamos nuestra propia leyenda
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 240,
            },
            plotOptions: {
              pie: {
                donut: {
                  size: '65%',
                },
              },
            },
          },
        },
      ],
    };
  }
}
