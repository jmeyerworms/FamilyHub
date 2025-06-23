import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import {
  TaskService as ApiTaskService,
  Task,
} from '../../services/api-task.service';
import { FamilyService } from '../../services/family.service';

interface CalendarDay {
  date: Date;
  number: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

interface WeekDay {
  date: Date;
  weekday: string;
  number: number;
  isToday: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  durationInMinutes: number;
  category: 'family' | 'work' | 'personal' | 'health' | 'education' | 'other';
  description?: string;
  location?: string;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    NgFor,
    NgIf,
    DatePipe,
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  viewMode: 'month' | 'week' | 'day' = 'month';
  currentViewDate: Date = new Date();
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  weekDaysMobile: string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  hoursInDay: string[] = [];
  daysInMonth: CalendarDay[] = [];
  daysInWeek: WeekDay[] = [];
  currentDateLabel: string = '';
  events: CalendarEvent[] = [];

  constructor(
    private apiTaskService: ApiTaskService,
    private familyService: FamilyService
  ) {}

  ngOnInit(): void {
    this.generateHoursInDay();
    this.loadEvents();
    this.refreshView();
  }

  private loadEvents(): void {
    this.familyService.getCurrentFamily().subscribe({
      next: (family) => {
        if (family?.id) {
          this.apiTaskService.getTasks(family.id).subscribe({
            next: (tasks) => {
              this.events = this.convertTasksToCalendarEvents(tasks);
              this.refreshView();
            },
            error: (error) => {
              console.error('Error loading tasks for calendar:', error);
            },
          });
        }
      },
      error: (error) => {
        console.error('Error loading family for calendar:', error);
      },
    });
  }

  private convertTasksToCalendarEvents(tasks: Task[]): CalendarEvent[] {
    return tasks
      .filter((task) => task.dueDate)
      .map((task) => {
        const startTime = new Date(task.dueDate!);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

        return {
          id: task.id.toString(),
          title: task.title,
          startTime,
          endTime,
          durationInMinutes: 60,
          category: this.getTaskCategory(task.tags || []),
          description: task.description,
          location: task.location,
        };
      });
  }

  private getTaskCategory(
    tags: string[]
  ): 'family' | 'work' | 'personal' | 'health' | 'education' | 'other' {
    if (tags.includes('family')) return 'family';
    if (tags.includes('work')) return 'work';
    if (tags.includes('personal') || tags.includes('fitness'))
      return 'personal';
    if (tags.includes('health') || tags.includes('appointment'))
      return 'health';
    if (tags.includes('education') || tags.includes('school'))
      return 'education';
    return 'other';
  }

  setViewMode(mode: 'month' | 'week' | 'day'): void {
    this.viewMode = mode;
    this.refreshView();
  }

  navigatePrevious(): void {
    if (this.viewMode === 'month') {
      this.currentViewDate = new Date(
        this.currentViewDate.getFullYear(),
        this.currentViewDate.getMonth() - 1,
        1
      );
    } else if (this.viewMode === 'week') {
      this.currentViewDate = new Date(
        this.currentViewDate.getTime() - 7 * 24 * 60 * 60 * 1000
      );
    } else {
      this.currentViewDate = new Date(
        this.currentViewDate.getTime() - 24 * 60 * 60 * 1000
      );
    }
    this.refreshView();
  }

  navigateNext(): void {
    if (this.viewMode === 'month') {
      this.currentViewDate = new Date(
        this.currentViewDate.getFullYear(),
        this.currentViewDate.getMonth() + 1,
        1
      );
    } else if (this.viewMode === 'week') {
      this.currentViewDate = new Date(
        this.currentViewDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );
    } else {
      this.currentViewDate = new Date(
        this.currentViewDate.getTime() + 24 * 60 * 60 * 1000
      );
    }
    this.refreshView();
  }

  goToToday(): void {
    this.currentViewDate = new Date();
    this.refreshView();
  }

  refreshView(): void {
    if (this.viewMode === 'month') {
      this.generateMonthView();
      this.currentDateLabel = this.formatMonthYear(this.currentViewDate);
    } else if (this.viewMode === 'week') {
      this.generateWeekView();
      this.currentDateLabel = this.formatWeekRange(this.currentViewDate);
    } else {
      this.currentDateLabel = this.formatDate(this.currentViewDate);
    }
  }

  generateMonthView(): void {
    const year = this.currentViewDate.getFullYear();
    const month = this.currentViewDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week the first day falls on (0-6, where 0 is Sunday)
    const firstDayOfWeek = firstDay.getDay();

    const daysInMonth = lastDay.getDate();

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek;

    // Calculate total days to show (42 = 6 weeks * 7 days)
    const totalDaysToShow = 42;

    // Calculate days from next month to show
    const daysFromNextMonth = totalDaysToShow - daysInMonth - daysFromPrevMonth;

    // Get today's date for highlighting
    const today = new Date();

    this.daysInMonth = [];

    // Add days from previous month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthLastDay = new Date(
      prevMonthYear,
      prevMonth + 1,
      0
    ).getDate();

    for (
      let i = prevMonthLastDay - daysFromPrevMonth + 1;
      i <= prevMonthLastDay;
      i++
    ) {
      const date = new Date(prevMonthYear, prevMonth, i);
      this.daysInMonth.push({
        date,
        number: i,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, today),
        events: this.getEventsForDay(date),
      });
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      this.daysInMonth.push({
        date,
        number: i,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, today),
        events: this.getEventsForDay(date),
      });
    }

    // Add days from next month
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;

    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(nextMonthYear, nextMonth, i);
      this.daysInMonth.push({
        date,
        number: i,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, today),
        events: this.getEventsForDay(date),
      });
    }
  }

  generateWeekView(): void {
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(this.currentViewDate);
    const dayOfWeek = this.currentViewDate.getDay();
    startOfWeek.setDate(this.currentViewDate.getDate() - dayOfWeek);

    this.daysInWeek = [];
    const today = new Date();

    // Generate 7 days for the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      this.daysInWeek.push({
        date,
        weekday: this.weekDays[i],
        number: date.getDate(),
        isToday: this.isSameDay(date, today),
      });
    }
  }

  generateHoursInDay(): void {
    this.hoursInDay = [];
    for (let i = 0; i < 24; i++) {
      this.hoursInDay.push(
        i === 0
          ? '12 AM'
          : i < 12
          ? `${i} AM`
          : i === 12
          ? '12 PM'
          : `${i - 12} PM`
      );
    }
  }

  getEventsForDay(date: Date): CalendarEvent[] {
    return this.events.filter((event) => this.isSameDay(event.startTime, date));
  }

  getEventsForHour(hour: string): CalendarEvent[] {
    const hourNumber = this.parseHour(hour);

    return this.events.filter((event) => {
      const eventHour = event.startTime.getHours();
      const isSameDay = this.isSameDay(event.startTime, this.currentViewDate);

      // Debug logging
      console.log(`Checking event "${event.title}" for hour ${hour}:`, {
        eventHour,
        hourNumber,
        isSameDay,
        eventDate: event.startTime.toDateString(),
        currentViewDate: this.currentViewDate.toDateString(),
      });

      return isSameDay && eventHour === hourNumber;
    });
  }

  getEventsForHourAndDay(hour: string, day: WeekDay): CalendarEvent[] {
    const hourNumber = this.parseHour(hour);

    return this.events.filter((event) => {
      const eventHour = event.startTime.getHours();
      const isSameDay = this.isSameDay(event.startTime, day.date);

      // Debug logging
      console.log(
        `Week view - Checking event "${event.title}" for ${day.weekday} ${hour}:`,
        {
          eventHour,
          hourNumber,
          isSameDay,
          eventDate: event.startTime.toDateString(),
          dayDate: day.date.toDateString(),
        }
      );

      return isSameDay && eventHour === hourNumber;
    });
  }

  parseHour(hourStr: string): number {
    const isAM = hourStr.includes('AM');
    let hour = parseInt(hourStr);

    if (hourStr.includes('12 AM')) {
      return 0;
    } else if (hourStr.includes('12 PM')) {
      return 12;
    } else if (isAM) {
      return hour;
    } else {
      return hour + 12;
    }
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  formatMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  formatWeekRange(date: Date): string {
    const startOfWeek = new Date(date);
    const dayOfWeek = date.getDay();
    startOfWeek.setDate(date.getDate() - dayOfWeek);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startMonth = startOfWeek.toLocaleDateString('en-US', {
      month: 'short',
    });
    const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });

    const startDay = startOfWeek.getDate();
    const endDay = endOfWeek.getDate();

    const year = endOfWeek.getFullYear();

    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  openNewEventDialog(): void {
    console.log('Opening new event dialog...');
    // Here you would normally open a dialog for creating new events
    // For now, just log to the console
    alert('Creating a new event feature will be implemented soon!');
  }

  isMobileView(): boolean {
    return window.innerWidth <= 480;
  }

  getWeekDays(): string[] {
    return this.isMobileView() ? this.weekDaysMobile : this.weekDays;
  }

  getMaxEventsForCell(): number {
    const width = window.innerWidth;

    if (width <= 320) {
      return 1; // Very small screens - only 1 event
    } else if (width <= 480) {
      return 2; // Mobile - max 2 events
    } else if (width <= 768) {
      return 3; // Tablet - max 3 events
    } else {
      return 4; // Desktop - max 4 events
    }
  }

  selectDay(date: Date): void {
    this.currentViewDate = new Date(date);
    this.setViewMode('day');
  }

  selectDayInWeekView(date: Date): void {
    console.log('Selecting day in week view:', date.toDateString());
    this.currentViewDate = new Date(date);
    // Force refresh of the view to update event display
    this.refreshView();
  }
}
