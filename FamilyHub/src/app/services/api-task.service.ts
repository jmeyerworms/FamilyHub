import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  recurrence?: string;
  recurrencePattern?: string;
  location?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  assignedMembers: AssignedMember[];
}

export interface AssignedMember {
  id: number;
  name: string;
  avatar?: string;
  isVirtual: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  assignedMemberIds?: number[];
  location?: string;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedMemberIds?: number[];
  location?: string;
  tags?: string[];
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export enum TaskStatus {
  Todo = 0,
  InProgress = 1,
  Completed = 2,
  Canceled = 3,
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly apiUrl = environment.apiUrl;
  private tasksSubject = new BehaviorSubject<Task[]>([]);

  tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  getTasks(familyId: number): Observable<Task[]> {
    const headers = this.authService.getAuthHeaders();

    return this.http
      .get<Task[]>(`${this.apiUrl}/families/${familyId}/tasks`, { headers })
      .pipe(
        tap((tasks) => {
          this.tasksSubject.next(Array.isArray(tasks) ? tasks : [tasks]);
        }),
        catchError((error) => {
          console.error('Error getting tasks:', error);
          return throwError(() => error);
        })
      );
  }

  createTask(familyId: number, taskData: CreateTaskRequest): Observable<Task> {
    const headers = this.authService.getAuthHeaders();

    return this.http
      .post<Task>(`${this.apiUrl}/families/${familyId}/tasks`, taskData, {
        headers,
      })
      .pipe(
        tap((newTask) => {
          const currentTasks = this.tasksSubject.value;
          this.tasksSubject.next([...currentTasks, newTask]);
        }),
        catchError((error) => {
          console.error('Error creating task:', error);
          return throwError(() => error);
        })
      );
  }

  updateTask(
    familyId: number,
    taskId: number,
    taskData: UpdateTaskRequest
  ): Observable<Task> {
    const headers = this.authService.getAuthHeaders();

    return this.http
      .put<Task>(
        `${this.apiUrl}/families/${familyId}/tasks/${taskId}`,
        taskData,
        { headers }
      )
      .pipe(
        tap((updatedTask) => {
          const currentTasks = this.tasksSubject.value;
          const index = currentTasks.findIndex((t) => t.id === taskId);
          if (index !== -1) {
            currentTasks[index] = updatedTask;
            this.tasksSubject.next([...currentTasks]);
          }
        }),
        catchError((error) => {
          console.error('Error updating task:', error);
          return throwError(() => error);
        })
      );
  }

  deleteTask(familyId: number, taskId: number): Observable<void> {
    const headers = this.authService.getAuthHeaders();

    return this.http
      .delete<void>(`${this.apiUrl}/families/${familyId}/tasks/${taskId}`, {
        headers,
      })
      .pipe(
        tap(() => {
          const currentTasks = this.tasksSubject.value;
          this.tasksSubject.next(currentTasks.filter((t) => t.id !== taskId));
        }),
        catchError((error) => {
          console.error('Error deleting task:', error);
          return throwError(() => error);
        })
      );
  }

  // Helper methods for filtering tasks (client-side)
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasksSubject.value.filter((task) => task.status === status);
  }

  getTasksByPriority(priority: TaskPriority): Task[] {
    return this.tasksSubject.value.filter((task) => task.priority === priority);
  }

  getOverdueTasks(): Task[] {
    const now = new Date();
    return this.tasksSubject.value.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== TaskStatus.Completed
    );
  }

  getTasksByMember(memberId: number): Task[] {
    return this.tasksSubject.value.filter((task) =>
      task.assignedMembers.some((member) => member.id === memberId)
    );
  }
}
