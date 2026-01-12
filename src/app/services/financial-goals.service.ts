import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  ApiFinancialGoal,
  CreateFinancialGoalPayload,
  UpdateFinancialGoalPayload,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class FinancialGoalsService {
  constructor(private readonly http: HttpClient) {}

  getGoals(userId: number): Observable<ApiFinancialGoal[]> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<ApiFinancialGoal[]>(`${API_BASE_URL}/financial-goals`, { params });
  }

  createGoal(payload: CreateFinancialGoalPayload): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/financial-goals`, payload);
  }

  updateGoal(id: number, payload: UpdateFinancialGoalPayload): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/financial-goals/${id}`, payload);
  }

  deleteGoal(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE_URL}/financial-goals/${id}`);
  }
}
