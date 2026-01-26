import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
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
  ApexStates,
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
  states: ApexStates;
};

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './category-breakdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBreakdownComponent implements OnChanges, OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() items: CategoryBreakdownItem[] = [];
  @Input() title = 'Categorias del mes';
  @Input() description = 'Distribución de gastos del mes actual.';

  chartOptions: Partial<ChartOptions> = {};
  highlightedIndex: number | null = null;
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

  onLegendHover(index: number): void {
    this.highlightedIndex = index;
    this.cdr.markForCheck();
  }

  onLegendLeave(): void {
    this.highlightedIndex = null;
    this.cdr.markForCheck();
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
        height: 260,
        fontFamily: 'Manrope, Inter, system-ui, sans-serif',
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
            size: '68%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '13px',
                fontWeight: 600,
                color: this.isDarkMode ? '#e2e8f0' : '#334155',
                offsetY: -8,
              },
              value: {
                show: true,
                fontSize: '20px',
                fontWeight: 700,
                color: this.isDarkMode ? '#f8fafc' : '#0f172a',
                offsetY: 4,
                formatter: (val: string) => {
                  return this.formatValue(Number(val));
                },
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Total',
                fontSize: '11px',
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
      states: {
        hover: {
          filter: {
            type: 'darken',
          },
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: 'darken',
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 3,
        colors: [this.isDarkMode ? '#1e293b' : '#ffffff'],
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: this.isDarkMode ? 'dark' : 'light',
          type: 'vertical',
          shadeIntensity: 0.15,
          opacityFrom: 1,
          opacityTo: 0.92,
          stops: [0, 100],
        },
      },
      tooltip: {
        enabled: true,
        theme: this.isDarkMode ? 'dark' : 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Manrope, Inter, system-ui, sans-serif',
        },
        custom: ({ series, seriesIndex, w }) => {
          const value = series[seriesIndex];
          const label = w.globals.labels[seriesIndex];
          const percent = this.items[seriesIndex]?.percent ?? 0;
          const color = colors[seriesIndex];

          return `
            <div class="apexcharts-tooltip-custom" style="padding: 10px 14px; min-width: 160px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
                <span style="font-weight: 600; color: ${this.isDarkMode ? '#f1f5f9' : '#0f172a'};">${label}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px;">
                <span style="color: ${this.isDarkMode ? '#94a3b8' : '#64748b'};">Monto</span>
                <span style="font-weight: 600; color: ${this.isDarkMode ? '#f1f5f9' : '#0f172a'};">${this.formatValue(value)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 2px;">
                <span style="color: ${this.isDarkMode ? '#94a3b8' : '#64748b'};">Del total</span>
                <span style="font-weight: 600; color: ${color};">${percent}%</span>
              </div>
            </div>
          `;
        },
      },
      legend: {
        show: false,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 220,
            },
            plotOptions: {
              pie: {
                donut: {
                  size: '62%',
                },
              },
            },
          },
        },
      ],
    };
  }
}
