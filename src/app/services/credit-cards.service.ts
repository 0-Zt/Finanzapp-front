import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  ApiCreditCard,
  ApiCreditCardTransaction,
  ApiCreditCardPayment,
  CreditCardsSummary,
  CreditCardDetailSummary,
  CreateCreditCardPayload,
  UpdateCreditCardPayload,
  CreateCardTransactionPayload,
  UpdateCardTransactionPayload,
  CreateCardPaymentPayload,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CreditCardsService {
  private readonly baseUrl = `${API_BASE_URL}/credit-cards`;

  constructor(private readonly http: HttpClient) {}

  // ==================== CREDIT CARDS ====================

  getAllCards(): Observable<ApiCreditCard[]> {
    return this.http.get<ApiCreditCard[]>(this.baseUrl);
  }

  getCardsSummary(): Observable<CreditCardsSummary> {
    return this.http.get<CreditCardsSummary>(`${this.baseUrl}/summary`);
  }

  getCardById(cardId: number): Observable<ApiCreditCard> {
    return this.http.get<ApiCreditCard>(`${this.baseUrl}/${cardId}`);
  }

  getCardDetailSummary(cardId: number): Observable<CreditCardDetailSummary> {
    return this.http.get<CreditCardDetailSummary>(`${this.baseUrl}/${cardId}/summary`);
  }

  createCard(payload: CreateCreditCardPayload): Observable<ApiCreditCard> {
    return this.http.post<ApiCreditCard>(this.baseUrl, payload);
  }

  updateCard(cardId: number, payload: UpdateCreditCardPayload): Observable<ApiCreditCard> {
    return this.http.put<ApiCreditCard>(`${this.baseUrl}/${cardId}`, payload);
  }

  deleteCard(cardId: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/${cardId}`);
  }

  // ==================== CARD TRANSACTIONS ====================

  getCardTransactions(
    cardId: number,
    limit: number = 50,
    offset: number = 0
  ): Observable<ApiCreditCardTransaction[]> {
    return this.http.get<ApiCreditCardTransaction[]>(
      `${this.baseUrl}/${cardId}/transactions`,
      { params: { limit: limit.toString(), offset: offset.toString() } }
    );
  }

  createTransaction(payload: CreateCardTransactionPayload): Observable<ApiCreditCardTransaction> {
    return this.http.post<ApiCreditCardTransaction>(`${this.baseUrl}/transactions`, payload);
  }

  updateTransaction(
    transactionId: number,
    payload: UpdateCardTransactionPayload
  ): Observable<ApiCreditCardTransaction> {
    return this.http.put<ApiCreditCardTransaction>(
      `${this.baseUrl}/transactions/${transactionId}`,
      payload
    );
  }

  deleteTransaction(transactionId: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/transactions/${transactionId}`);
  }

  // ==================== CARD PAYMENTS ====================

  getCardPayments(
    cardId: number,
    limit: number = 20,
    offset: number = 0
  ): Observable<ApiCreditCardPayment[]> {
    return this.http.get<ApiCreditCardPayment[]>(
      `${this.baseUrl}/${cardId}/payments`,
      { params: { limit: limit.toString(), offset: offset.toString() } }
    );
  }

  createPayment(payload: CreateCardPaymentPayload): Observable<ApiCreditCardPayment> {
    return this.http.post<ApiCreditCardPayment>(`${this.baseUrl}/payments`, payload);
  }
}
