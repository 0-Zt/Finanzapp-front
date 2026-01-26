import { ChangeDetectionStrategy, Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumbs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent implements OnInit {
  @Input() showHome = true;
  @Input() homeLabel = 'Dashboard';
  @Input() homeUrl = '/dashboard';

  breadcrumbs: BreadcrumbItem[] = [];

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.updateBreadcrumbs();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updateBreadcrumbs();
      });
  }

  get displayBreadcrumbs(): BreadcrumbItem[] {
    if (!this.showHome) {
      return this.breadcrumbs;
    }

    const homeCrumb: BreadcrumbItem = { label: this.homeLabel, url: this.homeUrl };
    if (!this.breadcrumbs.length) {
      return [homeCrumb];
    }

    const first = this.breadcrumbs[0];
    if (first?.url === this.homeUrl) {
      return this.breadcrumbs;
    }

    return [homeCrumb, ...this.breadcrumbs];
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbs = this.buildBreadcrumbs(this.router.routerState.snapshot.root, '');
  }

  private buildBreadcrumbs(route: ActivatedRouteSnapshot, url: string): BreadcrumbItem[] {
    const routeUrl = route.url.map((segment) => segment.path).join('/');
    const nextUrl = routeUrl ? `${url}/${routeUrl}` : url;
    const crumbs: BreadcrumbItem[] = [];
    const label = route.data?.['breadcrumb'];

    if (label) {
      crumbs.push({ label, url: nextUrl || '/' });
    }

    if (route.firstChild) {
      return crumbs.concat(this.buildBreadcrumbs(route.firstChild, nextUrl));
    }

    return crumbs;
  }
}
