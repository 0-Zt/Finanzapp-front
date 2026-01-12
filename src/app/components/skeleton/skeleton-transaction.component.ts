import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-transaction',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list-card flex flex-wrap items-center justify-between gap-4 animate-pulse">
      <div class="flex flex-col gap-2">
        <div class="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700"></div>
        <div class="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        <div class="h-6 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonTransactionComponent {}
