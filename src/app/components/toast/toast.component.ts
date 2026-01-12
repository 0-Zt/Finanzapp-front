import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private toastService = inject(ToastService);
  toasts = this.toastService.toasts;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  getIcon(type: Toast['type']): string {
    const icons: Record<Toast['type'], string> = {
      success: 'M5 13l4 4L19 7',
      error: 'M6 18L18 6M6 6l12 12',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    };
    return icons[type];
  }

  getClasses(type: Toast['type']): string {
    const classes: Record<Toast['type'], string> = {
      success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-200',
      error: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/50 dark:bg-rose-900/30 dark:text-rose-200',
      warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-200',
      info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-200',
    };
    return classes[type];
  }

  getIconClasses(type: Toast['type']): string {
    const classes: Record<Toast['type'], string> = {
      success: 'text-emerald-500 dark:text-emerald-400',
      error: 'text-rose-500 dark:text-rose-400',
      warning: 'text-amber-500 dark:text-amber-400',
      info: 'text-blue-500 dark:text-blue-400',
    };
    return classes[type];
  }
}
