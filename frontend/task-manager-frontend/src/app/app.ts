import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';

import { AuthService } from './services/auth';
import { ToastComponent } from './components/toast/toast';
import { NotificationService } from './services/notification';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  appName = 'Task Manager';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly notifications: NotificationService
  ) {}

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUsername(): string {
    return this.authService.getUsername() || 'User';
  }

  logout(): void {
    this.authService.logout();
    this.notifications.info('Logged out successfully.');
    this.router.navigateByUrl('/login');
  }
}
