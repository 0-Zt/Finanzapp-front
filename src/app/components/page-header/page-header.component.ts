import { ChangeDetectionStrategy, Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent],
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent implements OnInit {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() useRouteData = true;
  @Input() showBreadcrumbs = true;
  @Input() showHome = true;
  @Input() homeLabel = 'Dashboard';
  @Input() homeUrl = '/dashboard';

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  routeTitle = '';
  routeSubtitle = '';

  ngOnInit(): void {
    this.updateRouteData();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updateRouteData();
      });
  }

  get effectiveTitle(): string {
    if (this.title) {
      return this.title;
    }
    return this.useRouteData ? this.routeTitle : '';
  }

  get effectiveSubtitle(): string {
    if (this.subtitle) {
      return this.subtitle;
    }
    return this.useRouteData ? this.routeSubtitle : '';
  }

  private updateRouteData(): void {
    const deepestRoute = this.getDeepestRoute(this.router.routerState.snapshot.root);
    this.routeTitle = deepestRoute.data?.['title'] ?? '';
    this.routeSubtitle = deepestRoute.data?.['subtitle'] ?? '';
  }

  private getDeepestRoute(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
