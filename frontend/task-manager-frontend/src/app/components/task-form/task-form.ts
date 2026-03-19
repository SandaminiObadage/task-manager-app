import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, retry, timeout } from 'rxjs';

import { TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskFormComponent implements OnInit {
  readonly statuses: TaskStatus[] = ['TO_DO', 'IN_PROGRESS', 'DONE'];
  private readonly fb = inject(FormBuilder);

  readonly taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(1000)]],
    status: ['TO_DO' as TaskStatus, [Validators.required]],
  });

  editTaskId?: number;
  loading = false;
  submitting = false;
  errorMessage = '';

  constructor(
    private readonly taskService: TaskService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    const parsedId = Number(idParam);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      this.errorMessage = 'Invalid task ID in the URL.';
      return;
    }

    this.editTaskId = parsedId;
    this.loadTaskDetails();
  }

  loadTaskDetails(): void {
    if (!this.editTaskId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.taskService
      .getTaskById(this.editTaskId)
      .pipe(
        timeout(8000),
        retry({ count: 2, delay: 1200 }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (task) => {
          this.taskForm.patchValue({
            title: task.title,
            description: task.description || '',
            status: task.status,
          });
        },
        error: (error) => {
          const isTimeout = error?.name === 'TimeoutError';
          const isNetworkError = error?.status === 0;
          this.errorMessage = isTimeout
            ? 'Loading task details timed out. Please try again in a few seconds.'
            : isNetworkError
              ? 'Cannot reach the backend API. Confirm Docker services are running on port 8080.'
              : error?.error?.message || 'Failed to load task details.';
        },
      });
  }

  get isEditMode(): boolean {
    return !!this.editTaskId;
  }

  submit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.submitting = true;

    const payload = {
      title: (this.taskForm.value.title || '').trim(),
      description: this.taskForm.value.description?.trim() || null,
      status: this.taskForm.value.status as TaskStatus,
    };

    const request$ = this.isEditMode
      ? this.taskService.updateTask(this.editTaskId as number, payload)
      : this.taskService.createTask(payload);

    request$.pipe(finalize(() => (this.submitting = false))).subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: (error) => {
        const validationErrors = error?.error?.validationErrors as Record<string, string> | undefined;
        if (validationErrors) {
          Object.entries(validationErrors).forEach(([field, message]) => {
            const control = this.taskForm.get(field);
            control?.setErrors({ api: message });
          });
        }
        this.errorMessage = error?.error?.message || 'Failed to save task.';
      },
    });
  }

  controlError(controlName: 'title' | 'description' | 'status'): string {
    const control = this.taskForm.get(controlName);
    if (!control || (!control.touched && !control.dirty)) {
      return '';
    }

    if (control.errors?.['required']) {
      return 'This field is required.';
    }
    if (control.errors?.['maxlength']) {
      return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed.`;
    }
    if (control.errors?.['api']) {
      return control.errors['api'];
    }
    return '';
  }
}
