import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Task, TaskStatus } from '../../models/task';
import { NotificationService } from '../../services/notification';
import { TaskService } from '../../services/task';

type TaskDetailsResponse = Task | { task?: Task; data?: Task };
type TaskDetailsCandidate = Task & { descrintion?: string | null };

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
  taskLoaded = true;
  loading = false;
  submitting = false;
  errorMessage = '';

  constructor(
    private readonly taskService: TaskService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');

      if (!idParam) {
        this.editTaskId = undefined;
        this.taskLoaded = true;
        this.errorMessage = '';
        this.taskForm.reset({
          title: '',
          description: '',
          status: 'TO_DO',
        });
        return;
      }

      const parsedId = Number(idParam);
      if (!Number.isFinite(parsedId) || parsedId <= 0) {
        this.taskLoaded = false;
        this.errorMessage = 'Invalid task ID in the URL.';
        return;
      }

      this.editTaskId = parsedId;
      this.taskLoaded = false;
      this.loadTaskDetails();
    });
  }

  loadTaskDetails(): void {
    if (!this.editTaskId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.taskService
      .getTaskById(this.editTaskId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response: TaskDetailsResponse) => {
          const task = this.extractTaskFromResponse(response);

          if (!task) {
            this.taskLoaded = false;
            this.errorMessage = 'Task details response did not contain expected fields.';
            return;
          }

          const normalizedStatus = this.statuses.includes(task.status)
            ? task.status
            : 'TO_DO';

          this.taskForm.patchValue({
            title: task.title || '',
            description: task.description || '',
            status: normalizedStatus,
          });

          this.taskLoaded = true;
        },
        error: (error) => {
          const isNetworkError = error?.status === 0;
          this.taskLoaded = false;
          this.errorMessage = isNetworkError
            ? 'Cannot reach the backend API. Confirm Docker services are running on port 8080.'
            : error?.error?.message || 'Failed to load task details.';
        },
      });
  }

  private extractTaskFromResponse(response: TaskDetailsResponse): Task | null {
    const candidate = this.isTask(response)
      ? response
      : this.isTask(response?.task)
        ? response.task
        : this.isTask(response?.data)
          ? response.data
          : null;

    if (!candidate) {
      return null;
    }

    const compatibleCandidate = candidate as TaskDetailsCandidate;

    return {
      ...candidate,
      title: candidate.title ?? '',
      description: compatibleCandidate.description ?? compatibleCandidate.descrintion ?? '',
      status: candidate.status,
    };
  }

  private isTask(value: unknown): value is Task {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<Task>;
    return (
      typeof candidate.title === 'string' &&
      typeof candidate.status === 'string' &&
      ['TO_DO', 'IN_PROGRESS', 'DONE'].includes(candidate.status)
    );
  }

  get isEditMode(): boolean {
    return !!this.editTaskId;
  }

  submit(): void {
    if (this.isEditMode && !this.taskLoaded) {
      this.errorMessage = 'Task details are not loaded yet. Please retry loading task details.';
      return;
    }

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

    const successMessage = this.isEditMode
      ? 'Task updated successfully.'
      : 'Task created successfully.';

    request$.pipe(finalize(() => (this.submitting = false))).subscribe({
      next: () => {
        this.notifications.success(successMessage);
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
        this.notifications.error(this.errorMessage);
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
