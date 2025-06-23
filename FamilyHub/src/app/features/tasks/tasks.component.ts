import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl } from '@angular/forms';

import {
  Task,
  TaskService,
  TaskStatus,
  TaskPriority,
} from '../../services/api-task.service';
import { FamilyService } from '../../services/family.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    MatProgressSpinner,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatExpansionModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  taskStatuses = [
    { value: TaskStatus.Todo, name: 'To Do' },
    { value: TaskStatus.InProgress, name: 'In Progress' },
    { value: TaskStatus.Completed, name: 'Completed' },
    { value: TaskStatus.Canceled, name: 'Canceled' },
  ];
  taskPriorities = [
    { value: TaskPriority.Low, name: 'Low' },
    { value: TaskPriority.Medium, name: 'Medium' },
    { value: TaskPriority.High, name: 'High' },
    { value: TaskPriority.Urgent, name: 'Urgent' },
  ];
  loading = true;
  currentFamilyId: number | null = null;

  // Filter controls
  statusFilter = new FormControl('');
  priorityFilter = new FormControl('');
  searchFilter = new FormControl('');
  dateFilter = new FormControl(null);

  // Display columns for the mat-table
  displayedColumns: string[] = [
    'title',
    'status',
    'priority',
    'dueDate',
    'assignedTo',
    'actions',
  ];

  constructor(
    private taskService: TaskService,
    private familyService: FamilyService
  ) {}
  ngOnInit(): void {
    this.loadTasks();

    // Set up filter listeners
    this.statusFilter.valueChanges.subscribe(() => this.applyFilters());
    this.priorityFilter.valueChanges.subscribe(() => this.applyFilters());
    this.searchFilter.valueChanges.subscribe(() => this.applyFilters());
    this.dateFilter.valueChanges.subscribe(() => this.applyFilters());
  }
  loadTasks(): void {
    this.loading = true;
    // First get the current family, then load tasks for that family
    this.familyService.getCurrentFamily().subscribe({
      next: (family) => {
        if (family && family.id) {
          this.currentFamilyId = family.id;
          this.taskService.getTasks(family.id).subscribe({
            next: (tasks) => {
              this.tasks = tasks;
              this.filteredTasks = [...this.tasks];
              this.loading = false;
            },
            error: (error) => {
              console.error('Error loading tasks:', error);
              this.loading = false;
            },
          });
        } else {
          console.error('No valid family found');
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading family:', error);
        if (error.message && error.message.includes('No family found')) {
          // User needs to create a family first
          console.log('User needs to create a family first');
          // TODO: Show a message or redirect to family creation
        }
        this.loading = false;
      },
    });
  }
  applyFilters(): void {
    this.filteredTasks = this.tasks.filter((task) => {
      // Status filter
      if (
        this.statusFilter.value &&
        task.status !== Number(this.statusFilter.value)
      ) {
        return false;
      }

      // Priority filter
      if (
        this.priorityFilter.value &&
        task.priority !== Number(this.priorityFilter.value)
      ) {
        return false;
      }

      // Search filter (title and description)
      if (this.searchFilter.value) {
        const searchTerm = this.searchFilter.value.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchTerm);
        const matchesDescription =
          task.description?.toLowerCase().includes(searchTerm) || false;
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      // Date filter
      if (this.dateFilter.value && task.dueDate) {
        const filterDate = new Date(this.dateFilter.value);
        filterDate.setHours(0, 0, 0, 0);

        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);

        if (filterDate.getTime() !== taskDate.getTime()) {
          return false;
        }
      }

      return true;
    });
  }

  clearFilters(): void {
    this.statusFilter.setValue('');
    this.priorityFilter.setValue('');
    this.searchFilter.setValue('');
    this.dateFilter.setValue(null);
    this.filteredTasks = [...this.tasks];
  }

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.Low:
        return 'priority-low';
      case TaskPriority.Medium:
        return 'priority-medium';
      case TaskPriority.High:
        return 'priority-high';
      case TaskPriority.Urgent:
        return 'priority-urgent';
      default:
        return '';
    }
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.Todo:
        return 'status-todo';
      case TaskStatus.InProgress:
        return 'status-in-progress';
      case TaskStatus.Completed:
        return 'status-completed';
      case TaskStatus.Canceled:
        return 'status-canceled';
      default:
        return '';
    }
  }

  getStatusName(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.Todo:
        return 'To Do';
      case TaskStatus.InProgress:
        return 'In Progress';
      case TaskStatus.Completed:
        return 'Completed';
      case TaskStatus.Canceled:
        return 'Canceled';
      default:
        return 'Unknown';
    }
  }

  getPriorityName(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.Low:
        return 'Low';
      case TaskPriority.Medium:
        return 'Medium';
      case TaskPriority.High:
        return 'High';
      case TaskPriority.Urgent:
        return 'Urgent';
      default:
        return 'Unknown';
    }
  }

  createFamily(): void {
    // For now, let's create a simple family with a default name
    // In a real app, this would open a dialog or navigate to a family creation form
    const defaultFamilyName = 'My Family';
    this.familyService.createFamily({ name: defaultFamilyName }).subscribe({
      next: (family) => {
        console.log('Family created successfully:', family);
        this.currentFamilyId = family.id;
        this.loadTasks(); // Reload tasks now that we have a family
      },
      error: (error) => {
        console.error('Error creating family:', error);
      },
    });
  }
}
