import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    avatar?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<any>(null);

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize auth state only if we're in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.isAuthenticatedSubject.next(this.hasStoredToken());
      this.currentUserSubject.next(this.getCurrentUser());
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const loginData: LoginRequest = { email, password };

    console.log('url', this.apiUrl);

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData)
      .pipe(
        tap((response) => {
          this.setAuthData(response);
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(
    email: string,
    password: string,
    name: string
  ): Observable<AuthResponse> {
    const registerData: RegisterRequest = { email, password, name };

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData)
      .pipe(
        tap((response) => {
          this.setAuthData(response);
        }),
        catchError((error) => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    }
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/auth/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/auth/reset-password`, {
        email,
        token,
        newPassword,
      })
      .pipe(catchError(this.handleError));
  }

  changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .post(
        `${this.apiUrl}/auth/change-password`,
        {
          currentPassword,
          newPassword,
        },
        { headers }
      )
      .pipe(catchError(this.handleError));
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  getCurrentUser(): any {
    if (isPlatformBrowser(this.platformId)) {
      const userJson = localStorage.getItem('current_user');
      return userJson ? JSON.parse(userJson) : null;
    }
    return null;
  }

  hasStoredToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('auth_token');
    }
    return false;
  }
  private setAuthData(response: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('current_user', JSON.stringify(response.user));
    }
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(response.user);
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Unknown error!';
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
