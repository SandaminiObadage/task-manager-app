import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task, TaskStatus } from '../models/task';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class TaskService {

  private apiUrl = '/api/tasks';

  constructor(private http: HttpClient) {}

  getTasks(status?: TaskStatus): Observable<Task[]> {
    const url = status ? `${this.apiUrl}?status=${status}` : this.apiUrl;
    return this.http.get<Task[]>(url);
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(task: Omit<Task, 'id' | 'createdAt'>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: number, task: Omit<Task, 'id' | 'createdAt'>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}


