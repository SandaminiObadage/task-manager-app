import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  private readonly timeoutByToastId = new Map<number, ReturnType<typeof setTimeout>>();
  private nextToastId = 1;

  readonly toasts$ = this.toastsSubject.asObservable();

  success(text: string, durationMs = 3000): number {
    return this.show('success', text, durationMs);
  }

  error(text: string, durationMs = 4500): number {
    return this.show('error', text, durationMs);
  }

  info(text: string, durationMs = 3200): number {
    return this.show('info', text, durationMs);
  }

  warning(text: string, durationMs = 3800): number {
    return this.show('warning', text, durationMs);
  }

  dismiss(id: number): void {
    const timer = this.timeoutByToastId.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timeoutByToastId.delete(id);
    }

    const current = this.toastsSubject.value;
    this.toastsSubject.next(current.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.timeoutByToastId.forEach((timer) => clearTimeout(timer));
    this.timeoutByToastId.clear();
    this.toastsSubject.next([]);
  }

  private show(type: ToastType, text: string, durationMs: number): number {
    const id = this.nextToastId++;
    const toast: ToastMessage = { id, type, text };

    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, toast]);

    const timeoutId = setTimeout(() => {
      this.dismiss(id);
    }, durationMs);

    this.timeoutByToastId.set(id, timeoutId);
    return id;
  }
}
