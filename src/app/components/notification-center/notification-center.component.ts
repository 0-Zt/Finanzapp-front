import { ChangeDetectionStrategy, Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsService } from '../../services/notifications.service';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { ApiNotification } from '../../models/api.models';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, NotificationItemComponent],
  templateUrl: './notification-center.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);

  @Output() close = new EventEmitter<void>();

  notifications = this.notificationsService.notifications;
  unreadCount = this.notificationsService.unreadCount;
  isLoading = this.notificationsService.isLoading;
  hasMore = signal(false);

  private offset = 0;
  private readonly limit = 20;

  ngOnInit(): void {
    // Load notifications when opened
    this.loadNotifications();
  }

  async loadNotifications(): Promise<void> {
    try {
      await this.notificationsService.loadNotifications({
        limit: this.limit,
        offset: 0,
      });
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.notificationsService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  async onRead(id: number): Promise<void> {
    try {
      await this.notificationsService.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async onDismiss(id: number): Promise<void> {
    try {
      await this.notificationsService.dismiss(id);
    } catch (error) {
      console.error('Failed to dismiss:', error);
    }
  }

  onAction(notification: ApiNotification): void {
    // Mark as read and navigate
    this.notificationsService.markAsRead(notification.id);

    if (notification.metadata?.['action_url']) {
      this.router.navigateByUrl(notification.metadata['action_url']);
      this.close.emit();
    }
  }

  async loadMore(): Promise<void> {
    try {
      this.offset += this.limit;
      await this.notificationsService.loadNotifications({
        limit: this.limit,
        offset: this.offset,
      });
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    }
  }

  closePanel(): void {
    this.close.emit();
  }
}
