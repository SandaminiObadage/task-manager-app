import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, retry, timeout } from 'rxjs';

import { Task, TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task';

@Component({
  selector: 'app-task-list',
  standalone: true,
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css'],
  imports: [CommonModule, FormsModule, RouterLink],
})
export class TaskListComponent implements OnInit {
  readonly statuses: TaskStatus[] = ['TO_DO', 'IN_PROGRESS', 'DONE'];

  tasks: Task[] = [];
  selectedStatus: '' | TaskStatus = '';
  searchTerm = '';
  loading = false;
  errorMessage = '';

  constructor(private readonly taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.errorMessage = '';

    this.taskService
      .getTasks(this.selectedStatus || undefined)
      .pipe(
        timeout(8000),
        retry({ count: 2, delay: 1200 }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
        },
        error: (error) => {
          const isTimeout = error?.name === 'TimeoutError';
          const isNetworkError = error?.status === 0;
          this.errorMessage = isTimeout
            ? 'The backend is taking too long to respond. Make sure Spring Boot and MySQL are running.'
            : isNetworkError
              ? 'Cannot reach the backend API. Confirm Docker services are running on port 8080.'
              : error?.error?.message || 'Failed to load tasks. Please try again.';
        },
      });
  }

  onFilterChange(): void {
    this.loadTasks();
  }

  deleteTask(taskId: number | undefined): void {
    if (!taskId) {
      return;
    }

    const shouldDelete = window.confirm('Delete this task? This action cannot be undone.');
    if (!shouldDelete) {
      return;
    }

    this.taskService.deleteTask(taskId).subscribe({
      next: () => this.loadTasks(),
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to delete task.';
      },
    });
  }

  get visibleTasks(): Task[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return this.tasks;
    }

    return this.tasks.filter((task) => {
      const title = task.title.toLowerCase();
      const description = (task.description || '').toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }

  trackByTaskId(_: number, task: Task): number | undefined {
    return task.id;
  }
}
