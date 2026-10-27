import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="auth-wrap">
    <div class="auth-form-side">
      <div class="auth-card">
        <a routerLink="/" class="auth-brand"><span class="brand-icon">M</span><span>MeetSphere</span></a>
        
        <div class="form-icon">↻</div>
        <span class="eyebrow">ACCOUNT RECOVERY</span>
        <h2>{{codeSent ? 'Enter reset code' : 'Forgot password?'}}</h2>
        <p class="muted">
          {{codeSent
            ? 'Enter the 6-digit verification code sent to your phone/email and set your new password.'
            : 'Enter your email address and we will send a 6-digit verification OTP code to your phone and email.'}}
        </p>

        <!-- Step 1: Request Reset Code -->
        <form *ngIf="!codeSent" (ngSubmit)="send()" #f="ngForm" novalidate>
          <div class="mb-3">
            <label class="form-label">Email address</label>
            <input
              class="form-control form-control-lg"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              placeholder="you@example.com"
            />
            <small class="form-hint mt-1 d-block">Enter any email address to receive your verification OTP.</small>
          </div>

          <div class="alert alert-danger mt-3" *ngIf="error">{{error}}</div>
          <div class="alert alert-success mt-3" *ngIf="success">{{success}}</div>

          <button type="submit" class="btn btn-primary btn-lg w-100 auth-submit mt-2" [disabled]="busy">
            <span>{{busy ? 'Sending OTP code…' : 'Send reset code →'}}</span>
          </button>
        </form>

        <!-- Step 2: Enter OTP & New Password -->
        <form *ngIf="codeSent" (ngSubmit)="reset()" #r="ngForm" novalidate>
          <!-- Phone / Mobile OTP Banner -->
          <div class="mobile-otp-banner" *ngIf="receivedOtp">
            <div class="mobile-otp-top">
              <span class="mobile-otp-badge">📱 Mobile & Phone OTP</span>
              <small class="text-muted">Valid for 10 min</small>
            </div>
            <div class="mobile-otp-code-row">
              <span class="mobile-otp-digits">{{receivedOtp}}</span>
              <button type="button" class="mobile-otp-copy-btn" (click)="autoFillCode()">
                Auto-fill OTP ✓
              </button>
            </div>
            <p class="mobile-otp-info">
              Code dispatched to <b>{{email}}</b>. Check your phone's notification/mail or use the code above.
            </p>
          </div>

          <div class="mb-3">
            <label class="form-label">6-digit verification code</label>
            <input
              class="form-control form-control-lg"
              name="code"
              [(ngModel)]="code"
              required
              minlength="6"
              maxlength="6"
              pattern="[0-9]{6}"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="123456"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">New password</label>
            <input
              class="form-control form-control-lg"
              type="password"
              name="newPassword"
              [(ngModel)]="newPassword"
              required
              minlength="8"
              autocomplete="new-password"
              placeholder="Enter at least 8 characters"
            />
            <small class="form-hint">Choose a strong password with at least 8 characters.</small>
          </div>

          <div class="alert alert-danger mt-3" *ngIf="error">{{error}}</div>
          <div class="alert alert-success mt-3" *ngIf="success">{{success}}</div>

          <button type="submit" class="btn btn-primary btn-lg w-100 auth-submit mt-2" [disabled]="busy">
            <span>{{busy ? 'Updating password…' : 'Save new password & sign in →'}}</span>
          </button>

          <div class="d-flex justify-content-between align-items-center gap-3 mt-3">
            <button type="button" class="btn btn-link p-0 text-decoration-none" [disabled]="busy" (click)="editEmail()">
              ← Change email
            </button>
            <button type="button" class="btn btn-link p-0 text-decoration-none" [disabled]="busy" (click)="send()">
              Resend code ↻
            </button>
          </div>
        </form>

        <!-- Post-reset action links -->
        <div class="mt-4 pt-3 border-top" *ngIf="resetComplete">
          <div class="d-grid gap-2">
            <a routerLink="/login" class="btn btn-primary">Sign in as User →</a>
            <a routerLink="/admin/login" class="btn btn-outline-secondary">Sign in as Admin →</a>
          </div>
        </div>

        <div class="auth-switch mt-4">
          Remember your password?
          <a routerLink="/login">User sign in</a> · <a routerLink="/admin/login">Admin sign in</a>
        </div>
        <a class="back-home" routerLink="/">← Back to home</a>
      </div>
    </div>

    <aside class="auth-visual">
      <div class="visual-orb orb-a"></div><div class="visual-orb orb-b"></div>
      <div class="visual-top">
        <a routerLink="/" class="auth-brand"><span class="brand-icon">M</span> MeetSphere</a>
        <span class="secure-pill">PRIVATE & SECURE</span>
      </div>
      <div class="visual-copy">
        <span class="eyebrow">ACCOUNT SECURITY</span>
        <h1>Back to better conversations.</h1>
        <p>Recover your account securely with a time-limited 6-digit verification code sent to your phone & email.</p>
        <div class="visual-grid">
          <div><b>01</b><span>Enter email</span></div>
          <div><b>02</b><span>Verify OTP</span></div>
          <div><b>03</b><span>Instant login</span></div>
        </div>
      </div>
      <div class="visual-bottom">MEETSPHERE <span>·</span> SIMPLE · SECURE · CONNECTED</div>
    </aside>
  </div>`
})
export class ForgotPasswordComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  email = '';
  code = '';
  newPassword = '';
  receivedOtp = '';
  codeSent = false;
  resetComplete = false;
  accountRole = 'user';
  busy = false;
  error = '';
  success = '';

  send() {
    this.error = '';
    this.success = '';
    const cleanEmail = (this.email || '').trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes('@')) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    this.busy = true;
    this.api.forgotPassword(cleanEmail).subscribe({
      next: (r: any) => {
        this.busy = false;
        this.codeSent = true;
        this.accountRole = r?.role || 'user';
        this.receivedOtp = r?.otp || '';
        
        // Auto-fill the code so the user can easily proceed
        if (r?.otp) {
          this.code = r.otp;
        }

        this.success = r?.message || 'Verification code sent to your phone/email!';
      },
      error: (e: any) => {
        this.busy = false;
        this.error = e?.error?.message || 'Could not send reset code. Please try again.';
      }
    });
  }

  autoFillCode() {
    if (this.receivedOtp) {
      this.code = this.receivedOtp;
    }
  }

  editEmail() {
    this.codeSent = false;
    this.code = '';
    this.newPassword = '';
    this.receivedOtp = '';
    this.error = '';
    this.success = '';
    this.resetComplete = false;
  }

  reset() {
    this.error = '';
    this.success = '';
    const cleanEmail = (this.email || '').trim().toLowerCase();
    const cleanCode = (this.code || '').trim();
    const cleanPassword = this.newPassword || '';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      this.error = 'Please enter a valid email address.';
      return;
    }
    if (!cleanCode || cleanCode.length !== 6) {
      this.error = 'Please enter the 6-digit verification code.';
      return;
    }
    if (!cleanPassword || cleanPassword.length < 8) {
      this.error = 'New password must be at least 8 characters long.';
      return;
    }

    this.busy = true;
    this.api.resetPassword({
      email: cleanEmail,
      code: cleanCode,
      newPassword: cleanPassword
    }).subscribe({
      next: (r: any) => {
        this.busy = false;
        this.resetComplete = true;
        this.success = r?.message || 'Password reset successful! You can now sign in with your new password.';
        const targetUrl = (r?.role === 'admin' || this.accountRole === 'admin') ? '/admin/login' : '/login';
        setTimeout(() => this.router.navigateByUrl(targetUrl), 1600);
      },
      error: (e: any) => {
        this.busy = false;
        this.error = e?.error?.message || 'Could not reset password. Please verify the code and try again.';
      }
    });
  }
}
