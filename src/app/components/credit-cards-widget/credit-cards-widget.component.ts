import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiCreditCardWithSummary, CreditCardsSummary } from '../../models/api.models';

@Component({
  selector: 'app-credit-cards-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './credit-cards-widget.component.html',
})
export class CreditCardsWidgetComponent {
  @Input() summary: CreditCardsSummary | null = null;
  @Input() isLoading = false;

  get cards(): ApiCreditCardWithSummary[] {
    return this.summary?.cards ?? [];
  }

  get totals() {
    return this.summary?.totals ?? {
      total_balance: 0,
      total_limit: 0,
      total_available: 0,
      card_count: 0,
    };
  }

  get totalUtilization(): number {
    if (!this.totals.total_limit) return 0;
    return Math.round((this.totals.total_balance / this.totals.total_limit) * 100);
  }

  get cardsWithUpcomingPayments(): ApiCreditCardWithSummary[] {
    const today = new Date();
    const currentDay = today.getDate();

    return this.cards
      .filter((card) => card.payment_due_day && card.current_balance > 0)
      .sort((a, b) => {
        const dayA = a.payment_due_day ?? 31;
        const dayB = b.payment_due_day ?? 31;
        // Ordenar por proximidad al día actual
        const daysUntilA = dayA >= currentDay ? dayA - currentDay : 30 - currentDay + dayA;
        const daysUntilB = dayB >= currentDay ? dayB - currentDay : 30 - currentDay + dayB;
        return daysUntilA - daysUntilB;
      })
      .slice(0, 2);
  }

  getDaysUntilPayment(paymentDay: number | null | undefined): number {
    if (!paymentDay) return 99;
    const today = new Date();
    const currentDay = today.getDate();
    return paymentDay >= currentDay ? paymentDay - currentDay : 30 - currentDay + paymentDay;
  }

  getPaymentUrgencyClass(paymentDay: number | null | undefined): string {
    const days = this.getDaysUntilPayment(paymentDay);
    if (days <= 3) return 'text-rose-600 dark:text-rose-400';
    if (days <= 7) return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-600 dark:text-slate-400';
  }

  getUtilizationClass(percentage: number): string {
    if (percentage >= 90) return 'bg-rose-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-emerald-400';
  }

  getUtilizationTextClass(percentage: number): string {
    if (percentage >= 90) return 'text-rose-600 dark:text-rose-400';
    if (percentage >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  }

  formatCardNumber(lastFour: string | null | undefined): string {
    if (!lastFour) return '••••';
    return `••${lastFour}`;
  }
}
