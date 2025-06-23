import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map } from 'rxjs';
import {
  TaskService as ApiTaskService,
  Task,
  TaskStatus,
  TaskPriority,
} from './api-task.service';
import { FamilyService } from './family.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);

  constructor(
    private apiTaskService: ApiTaskService,
    private familyService: FamilyService
  ) {}

  getAllTasks(): Task[] {
    return this.tasksSubject.value;
  }

  loadTasks(): Observable<Task[]> {
    return this.familyService.getCurrentFamily().pipe(
      map((family) => {
        if (family?.id) {
          this.apiTaskService.getTasks(family.id).subscribe((tasks) => {
            this.tasksSubject.next(tasks);
          });
          return this.tasksSubject.value;
        }
        return [];
      })
    );
  }

  getTaskById(id: string): Task | undefined {
    return this.tasksSubject.value.find((task) => task.id.toString() === id);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasksSubject.value.filter((task) => task.status === status);
  }

  getTasksByMember(memberId: string): Task[] {
    return this.tasksSubject.value.filter((task) =>
      task.assignedMembers?.some((member) => member.id.toString() === memberId)
    );
  }

  getTasksByDueDate(date: Date): Task[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.tasksSubject.value.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= startOfDay && dueDate <= endOfDay;
    });
  }

  getOverdueTasks(): Task[] {
    const now = new Date();
    return this.tasksSubject.value.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < now && task.status !== TaskStatus.Completed;
    });
  }

  addTask(task: any): Observable<Task> {
    return this.familyService.getCurrentFamily().pipe(
      map((family) => {
        if (family?.id) {
          this.apiTaskService.createTask(family.id, task).subscribe();
        }
        return task;
      })
    );
  }

  updateTask(updatedTask: any): Observable<Task> {
    return this.familyService.getCurrentFamily().pipe(
      map((family) => {
        if (family?.id) {
          this.apiTaskService
            .updateTask(family.id, updatedTask.id, updatedTask)
            .subscribe();
        }
        return updatedTask;
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.familyService.getCurrentFamily().pipe(
      map((family) => {
        if (family?.id) {
          this.apiTaskService.deleteTask(family.id, parseInt(id)).subscribe();
        }
      })
    );
  }

  getTasksByTag(tag: string): Task[] {
    return this.tasksSubject.value.filter((task) => task.tags?.includes(tag));
  }
}
