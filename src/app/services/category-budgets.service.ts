import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  ApiCategoryBudget,
  ApiBudgetSummary,
  CreateCategoryBudgetPayload,
  UpdateCategoryBudgetPayload,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CategoryBudgetsService {
  constructor(private readonly http: HttpClient) {}

  getBudgets(): Observable<ApiCategoryBudget[]> {
    return this.http.get<ApiCategoryBudget[]>(`${API_BASE_URL}/category-budgets`);
  }

  getProgress(): Observable<ApiBudgetSummary> {
    return this.http.get<ApiBudgetSummary>(`${API_BASE_URL}/category-budgets/progress`);
  }

  createBudget(payload: CreateCategoryBudgetPayload): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/category-budgets`, payload);
  }

  updateBudget(id: number, payload: UpdateCategoryBudgetPayload): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/category-budgets/${id}`, payload);
  }

  deleteBudget(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE_URL}/category-budgets/${id}`);
  }
}
