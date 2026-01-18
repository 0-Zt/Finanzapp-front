import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { DashboardPayload } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getDashboard(limit: number = 6): Observable<DashboardPayload> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<DashboardPayload>(`${API_BASE_URL}/dashboard`, { params });
  }
}
