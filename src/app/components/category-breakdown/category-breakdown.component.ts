import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryBreakdownItem } from '../../models/dashboard.models';

interface PieSegment {
  path: string;
  color: string;
  label: string;
  percent: number;
  value: number;
}

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

  hoveredSegment: PieSegment | null = null;

  private readonly currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.value, 0);
  }

  get segments(): PieSegment[] {
    if (!this.items.length || this.total === 0) {
      return [];
    }

    const segments: PieSegment[] = [];
    let currentAngle = -90; // Start from top

    for (const item of this.items) {
      const percent = (item.value / this.total) * 100;
      const angle = (percent / 100) * 360;
      const path = this.describeArc(50, 50, 45, currentAngle, currentAngle + angle);

      segments.push({
        path,
        color: item.color,
        label: item.label,
        percent: item.percent,
        value: item.value,
      });

      currentAngle += angle;
    }

    return segments;
  }

  onSegmentHover(segment: PieSegment | null): void {
    this.hoveredSegment = segment;
  }

  formatValue(value: number): string {
    return this.currencyFormatter.format(value);
  }

  private describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
    const start = this.polarToCartesian(x, y, radius, endAngle);
    const end = this.polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      'M', x, y,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ');
  }

  private polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): { x: number; y: number } {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }
}
