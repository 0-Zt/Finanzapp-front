import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryBreakdownItem } from '../../models/dashboard.models';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-breakdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBreakdownComponent {
  @Input() items: CategoryBreakdownItem[] = [];
  @Input() title = 'Categorias del mes';
  @Input() description = 'Distribución de gastos por categoría.';

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.value, 0);
  }

  get gradient(): string {
    if (!this.items.length || this.total === 0) {
      return 'conic-gradient(#e2e8f0 0 100%)';
    }

    let start = 0;
    const segments = this.items.map((item) => {
      const end = start + (this.total ? (item.value / this.total) * 100 : 0);
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });

    if (start < 100) {
      segments.push(`#e2e8f0 ${start}% 100%`);
    }

    return `conic-gradient(${segments.join(',')})`;
  }

  formatValue(value: number): string {
    return this.currencyFormatter.format(value);
  }
}
