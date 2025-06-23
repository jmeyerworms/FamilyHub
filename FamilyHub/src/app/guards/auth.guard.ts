import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { LoginModalService } from '../services/login-modal.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private loginModalService: LoginModalService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map((isAuthenticated) => {
        if (isAuthenticated) {
          return true;
        }

        // Store the attempted URL for redirecting after login
        const redirectUrl = state.url;
        sessionStorage.setItem('redirectUrl', redirectUrl);

        console.log(
          `AuthGuard: User not authenticated. Redirecting to login modal for URL: ${redirectUrl}`
        );
        // Open login modal instead of redirecting
        this.loginModalService.openLoginModal();

        // Return false to prevent navigation
        return false;
      })
    );
  }
}
