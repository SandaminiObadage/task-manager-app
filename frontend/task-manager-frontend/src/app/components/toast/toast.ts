import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  constructor(public readonly notifications: NotificationService) {}

  dismiss(id: number): void {
    this.notifications.dismiss(id);
  }

  trackByToastId(_: number, toast: { id: number }): number {
    return toast.id;
  }
}
