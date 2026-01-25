import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService } from '../../services/notifications.service';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, NotificationCenterComponent],
  templateUrl: './notification-bell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly notificationsService = inject(NotificationsService);
  private readonly elementRef = inject(ElementRef);

  unreadCount = this.notificationsService.unreadCount;
  isOpen = signal(false);

  ngOnInit(): void {
    // Load initial count
    this.notificationsService.refreshUnreadCount();
    // Start polling for updates
    this.notificationsService.startPolling();
  }

  ngOnDestroy(): void {
    this.notificationsService.stopPolling();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close if click is outside this component
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeNotificationCenter();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.closeNotificationCenter();
    }
  }

  toggleNotificationCenter(): void {
    this.isOpen.update((v) => !v);
  }

  closeNotificationCenter(): void {
    this.isOpen.set(false);
  }
}
