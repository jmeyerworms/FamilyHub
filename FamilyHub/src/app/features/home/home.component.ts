import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Observable, map, of } from 'rxjs';
import {
  TaskService as ApiTaskService,
  Task,
} from '../../services/api-task.service';
import { FamilyService } from '../../services/family.service';

interface Event {
  id: number;
  title: string;
  date: Date;
  type: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  upcomingEvents$: Observable<Event[]> = of([]);

  constructor(
    private apiTaskService: ApiTaskService,
    private familyService: FamilyService
  ) {}

  ngOnInit(): void {
    this.loadUpcomingEvents();
  }

  private loadUpcomingEvents(): void {
    this.upcomingEvents$ = this.familyService.getCurrentFamily().pipe(
      map((family) => {
        if (family?.id) {
          this.apiTaskService.getTasks(family.id).subscribe((tasks) => {
            const events = this.convertTasksToEvents(tasks);
            this.upcomingEvents$ = of(events);
          });
        }
        return [];
      })
    );
  }

  private convertTasksToEvents(tasks: Task[]): Event[] {
    const now = new Date();
    return tasks
      .filter((task) => task.dueDate && new Date(task.dueDate) > now)
      .slice(0, 5) // Show only next 5 upcoming events
      .map((task) => ({
        id: task.id,
        title: task.title,
        date: new Date(task.dueDate!),
        type: this.getTaskType(task.tags || []),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private getTaskType(tags: string[]): string {
    if (tags.includes('family')) return 'family';
    if (tags.includes('health') || tags.includes('appointment'))
      return 'health';
    if (tags.includes('work')) return 'work';
    if (tags.includes('education') || tags.includes('school'))
      return 'education';
    return 'other';
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'family':
        return 'family_restroom';
      case 'health':
        return 'medical_services';
      case 'education':
        return 'school';
      case 'work':
        return 'work';
      default:
        return 'event';
    }
  }
}
