import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';
import {
  ApiNotification,
  ApiNotificationsResponse,
  ApiUnreadCountResponse,
} from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly http = inject(HttpClient);

  // Signals for reactive state
  unreadCount = signal<number>(0);
  notifications = signal<ApiNotification[]>([]);
  isLoading = signal<boolean>(false);

  // For optional polling
  private pollingSubscription?: Subscription;
  private readonly pollingInterval = 5 * 60 * 1000; // 5 minutes

  async loadNotifications(options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<void> {
    this.isLoading.set(true);
    try {
      let params = new HttpParams()
        .set('limit', (options?.limit ?? 20).toString())
        .set('offset', (options?.offset ?? 0).toString());

      if (options?.unreadOnly) {
        params = params.set('unreadOnly', 'true');
      }

      const response = await firstValueFrom(
        this.http.get<ApiNotificationsResponse>(`${API_BASE_URL}/notifications`, { params }),
      );

      if (options?.offset === 0 || !options?.offset) {
        this.notifications.set(response.notifications);
      } else {
        this.notifications.update((current) => [...current, ...response.notifications]);
      }

      this.unreadCount.set(response.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshUnreadCount(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiUnreadCountResponse>(`${API_BASE_URL}/notifications/count`),
      );
      this.unreadCount.set(response.unreadCount);
    } catch (error) {
      console.error('Failed to refresh unread count', error);
    }
  }

  async markAsRead(id: number): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${API_BASE_URL}/notifications/${id}/read`, {}));

      // Update local state
      this.notifications.update((current) =>
        current.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
        ),
      );
      this.unreadCount.update((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${API_BASE_URL}/notifications/read-all`, {}));

      this.notifications.update((current) =>
        current.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      this.unreadCount.set(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
      throw error;
    }
  }

  async dismiss(id: number): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${API_BASE_URL}/notifications/${id}/dismiss`, {}));

      // Check if dismissed notification was unread
      const notification = this.notifications().find((n) => n.id === id);
      const wasUnread = notification && !notification.isRead;

      this.notifications.update((current) => current.filter((n) => n.id !== id));

      if (wasUnread) {
        this.unreadCount.update((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      console.error('Failed to dismiss notification', error);
      throw error;
    }
  }

  startPolling(): void {
    this.stopPolling();
    this.pollingSubscription = interval(this.pollingInterval)
      .pipe(switchMap(() => this.refreshUnreadCount()))
      .subscribe();
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
  }

  reset(): void {
    this.stopPolling();
    this.notifications.set([]);
    this.unreadCount.set(0);
    this.isLoading.set(false);
  }
}
