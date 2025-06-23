import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
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
export class SettingsComponent {
  changePasswordForm: FormGroup;
  showChangePassword = false;
  isLoading = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (
      newPassword &&
      confirmPassword &&
      newPassword.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onChangePassword(): void {
    if (this.changePasswordForm.valid) {
      this.isLoading = true;
      const { currentPassword, newPassword } = this.changePasswordForm.value;

      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Password changed successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
          this.cancelChangePassword();
        },
        error: (error: any) => {
          this.isLoading = false;
          this.snackBar.open(
            error.error?.message || 'Failed to change password',
            'Close',
            {
              duration: 3000,
            }
          );
        },
      });
    }
  }

  cancelChangePassword(): void {
    this.showChangePassword = false;
    this.changePasswordForm.reset();
    this.hideCurrentPassword = true;
    this.hideNewPassword = true;
    this.hideConfirmPassword = true;
  }
}
