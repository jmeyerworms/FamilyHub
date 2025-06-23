import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  hide = true;
  hideConfirm = true;
  token: string = '';
  email: string = '';
  isTokenValid = false;
  isSuccess = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';

      if (!this.token || !this.email) {
        this.snackBar.open('Invalid reset link', 'Close', { duration: 3000 });
        this.router.navigate(['/forgot-password']);
        return;
      }

      this.isTokenValid = true;
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && this.isTokenValid) {
      this.isLoading = true;
      const { newPassword } = this.resetPasswordForm.value;

      this.authService
        .resetPassword(this.email, this.token, newPassword)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.isSuccess = true;
            this.snackBar.open(
              'Password has been reset successfully',
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
              }
            );
          },
          error: (error: any) => {
            this.isLoading = false;
            this.snackBar.open(
              'Failed to reset password. The link may be expired.',
              'Close',
              {
                duration: 3000,
              }
            );
          },
        });
    }
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
