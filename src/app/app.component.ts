import { Component, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastComponent } from './components/toast/toast.component';
import { TransactionFabComponent } from './components/transaction-fab/transaction-fab.component';
import { routeAnimations } from './animations/route-animations';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastComponent, TransactionFabComponent],
  templateUrl: './app.component.html',
  animations: [routeAnimations],
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  isDarkMode = false;
  isPublicLayout = false;

  constructor() {
    this.initializeTheme();
    this.updateLayout();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateLayout();
      });
  }

  /**
   * Prepares the route animation by returning the animation data
   * associated with the current route.
   */
  prepareRoute(outlet: RouterOutlet): string | undefined {
    return outlet?.activatedRouteData?.['animation'];
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.hasWindow) {
      window.localStorage.setItem('finanzapp-theme', this.isDarkMode ? 'dark' : 'light');
    }
    this.applyTheme();
  }

  private initializeTheme(): void {
    if (!this.hasWindow) {
      return;
    }

    const storedTheme = window.localStorage.getItem('finanzapp-theme');
    if (storedTheme) {
      this.isDarkMode = storedTheme === 'dark';
    } else {
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.applyTheme();
  }

  private applyTheme(): void {
    const root = this.document?.documentElement;
    if (!root) {
      return;
    }

    root.classList.toggle('dark', this.isDarkMode);
  }

  private updateLayout(): void {
    const deepestRoute = this.getDeepestRoute(this.router.routerState.snapshot.root);
    this.isPublicLayout = deepestRoute.data?.['layout'] === 'public';
  }

  private getDeepestRoute(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }

  private get hasWindow(): boolean {
    return typeof window !== 'undefined';
  }
}
