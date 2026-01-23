import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-fab',
  standalone: true,
  templateUrl: './fab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FabComponent {
  @Output() fabClick = new EventEmitter<void>();

  onClick(): void {
    this.fabClick.emit();
  }
}
