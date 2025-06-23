import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LoginModalService } from '../../services/login-modal.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatListModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  appName = 'FamilyHub';
  isMobileMenuOpen = false;
  navItems = [
    { name: 'Home', path: '/home', icon: 'home' },
    { name: 'Family', path: '/family-members', icon: 'groups' },
    { name: 'Tasks', path: '/tasks', icon: 'check_circle' },
    { name: "Today's Tasks", path: '/tasks/today-task-list', icon: 'today' },
    { name: 'Calendar', path: '/calendar', icon: 'calendar_today' },
    { name: 'Photos', path: '/photos', icon: 'photo_library' },
  ];

  constructor(
    public authService: AuthService,
    private loginModalService: LoginModalService
  ) {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;

    // Prevent scrolling on the body when menu is open
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    if (this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
      document.body.style.overflow = '';
    }
  }

  openLoginModal(): void {
    this.loginModalService.openLoginModal();
  }

  openRegisterModal(): void {
    this.loginModalService.openRegisterModal();
  }

  logout(): void {
    this.authService.logout();
  }
}
