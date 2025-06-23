import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TaskService } from '../../../services/TaskService';
import {
  Task,
  TaskStatus,
  TaskPriority,
} from '../../../services/api-task.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    DatePipe,
  ],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss',
})
export class TaskDetailsComponent implements OnInit, OnDestroy {
  task: Task | null = null;
  isLoading = true;
  taskNotFound = false;
  errorMessage: string | null = null;

  // Make enums available in template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  // Make Math available in template
  Math = Math;

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Listen to route parameter changes
    this.subscription.add(
      this.route.paramMap.subscribe((params) => {
        const taskId = params.get('id');
        this.loadTask(taskId);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadTask(taskId: string | null = null): void {
    // Reset state
    this.isLoading = true;
    this.taskNotFound = false;
    this.errorMessage = null;
    this.task = null;

    if (!taskId) {
      this.taskNotFound = true;
      this.isLoading = false;
      return;
    }

    try {
      const foundTask = this.taskService.getTaskById(taskId);
      this.task = foundTask || null;
      this.taskNotFound = !foundTask;
      this.isLoading = false;
    } catch (error: any) {
      console.error('Error loading task:', error);
      this.task = null;
      this.taskNotFound = true;
      this.errorMessage = 'Failed to load task. Please try again.';
      this.isLoading = false;
    }
  }

  retryLoadTask(): void {
    const taskId = this.route.snapshot.paramMap.get('id');
    this.loadTask(taskId);
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }

  editTask(): void {
    if (this.task) {
      this.router.navigate(['/tasks/edit', this.task.id]);
    }
  }
  toggleTaskStatus(): void {
    if (!this.task) return;

    const newStatus =
      this.task.status === TaskStatus.Completed
        ? TaskStatus.InProgress
        : TaskStatus.Completed;

    try {
      this.task.status = newStatus;
      // Update through service if needed
      // this.taskService.updateTask(this.task);
    } catch (error: any) {
      console.error('Error updating task status:', error);
      // Revert the status change on error
      this.task.status =
        this.task.status === TaskStatus.Completed
          ? TaskStatus.InProgress
          : TaskStatus.Completed;
    }
  }
  deleteTask(): void {
    if (!this.task) return;

    if (
      confirm(
        'Are you sure you want to delete this task? This action cannot be undone.'
      )
    ) {
      try {
        // Convert number id to string since service expects string
        // this.taskService.deleteTask(this.task.id.toString());
        this.router.navigate(['/tasks']);
      } catch (error: any) {
        console.error('Error deleting task:', error);
        this.errorMessage = 'Failed to delete task. Please try again.';
      }
    }
  }
  duplicateTask(): void {
    if (!this.task) return;

    // Create a new task object instead of using Task constructor
    const duplicatedTask = {
      title: `${this.task.title} (Copy)`,
      description: this.task.description,
      dueDate: this.task.dueDate,
      priority: this.task.priority,
      status: TaskStatus.Todo,
      location: this.task.location,
      tags: [...(this.task.tags || [])],
    };

    try {
      // this.taskService.addTask(duplicatedTask);
      // this.router.navigate(['/tasks/details', duplicatedTask.id]);
      this.router.navigate(['/tasks']);
    } catch (error: any) {
      console.error('Error duplicating task:', error);
      this.errorMessage = 'Failed to duplicate task. Please try again.';
    }
  }
  postponeTask(days: number): void {
    if (!this.task || !this.task.dueDate) return;

    const originalDate = this.task.dueDate;
    const newDueDate = new Date(this.task.dueDate);
    newDueDate.setDate(newDueDate.getDate() + days);

    try {
      this.task.dueDate = newDueDate.toISOString();
      // this.taskService.updateTask(this.task);
    } catch (error: any) {
      console.error('Error postponing task:', error);
      // Revert the date change on error
      this.task.dueDate = originalDate;
      this.errorMessage = 'Failed to postpone task. Please try again.';
    }
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

  getStatusIcon(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.Todo:
        return 'radio_button_unchecked';
      case TaskStatus.InProgress:
        return 'schedule';
      case TaskStatus.Completed:
        return 'check_circle';
      case TaskStatus.Canceled:
        return 'cancel';
      default:
        return 'radio_button_unchecked';
    }
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.Todo:
        return 'status-todo';
      case TaskStatus.InProgress:
        return 'status-inprogress';
      case TaskStatus.Completed:
        return 'status-completed';
      case TaskStatus.Canceled:
        return 'status-cancelled';
      default:
        return 'status-todo';
    }
  }

  getDaysUntilDue(): number | null {
    if (!this.task?.dueDate) return null;

    const today = new Date();
    const dueDate = new Date(this.task.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  isOverdue(): boolean {
    if (!this.task?.dueDate) return false;
    const dueDate = new Date(this.task.dueDate);
    return dueDate < new Date() && this.task.status !== TaskStatus.Completed;
  }

  formatPriority(priority: TaskPriority): string {
    return priority.toString();
  }

  formatStatus(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.Todo:
        return 'To Do';
      case TaskStatus.InProgress:
        return 'In Progress';
      case TaskStatus.Completed:
        return 'Completed';
      case TaskStatus.Canceled:
        return 'Cancelled';
      default:
        return String(status);
    }
  }
}
