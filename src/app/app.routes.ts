import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { TransactionsPageComponent } from './pages/transactions-page/transactions-page.component';
import { CreditCardsPageComponent } from './pages/credit-cards-page/credit-cards-page.component';
import { GoalsPageComponent } from './pages/goals-page/goals-page.component';
import { SavingsPageComponent } from './pages/savings-page/savings-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { OnboardingPageComponent } from './pages/onboarding-page/onboarding-page.component';
import { authGuard, publicGuard, onboardingGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginPageComponent, canActivate: [publicGuard] },
  { path: 'register', component: RegisterPageComponent, canActivate: [publicGuard] },
  { path: 'onboarding', component: OnboardingPageComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard, onboardingGuard] },
  { path: 'transactions', component: TransactionsPageComponent, canActivate: [authGuard, onboardingGuard] },
  { path: 'credit-cards', component: CreditCardsPageComponent, canActivate: [authGuard, onboardingGuard] },
  { path: 'goals', component: GoalsPageComponent, canActivate: [authGuard, onboardingGuard] },
  { path: 'savings', component: SavingsPageComponent, canActivate: [authGuard, onboardingGuard] },
  { path: 'profile', component: ProfilePageComponent, canActivate: [authGuard, onboardingGuard] },
  { path: '**', redirectTo: 'dashboard' },
];
