import { FamilyMember } from './FamilyMember';
import { TaskPriority } from './TaskPriority';
import { TaskStatus } from './TaskStatus';

export class Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: FamilyMember[];
  dueDate?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrencePattern?: string;
  location?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(taskData: Partial<Task> = {}) {
    this.id = taskData.id || crypto.randomUUID();
    this.title = taskData.title || '';
    this.description = taskData.description;
    this.assignedTo = taskData.assignedTo || [];
    this.dueDate = taskData.dueDate;
    this.priority = taskData.priority || TaskPriority.Medium;
    this.status = taskData.status || TaskStatus.Todo;
    this.recurrence = taskData.recurrence;
    this.recurrencePattern = taskData.recurrencePattern;
    this.location = taskData.location;
    this.tags = taskData.tags || [];
    this.createdAt = taskData.createdAt || new Date();
    this.updatedAt = taskData.updatedAt || new Date();
  }

  assignMember(member: FamilyMember): void {
    if (!this.assignedTo) {
      this.assignedTo = [];
    }
    if (!this.assignedTo.find((m) => m.id === member.id)) {
      this.assignedTo.push(member);
      this.updatedAt = new Date();
    }
  }

  removeMember(memberId: string): void {
    if (this.assignedTo) {
      this.assignedTo = this.assignedTo.filter((m) => m.id !== memberId);
      this.updatedAt = new Date();
    }
  }

  updateStatus(status: TaskStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  isOverdue(): boolean {
    if (!this.dueDate) return false;
    return this.dueDate < new Date() && this.status !== TaskStatus.Completed;
  }

  addTag(tag: string): void {
    if (!this.tags) {
      this.tags = [];
    }
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    if (this.tags) {
      this.tags = this.tags.filter((t) => t !== tag);
      this.updatedAt = new Date();
    }
  }
}
