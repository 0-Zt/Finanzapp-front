import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiNotification } from '../../models/api.models';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItemComponent {
  @Input({ required: true }) notification!: ApiNotification;
  @Output() read = new EventEmitter<number>();
  @Output() dismiss = new EventEmitter<number>();
  @Output() action = new EventEmitter<ApiNotification>();

  onRead(): void {
    if (!this.notification.isRead) {
      this.read.emit(this.notification.id);
    }
  }

  onDismiss(event: Event): void {
    event.stopPropagation();
    this.dismiss.emit(this.notification.id);
  }

  onClick(): void {
    this.onRead();
    if (this.notification.metadata?.['action_url']) {
      this.action.emit(this.notification);
    }
  }

  getTimeAgo(): string {
    const now = new Date();
    const created = new Date(this.notification.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return created.toLocaleDateString('es-CL');
  }

  getPriorityClass(): string {
    switch (this.notification.priority) {
      case 'urgent':
        return 'notification-urgent';
      case 'high':
        return 'notification-high';
      case 'medium':
        return 'notification-medium';
      default:
        return 'notification-low';
    }
  }
}
