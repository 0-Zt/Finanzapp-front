import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { TransactionsPageComponent } from './pages/transactions-page/transactions-page.component';
import { GoalsPageComponent } from './pages/goals-page/goals-page.component';
import { SavingsPageComponent } from './pages/savings-page/savings-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardPageComponent },
  { path: 'transactions', component: TransactionsPageComponent },
  { path: 'goals', component: GoalsPageComponent },
  { path: 'savings', component: SavingsPageComponent },
  { path: '**', redirectTo: 'dashboard' },
];
