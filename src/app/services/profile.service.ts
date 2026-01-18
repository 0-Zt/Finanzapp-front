import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { UserProfile, FixedExpense, CreateFixedExpensePayload, UpdateFixedExpensePayload, UpdateProfilePayload } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API_BASE_URL}/profile`);
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${API_BASE_URL}/profile`, payload);
  }

  getFixedExpenses(): Observable<FixedExpense[]> {
    return this.http.get<FixedExpense[]>(`${API_BASE_URL}/profile/fixed-expenses`);
  }

  createFixedExpense(payload: CreateFixedExpensePayload): Observable<FixedExpense> {
    return this.http.post<FixedExpense>(`${API_BASE_URL}/profile/fixed-expenses`, payload);
  }

  updateFixedExpense(id: number, payload: UpdateFixedExpensePayload): Observable<FixedExpense> {
    return this.http.put<FixedExpense>(`${API_BASE_URL}/profile/fixed-expenses/${id}`, payload);
  }

  deleteFixedExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/profile/fixed-expenses/${id}`);
  }
}
