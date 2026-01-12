import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card flex h-full flex-col gap-4 p-5 animate-pulse">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
          <div class="flex flex-col gap-2">
            <div class="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700"></div>
            <div class="h-6 w-28 rounded bg-slate-200 dark:bg-slate-700"></div>
          </div>
        </div>
      </div>
      <div class="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700"></div>
      <div class="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonCardComponent {}
