import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { DashboardPayload } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getDashboard(userId: number, limit: number = 6): Observable<DashboardPayload> {
    const params = new HttpParams()
      .set('userId', String(userId))
      .set('limit', String(limit));

    return this.http.get<DashboardPayload>(`${API_BASE_URL}/dashboard`, { params });
  }
}
