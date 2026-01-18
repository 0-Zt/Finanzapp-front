import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError, of } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
}

export interface AuthResponse {
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  requiresEmailConfirmation?: boolean;
  message?: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

const ACCESS_TOKEN_KEY = 'finanzapp_access_token';
const REFRESH_TOKEN_KEY = 'finanzapp_refresh_token';
const USER_KEY = 'finanzapp_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadStoredUser());
  private isRefreshing = false;

  readonly currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  signUp(payload: SignUpPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/signup`, payload).pipe(
      tap((response) => {
        if (response.accessToken && response.refreshToken) {
          this.handleAuthSuccess(response);
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  signIn(payload: SignInPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/signin`, payload).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => throwError(() => error))
    );
  }

  signOut(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken || this.isRefreshing) {
      return throwError(() => new Error('No refresh token available'));
    }

    this.isRefreshing = true;
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken }).pipe(
      tap((response) => {
        this.handleAuthSuccess(response);
        this.isRefreshing = false;
      }),
      catchError((error) => {
        this.isRefreshing = false;
        this.signOut();
        return throwError(() => error);
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    if (!response.accessToken || !response.refreshToken || !response.user) {
      return;
    }
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private loadStoredUser(): AuthUser | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}
