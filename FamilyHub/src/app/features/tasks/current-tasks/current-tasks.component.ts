import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import {
  TaskService as ApiTaskService,
  Task,
  TaskStatus,
  TaskPriority,
} from '../../../services/api-task.service';
import { FamilyService } from '../../../services/family.service';

@Component({
  selector: 'app-current-tasks',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    DatePipe,
  ],
  templateUrl: './current-tasks.component.html',
  styleUrl: './current-tasks.component.scss',
})
export class CurrentTasksComponent implements OnInit {
  overdueTasks: Task[] = [];
  todayTasks: Task[] = [];
  loading = true;

  constructor(
    private apiTaskService: ApiTaskService,
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  private loadTasks(): void {
    this.loading = true;
    this.familyService.getCurrentFamily().subscribe({
      next: (family) => {
        if (family?.id) {
          this.apiTaskService.getTasks(family.id).subscribe({
            next: (tasks) => {
              this.filterTasks(tasks);
              this.loading = false;
            },
            error: (error) => {
              console.error('Error loading tasks:', error);
              this.loading = false;
            },
          });
        } else {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading family:', error);
        this.loading = false;
      },
    });
  }

  private filterTasks(tasks: Task[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get overdue tasks
    this.overdueTasks = tasks.filter((task) => {
      if (!task.dueDate || task.status === TaskStatus.Completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < today;
    });

    // Get today's tasks
    this.todayTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });
  }

  toggleTaskComplete(task: Task): void {
    const newStatus =
      task.status === TaskStatus.Completed
        ? TaskStatus.Todo
        : TaskStatus.Completed;

    this.familyService.getCurrentFamily().subscribe((family) => {
      if (family?.id) {
        const updateData = {
          ...task,
          status: newStatus,
        };

        this.apiTaskService
          .updateTask(family.id, task.id, updateData)
          .subscribe({
            next: () => {
              this.loadTasks();
            },
            error: (error) => {
              console.error('Error updating task:', error);
            },
          });
      }
    });
  }

  postponeTask(task: Task, days: number = 1): void {
    if (!task.dueDate) return;

    const newDueDate = new Date(task.dueDate);
    newDueDate.setDate(newDueDate.getDate() + days);

    this.familyService.getCurrentFamily().subscribe((family) => {
      if (family?.id) {
        const updateData = {
          ...task,
          dueDate: newDueDate.toISOString(),
        };

        this.apiTaskService
          .updateTask(family.id, task.id, updateData)
          .subscribe({
            next: () => {
              this.loadTasks();
            },
            error: (error) => {
              console.error('Error updating task:', error);
            },
          });
      }
    });
  }

  deleteTask(taskId: number): void {
    this.familyService.getCurrentFamily().subscribe((family) => {
      if (family?.id) {
        this.apiTaskService.deleteTask(family.id, taskId).subscribe({
          next: () => {
            this.loadTasks();
          },
          error: (error) => {
            console.error('Error deleting task:', error);
          },
        });
      }
    });
  }

  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.High:
        return 'keyboard_arrow_up';
      case TaskPriority.Medium:
        return 'remove';
      case TaskPriority.Low:
        return 'keyboard_arrow_down';
      default:
        return 'remove';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category?.toLowerCase()) {
      case 'family':
        return 'family_restroom';
      case 'work':
        return 'work';
      case 'personal':
      case 'fitness':
        return 'person';
      case 'health':
      case 'appointment':
        return 'favorite';
      case 'education':
      case 'school':
        return 'school';
      case 'shopping':
        return 'shopping_cart';
      default:
        return 'task_alt';
    }
  }
  getDaysOverdue(dueDate: string | Date): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  openTaskDetails(task: Task): void {
    console.log('Opening task details for:', task.title);
    this.router.navigate(['/tasks/details', task.id]);
  }

  addNewTask(): void {
    console.log('Opening new task dialog...');
    this.router.navigate(['/tasks/create']);
  }

  isTaskCompleted(task: Task): boolean {
    return task.status === TaskStatus.Completed;
  }

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.High:
        return 'priority-high';
      case TaskPriority.Medium:
        return 'priority-medium';
      case TaskPriority.Low:
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  }

  getCategoryClass(category: string): string {
    return `category-${category?.toLowerCase() || 'other'}`;
  }
}
