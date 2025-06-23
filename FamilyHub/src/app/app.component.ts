import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LoginModalComponent } from './components/login-modal/login-modal.component';
import { RegisterModalComponent } from './components/register-modal/register-modal.component';
import { AuthService } from './services/auth.service';
import { LoginModalService, ModalType } from './services/login-modal.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    LoginModalComponent,
    RegisterModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'FamilyHub';
  currentRoute: string = '';
  modalState$: Observable<ModalType>;

  constructor(
    private router: Router,
    public loginModalService: LoginModalService,
    public authService: AuthService
  ) {
    this.modalState$ = this.loginModalService.modalState$;
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.currentRoute = event.url;
        }
      });
  }

  ngOnInit(): void {
    // Check if there's a stored token on app initialization
    if (!this.authService.hasStoredToken()) {
      // Open login modal if user is not authenticated
      // You can also redirect to a specific page instead
      // this.loginModalService.openLoginModal();
    }
  }

  isLoginRoute(): boolean {
    return window.location.pathname === '/login';
  }
}
