import { Component, inject } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  Router
} from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { SessionService } from './services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink
  ],
  template: `
    @if (showChrome) {

      <nav class="navbar navbar-expand-lg topbar">
        <div class="container">

          <a class="navbar-brand brand" routerLink="/">
            <span class="brand-icon">M</span>
            MeetSphere
          </a>

          <button
            class="navbar-toggler"
            type="button"
            aria-label="Toggle navigation"
            [attr.aria-expanded]="navOpen"
            (click)="navOpen = !navOpen">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div
            class="navbar-collapse"
            id="navMain"
            [class.show]="navOpen">

            <div class="navbar-nav ms-auto align-items-lg-center gap-lg-2 main-nav-links">
              <a class="nav-link cursor-pointer" (click)="scrollToSection('home', $event)">Home</a>
              <a class="nav-link cursor-pointer" (click)="scrollToSection('features', $event)">Features</a>
              <a class="nav-link" [routerLink]="session.loggedIn ? '/discover' : '/login'" (click)="navOpen = false">Discover</a>
              <a class="nav-link cursor-pointer" (click)="scrollToSection('how-it-works', $event)">How it works</a>
              <a class="nav-link cursor-pointer" (click)="scrollToSection('help', $event)">Help</a>
              <a class="nav-link cursor-pointer" (click)="scrollToSection('contact', $event)">Contact</a>
              @if (session.loggedIn) {
                <a class="btn btn-primary rounded-pill px-4" [routerLink]="session.isAdmin ? '/admin' : '/dashboard'">
                  {{ session.isAdmin ? '👑 Admin Panel' : 'My Workspace' }}
                </a>
                <button class="btn btn-outline-light rounded-pill px-3" (click)="session.logout()">Log out</button>
              } @else {
                <a class="nav-link text-white-50" routerLink="/admin/login" (click)="navOpen = false">👑 Admin</a>
                <a class="btn btn-primary rounded-pill px-4" routerLink="/register">New Account</a>
                <a class="btn btn-light rounded-pill px-4" routerLink="/login">Login</a>
              }
            </div>
          </div>
        </div>
      </nav>
}
    <router-outlet></router-outlet>
    @if (showChrome) {

      <!-- ==============================
           MEETSPHERE PROFESSIONAL FOOTER
           ============================== -->
      <footer class="ms-footer">
        <div class="container">
          <div class="ms-footer-grid">
            <!-- Brand Column -->
            <div class="ms-footer-brand-col">
              <a routerLink="/" class="ms-footer-brand-link">
                <span class="ms-footer-brand-badge">M</span>
                <span class="ms-footer-brand-name">MeetSphere</span>
              </a>
              <p class="ms-footer-tagline">
                Modern video collaboration, team workspaces, and real-time connectivity built for seamless communication.
              </p>
              <div class="ms-footer-status-pill">
                <span class="ms-status-indicator"></span>
                <span>All systems operational</span>
              </div>
            </div>

            <!-- Product Links -->
            <div class="ms-footer-nav-col">
              <h4 class="ms-footer-heading">Product</h4>
              <ul class="ms-footer-list">
                <li><a class="cursor-pointer" (click)="scrollToSection('features', $event)">Features</a></li>
                <li><a routerLink="/discover">Discover Meetings</a></li>
                <li><a class="cursor-pointer" (click)="scrollToSection('how-it-works', $event)">How It Works</a></li>
                <li><a routerLink="/login">Workspaces</a></li>
              </ul>
            </div>

            <!-- Resources -->
            <div class="ms-footer-nav-col">
              <h4 class="ms-footer-heading">Resources</h4>
              <ul class="ms-footer-list">
                <li><a class="cursor-pointer" (click)="scrollToSection('help', $event)">Help & FAQs</a></li>
                <li><a class="cursor-pointer" (click)="scrollToSection('contact', $event)">Contact Support</a></li>
                <li><a routerLink="/login">Security & Privacy</a></li>
                <li><a routerLink="/login">Meeting Rooms</a></li>
              </ul>
            </div>

            <!-- Apps & Community -->
            <div class="ms-footer-nav-col ms-footer-apps-col">
              <h4 class="ms-footer-heading">Get Connected</h4>
              <p class="ms-footer-apps-desc">Available on Web, Mobile & Desktop</p>

              <!-- App chips -->
              <div class="ms-footer-app-badges">
                <a
                  href="https://www.apple.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ms-app-chip"
                  title="iOS & macOS">
                  <img src="https://cdn.simpleicons.org/apple/ffffff" alt="Apple" />
                  <span>App Store</span>
                </a>
                <a
                  href="https://play.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ms-app-chip"
                  title="Android App">
                  <img src="https://cdn.simpleicons.org/googleplay/34A853" alt="Google Play" />
                  <span>Google Play</span>
                </a>
                <a
                  href="https://www.google.com/chrome/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ms-app-chip"
                  title="Chrome Extension">
                  <img src="https://cdn.simpleicons.org/googlechrome/4285F4" alt="Chrome" />
                  <span>Chrome</span>
                </a>
              </div>

              <!-- Social buttons -->
              <div class="ms-footer-social-row">
                <a
                  href="https://x.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ms-social-btn"
                  title="X (Twitter)">
                  <img src="https://cdn.simpleicons.org/x/ffffff" alt="X" />
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ms-social-btn"
                  title="Instagram">
                  <img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" />
                </a>
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ms-social-btn"
                  title="Facebook">
                  <img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" />
                </a>
                <a
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ms-social-btn"
                  title="YouTube">
                  <img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" />
                </a>
              </div>
            </div>
          </div>

          <!-- Bottom bar -->
          <div class="ms-footer-bottom-bar">
            <div class="ms-footer-copy">
              © 2026 MeetSphere Inc. All rights reserved.
            </div>

            <div class="ms-footer-legal-links">
              <a href="javascript:void(0)">Privacy Policy</a>
              <span class="ms-dot-sep">•</span>
              <a href="javascript:void(0)">Terms of Service</a>
              <span class="ms-dot-sep">•</span>
              <a href="javascript:void(0)">Security</a>
              <span class="ms-dot-sep">•</span>
              <a href="javascript:void(0)">Cookies</a>
            </div>

            <div class="ms-footer-locale">
              <span class="ms-locale-icon">🌐</span>
              <span>English (US)</span>
            </div>
          </div>
        </div>
      </footer>
    }
  `
})
export class AppComponent {

  session = inject(SessionService);
  router = inject(Router);

  showChrome = true;
  navOpen = false;

  constructor() {

    this.updateChrome(this.router.url);

    this.router.events
      .pipe(
        filter(
          event => event instanceof NavigationEnd
        )
      )
      .subscribe(
        event => {

          const navigation =
            event as NavigationEnd;

          this.updateChrome(
            navigation.urlAfterRedirects
          );

        }
      );
  }

  scrollToSection(sectionId: string, event?: Event): void {
    if (event) event.preventDefault();
    this.navOpen = false;

    if (sectionId === 'home') {
      if (this.router.url === '/' || this.router.url.startsWith('/#') || this.router.url.startsWith('/?')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.router.navigate(['/']).then(() => {
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 120);
        });
      }
      return;
    }

    if (this.router.url === '/' || this.router.url.startsWith('/#') || this.router.url.startsWith('/?')) {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      this.router.navigate(['/'], { fragment: sectionId }).then(() => {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      });
    }
  }

  private updateChrome(url: string): void {

     this.showChrome =
    !/^\/(login|register|admin\/login|admin\/register|forgot-password|reset-password)(\/|$)/.test(url);

  }
}