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
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [publicGuard],
    data: { animation: 'LoginPage', layout: 'public' },
  },
  {
    path: 'register',
    component: RegisterPageComponent,
    canActivate: [publicGuard],
    data: { animation: 'RegisterPage', layout: 'public' },
  },
  {
    path: 'onboarding',
    component: OnboardingPageComponent,
    canActivate: [authGuard],
    data: { animation: 'OnboardingPage', layout: 'public' },
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    canActivate: [authGuard, onboardingGuard],
    data: {
      animation: 'DashboardPage',
      breadcrumb: 'Dashboard',
      title: 'Dashboard',
      subtitle: 'Vista general de tu actividad financiera.',
    },
  },
  {
    path: 'transactions',
    component: TransactionsPageComponent,
    canActivate: [authGuard, onboardingGuard],
    data: {
      animation: 'TransactionsPage',
      breadcrumb: 'Transacciones',
      title: 'Transacciones',
      subtitle: 'Consulta y analiza todos tus movimientos financieros.',
    },
  },
  {
    path: 'credit-cards',
    component: CreditCardsPageComponent,
    canActivate: [authGuard, onboardingGuard],
    data: {
      animation: 'CreditCardsPage',
      breadcrumb: 'Tarjetas',
      title: 'Tarjetas de credito',
      subtitle: 'Administra tus tarjetas y controla tus gastos.',
    },
  },
  {
    path: 'goals',
    component: GoalsPageComponent,
    canActivate: [authGuard, onboardingGuard],
    data: {
      animation: 'GoalsPage',
      breadcrumb: 'Metas',
      title: 'Metas financieras',
      subtitle: 'Administra metas, controla el avance y ajusta tus objetivos.',
    },
  },
  {
    path: 'savings',
    component: SavingsPageComponent,
    canActivate: [authGuard, onboardingGuard],
    data: {
      animation: 'SavingsPage',
      breadcrumb: 'Ahorro',
      title: 'Ahorro e inversion',
      subtitle: 'Registra compras de ETF, aportes y revisa recomendaciones.',
    },
  },
  {
    path: 'profile',
    component: ProfilePageComponent,
    canActivate: [authGuard, onboardingGuard],
    data: {
      animation: 'ProfilePage',
      breadcrumb: 'Perfil',
      title: 'Mi perfil',
      subtitle: 'Gestiona tu informacion personal y preferencias',
    },
  },
  { path: '**', redirectTo: 'dashboard' },
];
