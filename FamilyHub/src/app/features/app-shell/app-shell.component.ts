import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { LoginModalComponent } from '../../components/login-modal/login-modal.component';
import { LoginModalService } from '../../services/login-modal.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    LoginModalComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  currentRoute: string = '';

  constructor(
    private router: Router,
    public loginModalService: LoginModalService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.currentRoute = event.url;
        }
      });
  }

  ngOnInit(): void {}

  isLoginRoute(): boolean {
    return this.currentRoute === '/login';
  }
}
