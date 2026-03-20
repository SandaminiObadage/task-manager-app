import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  submitting = false;
  errorMessage = '';

  readonly form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly notifications: NotificationService
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.authService
      .login({
        username: (this.form.value.username || '').trim(),
        password: this.form.value.password || '',
      })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.notifications.success('Login successful. Welcome back.');
          this.router.navigateByUrl('/');
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Login failed. Please check your credentials.';
          this.notifications.error(this.errorMessage);
        },
      });
  }

  controlError(name: 'username' | 'password'): string {
    const control = this.form.get(name);
    if (!control || (!control.touched && !control.dirty)) {
      return '';
    }

    if (control.errors?.['required']) {
      return 'This field is required.';
    }

    return '';
  }
}
