import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
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
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
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
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  isSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const { email } = this.forgotPasswordForm.value;

      this.authService.forgotPassword(email).subscribe({
        next: () => {
          this.isLoading = false;
          this.isSubmitted = true;
          this.snackBar.open(
            'Password reset instructions have been sent to your email',
            'Close',
            {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            }
          );
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('An error occurred. Please try again.', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  resendEmail(): void {
    this.isSubmitted = false;
    this.onSubmit();
  }
}
