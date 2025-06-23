import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import {
  TaskService,
  Task,
  TaskPriority,
  TaskStatus,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../../../services/api-task.service';
import {
  FamilyService,
  Family,
  FamilyMember,
} from '../../../services/family.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent implements OnInit, OnDestroy {
  @Input() taskId?: string; // For editing existing tasks

  taskForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  currentFamily: Family | null = null;
  familyMembers: FamilyMember[] = [];
  existingTask: Task | null = null;

  // Form options
  priorityOptions = [
    {
      value: TaskPriority.Low,
      label: 'Low',
      icon: 'keyboard_arrow_down',
      class: 'priority-low',
    },
    {
      value: TaskPriority.Medium,
      label: 'Medium',
      icon: 'remove',
      class: 'priority-medium',
    },
    {
      value: TaskPriority.High,
      label: 'High',
      icon: 'keyboard_arrow_up',
      class: 'priority-high',
    },
    {
      value: TaskPriority.Urgent,
      label: 'Urgent',
      icon: 'priority_high',
      class: 'priority-urgent',
    },
  ];

  statusOptions = [
    { value: TaskStatus.Todo, label: 'To Do', icon: 'radio_button_unchecked' },
    { value: TaskStatus.InProgress, label: 'In Progress', icon: 'schedule' },
    { value: TaskStatus.Completed, label: 'Completed', icon: 'check_circle' },
    { value: TaskStatus.Canceled, label: 'Cancelled', icon: 'cancel' },
  ];

  recurrenceOptions = [
    { value: '', label: 'No Recurrence' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom' },
  ];

  // Available tags for suggestions
  availableTags = [
    'urgent',
    'important',
    'household',
    'shopping',
    'work',
    'personal',
    'health',
    'finance',
    'maintenance',
    'education',
    'social',
    'travel',
  ];

  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private familyService: FamilyService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.taskForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadFamily();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(200),
        ],
      ],
      description: ['', Validators.maxLength(1000)],
      dueDate: [null],
      dueTime: [''],
      priority: [TaskPriority.Medium, Validators.required],
      status: [TaskStatus.Todo, Validators.required],
      location: ['', Validators.maxLength(200)],
      recurrence: [''],
      recurrencePattern: [''],
      tags: this.fb.array([]),
      assignedMemberIds: [[]],
      newTag: [''], // For adding new tags
    });
  }

  private loadFamily(): void {
    this.isLoading = true;
    this.subscription.add(
      this.familyService.getCurrentFamily().subscribe({
        next: (family) => {
          this.currentFamily = family;
          this.familyMembers = family.members || [];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading family:', error);
          this.snackBar.open('Error loading family data', 'Close', {
            duration: 3000,
          });
          this.isLoading = false;
        },
      })
    );
  }

  private checkEditMode(): void {
    const taskIdFromRoute = this.route.snapshot.params['id'];
    const taskId = this.taskId || taskIdFromRoute;

    if (taskId) {
      this.isEditMode = true;
      this.loadTaskForEdit(taskId);
    }
  }

  private loadTaskForEdit(taskId: string): void {
    if (!this.currentFamily) {
      // Wait for family to load first
      this.subscription.add(
        this.familyService.getCurrentFamily().subscribe({
          next: (family) => {
            this.currentFamily = family;
            this.familyMembers = family.members || [];
            this.loadTaskData(taskId);
          },
        })
      );
    } else {
      this.loadTaskData(taskId);
    }
  }
  private loadTaskData(taskId: string): void {
    this.isLoading = true;
    this.subscription.add(
      this.taskService.getTasks(this.currentFamily!.id).subscribe({
        next: (tasks: Task[]) => {
          // Find task by ID (converting both to string for comparison)
          this.existingTask =
            tasks.find((t: Task) => t.id.toString() === taskId.toString()) ||
            null;
          if (this.existingTask) {
            this.populateFormWithTask(this.existingTask);
          } else {
            this.snackBar.open('Task not found', 'Close', { duration: 3000 });
            this.router.navigate(['/tasks']);
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading task:', error);
          this.snackBar.open('Error loading task', 'Close', { duration: 3000 });
          this.isLoading = false;
        },
      })
    );
  }

  private populateFormWithTask(task: Task): void {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueTime = dueDate ? this.formatTimeForInput(dueDate) : '';

    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      dueDate: dueDate,
      dueTime: dueTime,
      priority: task.priority,
      status: task.status,
      location: task.location || '',
      recurrence: task.recurrence || '',
      recurrencePattern: task.recurrencePattern || '',
      assignedMemberIds: task.assignedMembers?.map((m) => m.id) || [],
    });

    // Set tags
    const tagsArray = this.getTagsFormArray();
    tagsArray.clear();
    if (task.tags && task.tags.length > 0) {
      task.tags.forEach((tag) => {
        tagsArray.push(this.fb.control(tag));
      });
    }
  }

  private formatTimeForInput(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  get tagsFormArray(): FormArray {
    return this.taskForm.get('tags') as FormArray;
  }

  private getTagsFormArray(): FormArray {
    return this.taskForm.get('tags') as FormArray;
  }

  addTag(): void {
    const newTagControl = this.taskForm.get('newTag');
    if (newTagControl && newTagControl.value && newTagControl.value.trim()) {
      const newTag = newTagControl.value.trim().toLowerCase();
      const tagsArray = this.getTagsFormArray();

      // Check if tag already exists
      const existingTags = tagsArray.value;
      if (!existingTags.includes(newTag)) {
        tagsArray.push(this.fb.control(newTag));
        newTagControl.setValue('');
      }
    }
  }

  removeTag(index: number): void {
    const tagsArray = this.getTagsFormArray();
    tagsArray.removeAt(index);
  }

  addSuggestedTag(tag: string): void {
    const tagsArray = this.getTagsFormArray();
    const existingTags = tagsArray.value;

    if (!existingTags.includes(tag)) {
      tagsArray.push(this.fb.control(tag));
    }
  }

  onSubmit(): void {
    if (this.taskForm.valid && this.currentFamily) {
      this.isSaving = true;

      const formValue = this.taskForm.value;
      const dueDateTime = this.combineDateAndTime(
        formValue.dueDate,
        formValue.dueTime
      );

      const taskData = {
        title: formValue.title,
        description: formValue.description || undefined,
        dueDate: dueDateTime?.toISOString() || undefined,
        priority: formValue.priority,
        status: formValue.status,
        location: formValue.location || undefined,
        recurrence: formValue.recurrence || undefined,
        recurrencePattern: formValue.recurrencePattern || undefined,
        tags: formValue.tags || [],
        assignedMemberIds: formValue.assignedMemberIds || [],
      };

      if (this.isEditMode && this.existingTask) {
        this.updateTask(taskData as UpdateTaskRequest);
      } else {
        this.createTask(taskData as CreateTaskRequest);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private combineDateAndTime(date: Date | null, time: string): Date | null {
    if (!date) return null;

    const result = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      result.setHours(hours || 0, minutes || 0, 0, 0);
    } else {
      result.setHours(9, 0, 0, 0); // Default to 9 AM if no time specified
    }

    return result;
  }
  private createTask(taskData: CreateTaskRequest): void {
    this.subscription.add(
      this.taskService.createTask(this.currentFamily!.id, taskData).subscribe({
        next: (createdTask: Task) => {
          this.snackBar.open('Task created successfully!', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/tasks', 'details', createdTask.id]);
        },
        error: (error: any) => {
          console.error('Error creating task:', error);
          this.snackBar.open(
            'Error creating task. Please try again.',
            'Close',
            { duration: 3000 }
          );
          this.isSaving = false;
        },
      })
    );
  }

  private updateTask(taskData: UpdateTaskRequest): void {
    this.subscription.add(
      this.taskService
        .updateTask(this.currentFamily!.id, this.existingTask!.id, taskData)
        .subscribe({
          next: (updatedTask: Task) => {
            this.snackBar.open('Task updated successfully!', 'Close', {
              duration: 3000,
            });
            this.router.navigate(['/tasks', 'details', updatedTask.id]);
          },
          error: (error: any) => {
            console.error('Error updating task:', error);
            this.snackBar.open(
              'Error updating task. Please try again.',
              'Close',
              { duration: 3000 }
            );
            this.isSaving = false;
          },
        })
    );
  }

  private markFormGroupTouched(): void {
    Object.keys(this.taskForm.controls).forEach((key) => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    if (this.isEditMode && this.existingTask) {
      this.router.navigate(['/tasks', 'details', this.existingTask.id]);
    } else {
      this.router.navigate(['/tasks']);
    }
  }

  // Helper methods for template
  getPriorityIcon(priority: TaskPriority): string {
    const option = this.priorityOptions.find((p) => p.value === priority);
    return option?.icon || 'remove';
  }

  getPriorityClass(priority: TaskPriority): string {
    const option = this.priorityOptions.find((p) => p.value === priority);
    return option?.class || 'priority-medium';
  }

  getStatusIcon(status: TaskStatus): string {
    const option = this.statusOptions.find((s) => s.value === status);
    return option?.icon || 'radio_button_unchecked';
  }

  // Form validation helpers
  hasError(controlName: string, errorName: string): boolean {
    const control = this.taskForm.get(controlName);
    return !!(control && control.hasError(errorName) && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.taskForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.hasError('required')) return `${controlName} is required`;
    if (control.hasError('minlength')) return `${controlName} is too short`;
    if (control.hasError('maxlength')) return `${controlName} is too long`;
    if (control.hasError('email')) return 'Please enter a valid email';

    return 'Invalid input';
  }
}
