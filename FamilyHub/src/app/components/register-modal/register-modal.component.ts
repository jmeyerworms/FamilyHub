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
  selector: 'app-register-modal',
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.scss'],
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
export class RegisterModalComponent {
  registerForm: FormGroup;
  hide = true;
  hideConfirm = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private loginModalService: LoginModalService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (password && confirmPassword) {
      return password.value === confirmPassword.value
        ? null
        : { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formData = this.registerForm.value;
    this.authService
      .register(formData.email, formData.password, formData.name)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open(
            'Registration successful! Please sign in.',
            'Close',
            {
              duration: 4000,
            }
          );
          this.showLoginModal();
        },
        error: (error) => {
          this.isLoading = false;
          let errorMessage = 'Registration failed. Please try again.';

          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 4000,
          });
        },
      });
  }

  closeModal(): void {
    this.loginModalService.closeModal();
  }

  showLoginModal(): void {
    this.loginModalService.openLoginModal();
  }
}
