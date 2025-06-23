import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export type ModalType = 'login' | 'register' | null;

@Injectable({
  providedIn: 'root',
})
export class LoginModalService {
  private modalStateSubject = new BehaviorSubject<ModalType>(null);
  modalState$: Observable<ModalType> = this.modalStateSubject.asObservable();

  // Keep backward compatibility
  private loginModalOpenSubject = new BehaviorSubject<boolean>(false);
  isLoginModalOpen$: Observable<boolean> =
    this.loginModalOpenSubject.asObservable();

  constructor(private router: Router) {
    // Close modal on navigation
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeModal();
      });

    // Update backward compatibility subject
    this.modalState$.subscribe((state) => {
      this.loginModalOpenSubject.next(state === 'login');
    });
  }

  openLoginModal(): void {
    this.modalStateSubject.next('login');
  }

  openRegisterModal(): void {
    this.modalStateSubject.next('register');
  }

  closeModal(): void {
    this.modalStateSubject.next(null);
  }

  // Keep backward compatibility
  closeLoginModal(): void {
    this.closeModal();
  }
}
