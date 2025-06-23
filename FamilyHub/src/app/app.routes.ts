import { Routes } from '@angular/router';
import { AppShellComponent } from './features/app-shell/app-shell.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar.component').then(
            (m) => m.CalendarComponent
          ),
      },
      {
        path: 'photos',
        loadComponent: () =>
          import('./features/photos/photos.component').then(
            (m) => m.PhotosComponent
          ),
      },
      {
        path: 'tasks',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/tasks/tasks.component').then(
                (m) => m.TasksComponent
              ),
          },
          {
            path: 'today-task-list',
            loadComponent: () =>
              import(
                './features/tasks/current-tasks/current-tasks.component'
              ).then((m) => m.CurrentTasksComponent),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./features/tasks/task-form/task-form.component').then(
                (m) => m.TaskFormComponent
              ),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./features/tasks/task-form/task-form.component').then(
                (m) => m.TaskFormComponent
              ),
          },
          {
            path: 'details/:id',
            loadComponent: () =>
              import(
                './features/tasks/task-details/task-details.component'
              ).then((m) => m.TaskDetailsComponent),
          },
        ],
      },
      {
        path: 'family-members',
        loadComponent: () =>
          import(
            './features/family/family-members/family-members.component'
          ).then((m) => m.FamilyMembersComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
    ],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  { path: '**', redirectTo: 'welcome' },
];
