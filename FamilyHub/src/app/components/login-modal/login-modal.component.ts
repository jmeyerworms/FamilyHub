import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LoginModalService } from '../../services/login-modal.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
})
export class LoginModalComponent {
  loginForm: FormGroup;
  hide = true;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private loginModalService: LoginModalService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open(`Welcome back, ${response.user.name}!`, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
          this.closeModal();

          // Redirect to stored URL or default to home
          const redirectUrl = sessionStorage.getItem('redirectUrl') || '/home';
          sessionStorage.removeItem('redirectUrl');
          this.router.navigate([redirectUrl]);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Invalid email or password. Please try again.';
          this.snackBar.open('Login failed', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  clearError(): void {
    this.errorMessage = '';
  }

  closeModal(): void {
    this.loginModalService.closeLoginModal();
    // Don't automatically navigate to home when closing modal
    // Let the auth guard handle navigation
  }
  showRegisterModal(): void {
    this.loginModalService.openRegisterModal();
  }

  showForgotPassword(): void {
    this.closeModal();
    this.router.navigate(['/forgot-password']);
  }
}
