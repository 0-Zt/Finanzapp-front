import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { ApiExpenseCategory } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  constructor(private readonly http: HttpClient) {}

  getCategories(): Observable<ApiExpenseCategory[]> {
    return this.http.get<ApiExpenseCategory[]>(`${API_BASE_URL}/categories`);
  }
}
