import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Family {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  ownerName: string;
  createdAt: string;
  members: FamilyMember[];
}

export interface FamilyMember {
  id: number;
  name: string;
  avatar?: string;
  isVirtual: boolean;
  role: string;
  joinedAt: string;
  userId?: number;
}

export interface CreateFamilyRequest {
  name: string;
  description?: string;
}

export interface AddMemberRequest {
  name: string;
  avatar?: string;
  isVirtual: boolean;
}

export interface UpdateMemberRequest {
  name: string;
  avatar?: string;
  role: string;
}

export interface InviteMemberRequest {
  email: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private readonly apiUrl = environment.apiUrl;
  private currentFamilySubject = new BehaviorSubject<Family | null>(null);

  currentFamily$ = this.currentFamilySubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  getCurrentFamily(): Observable<Family> {
    const headers = this.authService.getAuthHeaders();

    return this.http.get<Family[]>(`${this.apiUrl}/families`, { headers }).pipe(
      map((families: Family[]) => {
        if (families && families.length > 0) {
          // Return the first family (in the future, we might want to let users select which family)
          const family = families[0];
          this.currentFamilySubject.next(family);
          return family;
        } else {
          // No families found - user needs to create one
          throw new Error('No family found. Please create a family first.');
        }
      }),
      catchError((error) => {
        console.error('Error getting family:', error);
        this.currentFamilySubject.next(null);
        return throwError(() => error);
      })
    );
  }

  createFamily(familyData: CreateFamilyRequest): Observable<Family> {
    const headers = this.authService.getAuthHeaders();

    return this.http
      .post<Family>(`${this.apiUrl}/families`, familyData, { headers })
      .pipe(
        tap((family) => {
          this.currentFamilySubject.next(family);
        }),
        catchError((error) => {
          console.error('Error creating family:', error);
          return throwError(() => error);
        })
      );
  }

  addMember(
    familyId: number,
    memberData: AddMemberRequest
  ): Observable<FamilyMember> {
    const headers = this.authService.getAuthHeaders();

    return this.http
      .post<FamilyMember>(
        `${this.apiUrl}/families/${familyId}/members`,
        memberData,
        { headers }
      )
      .pipe(
        tap(() => {
          // Refresh family data to get updated members list
          this.getCurrentFamily().subscribe();
        }),
        catchError((error) => {
          console.error('Error adding member:', error);
          return throwError(() => error);
        })
      );
  }

  inviteMember(
    familyId: number,
    inviteData: InviteMemberRequest
  ): Observable<any> {
    const headers = this.authService.getAuthHeaders();

    return this.http
      .post(`${this.apiUrl}/families/${familyId}/invite`, inviteData, {
        headers,
      })
      .pipe(
        catchError((error) => {
          console.error('Error inviting member:', error);
          return throwError(() => error);
        })
      );
  }

  updateMember(
    familyId: number,
    memberId: number,
    memberData: UpdateMemberRequest
  ): Observable<FamilyMember> {
    const headers = this.authService.getAuthHeaders();

    return this.http
      .put<FamilyMember>(
        `${this.apiUrl}/families/${familyId}/members/${memberId}`,
        memberData,
        { headers }
      )
      .pipe(
        tap(() => {
          // Refresh family data to get updated members list
          this.getCurrentFamily().subscribe();
        }),
        catchError((error) => {
          console.error('Error updating member:', error);
          return throwError(() => error);
        })
      );
  }

  removeMember(familyId: number, memberId: number): Observable<void> {
    const headers = this.authService.getAuthHeaders();

    return this.http
      .delete<void>(`${this.apiUrl}/families/${familyId}/members/${memberId}`, {
        headers,
      })
      .pipe(
        tap(() => {
          // Refresh family data to get updated members list
          this.getCurrentFamily().subscribe();
        }),
        catchError((error) => {
          console.error('Error removing member:', error);
          return throwError(() => error);
        })
      );
  }

  getUserFamilies(): Observable<Family[]> {
    const headers = this.authService.getAuthHeaders();

    return this.http.get<Family[]>(`${this.apiUrl}/families`, { headers }).pipe(
      catchError((error) => {
        console.error('Error getting families:', error);
        return throwError(() => error);
      })
    );
  }
}
