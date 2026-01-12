import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { CreateTransactionPayload, UpdateTransactionPayload } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  constructor(private readonly http: HttpClient) {}

  createTransaction(payload: CreateTransactionPayload): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/transactions`, payload);
  }

  updateTransaction(id: number, payload: UpdateTransactionPayload): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/transactions/${id}`, payload);
  }

  deleteTransaction(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE_URL}/transactions/${id}`);
  }
}
