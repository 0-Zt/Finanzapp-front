import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);

  isDarkMode = false;

  constructor() {
    this.initializeTheme();
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

  private get hasWindow(): boolean {
    return typeof window !== 'undefined';
  }
}
