import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-label]="ariaLabel"
      role="img"
    >
      @switch (icon) {
        @case ('utensils') {
          <!-- Comida: tenedor y cuchillo -->
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
          <path d="M7 2v20"/>
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
        }
        @case ('bolt') {
          <!-- Servicios: rayo -->
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
        }
        @case ('sparkles') {
          <!-- Entretenimiento: estrellas -->
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
          <path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z"/>
          <path d="M6 17l.5 1.5L8 19l-1.5.5L6 21l-.5-1.5L4 19l1.5-.5L6 17z"/>
        }
        @case ('heart') {
          <!-- Salud: corazón -->
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        }
        @case ('bus') {
          <!-- Transporte: bus -->
          <path d="M8 6v6"/>
          <path d="M16 6v6"/>
          <path d="M2 12h20"/>
          <path d="M7 18h10"/>
          <rect x="4" y="3" width="16" height="16" rx="2"/>
          <circle cx="7" cy="18" r="2"/>
          <circle cx="17" cy="18" r="2"/>
        }
        @case ('wallet') {
          <!-- Ingresos: billetera -->
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
        }
        @case ('piggy-bank') {
          <!-- Ahorro: alcancía -->
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/>
          <path d="M2 9v1c0 1.1.9 2 2 2h1"/>
          <path d="M16 11h.01"/>
        }
        @case ('chart-line') {
          <!-- Inversión: gráfico -->
          <path d="M3 3v18h18"/>
          <path d="m19 9-5 5-4-4-3 3"/>
        }
        @default {
          <!-- Default: círculo -->
          <circle cx="12" cy="12" r="10"/>
        }
      }
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryIconComponent {
  @Input() icon = '';
  @Input() size = 16;
  @Input() ariaLabel = '';
}
