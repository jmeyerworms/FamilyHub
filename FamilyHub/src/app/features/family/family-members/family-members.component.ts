import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  FamilyService,
  Family,
  FamilyMember,
  UpdateMemberRequest,
} from '../../../services/family.service';
import { FamilyMemberService } from '../../../services/FamilyMemberService';

@Component({
  selector: 'app-family-members',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './family-members.component.html',
  styleUrl: './family-members.component.scss',
})
export class FamilyMembersComponent implements OnInit {
  currentFamily: Family | null = null;
  familyMembers: FamilyMember[] = [];
  memberForm: FormGroup;
  editMode = false;
  loading = true;
  showAddForm = false;

  constructor(
    private familyService: FamilyService,
    private familyMemberService: FamilyMemberService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.memberForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required, Validators.minLength(2)]],
      avatar: [''],
      isVirtual: [true], // Default to virtual member
    });
  }

  ngOnInit(): void {
    this.loadFamily();
  }

  loadFamily(): void {
    this.loading = true;
    this.familyService.getCurrentFamily().subscribe({
      next: (family) => {
        this.currentFamily = family;
        this.familyMembers = family.members;

        // Sync with FamilyMemberService
        this.familyMemberService.setMembers(
          family.members.map((member) => ({
            id: member.id.toString(),
            name: member.name,
            avatar: member.avatar,
          }))
        );

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading family:', error);
        this.loading = false;
        this.snackBar.open('Error loading family data', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.resetForm();
    }
  }
  resetForm(): void {
    this.editMode = false;
    this.memberForm.reset({
      id: '',
      name: '',
      avatar: '',
      isVirtual: true,
    });
  }
  onSubmit(): void {
    if (this.memberForm.invalid) {
      return;
    }

    const formData = this.memberForm.value;
    const memberData = {
      name: formData.name,
      avatar: formData.avatar || this.getRandomAvatarUrl(),
      isVirtual: true,
    };
    if (this.editMode) {
      // For edit mode, we need the full member object
      const member: FamilyMember = {
        id: formData.id,
        name: formData.name,
        avatar: formData.avatar || this.getRandomAvatarUrl(),
        isVirtual: true,
        role: 'Member',
        joinedAt: new Date().toISOString(),
      };
      this.updateMember(member);
    } else {
      // For add mode, we only need the basic data
      this.addMemberData(memberData);
    }
  }

  addMemberData(memberData: {
    name: string;
    avatar?: string;
    isVirtual: boolean;
  }): void {
    if (!this.currentFamily) return;

    this.familyService.addMember(this.currentFamily.id, memberData).subscribe({
      next: () => {
        this.loadFamily(); // Reload to get updated data
        this.resetForm();
        this.showAddForm = false;
        this.snackBar.open(`${memberData.name} added to the family`, 'Close', {
          duration: 3000,
        });
      },
      error: (error: any) => {
        console.error('Error adding family member:', error);
        this.snackBar.open('Error adding family member', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  updateMember(member: FamilyMember): void {
    if (!this.currentFamily) return;

    const updateData: UpdateMemberRequest = {
      name: member.name,
      avatar: member.avatar,
      role: member.role,
    };

    this.familyService
      .updateMember(this.currentFamily.id, member.id, updateData)
      .subscribe({
        next: () => {
          this.loadFamily(); // Reload to get updated data
          this.resetForm();
          this.showAddForm = false;
          this.snackBar.open(`${member.name} updated successfully`, 'Close', {
            duration: 3000,
          });
        },
        error: (error: any) => {
          console.error('Error updating family member:', error);
          this.snackBar.open('Error updating family member', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  editMember(member: FamilyMember): void {
    this.editMode = true;
    this.showAddForm = true;
    this.memberForm.setValue({
      id: member.id,
      name: member.name,
      avatar: member.avatar || '',
      isVirtual: member.isVirtual,
    });
  }
  deleteMember(member: FamilyMember): void {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${member.name} from the family?`
    );

    if (confirmDelete && this.currentFamily) {
      this.familyService
        .removeMember(this.currentFamily.id, member.id)
        .subscribe({
          next: () => {
            this.loadFamily(); // Reload to get updated data
            this.snackBar.open(
              `${member.name} removed from the family`,
              'Close',
              {
                duration: 3000,
              }
            );
          },
          error: (error: any) => {
            console.error('Error removing family member:', error);
            this.snackBar.open('Error removing family member', 'Close', {
              duration: 3000,
            });
          },
        });
    }
  }

  getRandomAvatarUrl(): string {
    // Generate a random number between 1-8 for avatar selection
    const randomIndex = Math.floor(Math.random() * 8) + 1;
    return `assets/images/avatars/avatar-${randomIndex}.png`;
  }

  generateRandomAvatar(): void {
    this.memberForm.patchValue({
      avatar: this.getRandomAvatarUrl(),
    });
  }
}
