import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, SessionService } from '../services';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<!-- Admin Change Notification Banner -->
<div *ngIf="adminChangeNotice" class="position-fixed top-0 start-0 end-0 d-flex align-items-center justify-content-center gap-2 py-3 px-4 shadow-lg" style="z-index: 9999; background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; font-weight: 600; font-size: 14px;">
  <span>⚡</span>
  <span>{{ adminChangeNotice }}</span>
</div>

<div class="app-shell">
  <aside class="sidebar">
    <a class="brand side-brand" routerLink="/dashboard">
      <span class="brand-icon">M</span> MeetSphere
    </a>
    <div class="side-label">WORKSPACE</div>
    <nav class="sidebar-nav">
      <a class="side-link" routerLink="/dashboard">
        <span class="side-link-icon">▦</span> Overview
      </a>
      <a class="side-link" routerLink="/discover">
        <span class="side-link-icon">◈</span> Discover meetings
      </a>
      <a class="side-link" routerLink="/payment-history">
        <span class="side-link-icon">₹</span> Payment history
      </a>
      <a class="side-link" routerLink="/notetaker">
        <span class="side-link-icon">◩</span> Notetaker
      </a>
      <a class="side-link" routerLink="/contacts">
        <span class="side-link-icon">♧</span> Contacts
      </a>
      <a class="side-link" routerLink="/automations">
        <span class="side-link-icon">✣</span> Automations
      </a>
      <a class="side-link" routerLink="/upgrade">
        <span class="side-link-icon">⇧</span> Upgrade plan
      </a>
      <a class="side-link" routerLink="/calendar">
        <span class="side-link-icon">▣</span> Calendar
      </a>
      <a class="side-link active" routerLink="/settings">
        <span class="side-link-icon">⚙</span> Settings
      </a>
      <a class="side-link" routerLink="/">
        <span class="side-link-icon">⌂</span> Home
      </a>
    </nav>
    <div class="side-bottom">
      <div class="d-flex align-items-center gap-2 mb-2 px-1">
        <span class="status-dot-green"></span>
        <small class="text-muted fw-semibold" style="font-size: 11px;">Server Online · Payments Ready</small>
      </div>
      <div class="profile-chip">
        <span class="profile-avatar">{{ initials }}</span>
        <div class="profile-copy">
          <b>{{ session.user?.fullName }}</b>
          <small class="text-primary fw-bold">★ Active Member</small>
        </div>
      </div>
      <button class="side-link logout-link mt-1" (click)="session.logout()">↪ &nbsp; Log out</button>
    </div>
  </aside>

  <main class="workspace">
    <header class="workspace-top">
      <div>
        <span class="eyebrow">ACCOUNT PREFERENCES</span>
        <h2>User Settings <span>⚙</span></h2>
        <p>Manage your account profile, meeting preferences, and billing defaults.</p>
      </div>
      <button type="button" class="btn btn-primary rounded-pill px-4 shadow-sm fw-bold" (click)="saveSettings()">
        💾 Save Preferences
      </button>
    </header>

    <!-- Success Toast -->
    <div *ngIf="savedMessage" class="alert alert-success d-flex align-items-center gap-2 py-3 px-4 rounded-4 shadow-sm border-0 mb-4" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #15803d;">
      <span class="fs-5">✓</span>
      <span class="fw-bold">{{ savedMessage }}</span>
    </div>

    <div class="row g-4">
      <!-- Section 1: Profile Information -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
          <div class="d-flex align-items-center gap-3 mb-3 border-bottom pb-3">
            <div class="profile-avatar fs-4 fw-bold" style="width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, #635bff, #4f46e5); color: #fff; display: grid; place-items: center;">
              {{ initials }}
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-dark">{{ fullName }}</h5>
              <small class="text-muted">{{ email }}</small>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill ms-2 px-2.5">
                ★ {{ session.user?.role | uppercase }}
              </span>
            </div>
          </div>

          <h6 class="fw-bold text-dark mb-3">Profile Information</h6>
          <div class="mb-3">
            <label class="form-label small fw-semibold text-secondary">Full Name</label>
            <input type="text" class="form-control rounded-3" [(ngModel)]="fullName" placeholder="Enter your full name">
          </div>

          <div class="mb-3">
            <label class="form-label small fw-semibold text-secondary">Email Address</label>
            <input type="email" class="form-control rounded-3 bg-light" [value]="email" readonly>
            <small class="text-muted" style="font-size: 11px;">Email cannot be changed after registration.</small>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-semibold text-secondary">Default Timezone</label>
            <select class="form-select rounded-3" [(ngModel)]="timezone">
              <option>Asia/Kolkata (India Standard Time - IST)</option>
              <option>UTC (Coordinated Universal Time)</option>
              <option>US/Eastern (EST)</option>
              <option>Europe/London (GMT)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Section 2: Meeting & Video Preferences -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
          <h6 class="fw-bold text-dark mb-3">Meeting &amp; Audio/Video Defaults</h6>
          
          <div class="p-3 bg-light rounded-3 mb-3 border">
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="autoMute" [(ngModel)]="autoMuteMic">
              <label class="form-check-label fw-bold small text-dark" for="autoMute">
                Auto-Mute Microphone on Join
              </label>
            </div>
            <small class="text-muted d-block" style="font-size: 11px;">Automatically mute your mic when entering any meeting room.</small>
          </div>

          <div class="p-3 bg-light rounded-3 mb-3 border">
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="autoCamOff" [(ngModel)]="autoTurnOffCam">
              <label class="form-check-label fw-bold small text-dark" for="autoCamOff">
                Turn Off Camera on Join
              </label>
            </div>
            <small class="text-muted d-block" style="font-size: 11px;">Keep your camera off by default when joining a meeting.</small>
          </div>

          <div class="p-3 bg-light rounded-3 border">
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="hdVideo" [(ngModel)]="hdVideoEnabled">
              <label class="form-check-label fw-bold small text-dark" for="hdVideo">
                Enable HD Video Quality (720p/1080p)
              </label>
            </div>
            <small class="text-muted d-block" style="font-size: 11px;">Stream video in high definition when camera is active.</small>
          </div>
        </div>
      </div>

      <!-- Section 3: Saved Payment & Billing -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
          <h6 class="fw-bold text-dark mb-3">Saved Payment &amp; Billing Defaults</h6>

          <div class="mb-3">
            <label class="form-label small fw-semibold text-secondary">Preferred VPA (UPI ID)</label>
            <input type="text" class="form-control rounded-3" [(ngModel)]="savedUpiId" placeholder="e.g. user@okaxis">
            <small class="text-muted d-block mt-1" style="font-size: 11px;">Pre-filled during meeting creation &amp; ticket purchase checkout.</small>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-semibold text-secondary">Default Payment Method</label>
            <select class="form-select rounded-3" [(ngModel)]="preferredPaymentMethod">
              <option value="UPI">UPI / QR (GPay, PhonePe, Paytm)</option>
              <option value="CARD">Debit / Credit Card (Visa, MC, RuPay)</option>
              <option value="NETBANKING">Net Banking (HDFC, SBI, ICICI)</option>
              <option value="WALLET">Wallets (Paytm, PhonePe)</option>
            </select>
          </div>

          <div class="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between">
            <div>
              <b class="text-dark small d-block">Standard Meeting Hosting Fee</b>
              <small class="text-muted">Fixed price per room created</small>
            </div>
            <span class="fs-5 fw-bold text-primary">₹100.00</span>
          </div>
        </div>
      </div>

      <!-- Section 4: Notifications & Security -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
          <h6 class="fw-bold text-dark mb-3">Notifications &amp; Security</h6>

          <div class="p-3 bg-light rounded-3 mb-3 border">
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="emailReminders" [(ngModel)]="emailReminders">
              <label class="form-check-label fw-bold small text-dark" for="emailReminders">
                Meeting Email Reminders
              </label>
            </div>
            <small class="text-muted d-block" style="font-size: 11px;">Receive reminder emails 15 minutes before scheduled meetings.</small>
          </div>

          <div class="p-3 bg-light rounded-3 border">
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="soundNotifications" [(ngModel)]="soundNotifications">
              <label class="form-check-label fw-bold small text-dark" for="soundNotifications">
                In-Meeting Sound Notifications
              </label>
            </div>
            <small class="text-muted d-block" style="font-size: 11px;">Play a chime when participants join or send a chat message.</small>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
`
})
export class SettingsComponent implements OnInit, OnDestroy {
  api = inject(ApiService);
  session = inject(SessionService);
  router = inject(Router);

  fullName = '';
  email = '';
  timezone = 'Asia/Kolkata (India Standard Time - IST)';
  
  autoMuteMic = true;
  autoTurnOffCam = false;
  hdVideoEnabled = true;

  savedUpiId = 'demo@okaxis';
  preferredPaymentMethod = 'UPI';

  emailReminders = true;
  soundNotifications = true;


  savedMessage = '';
  adminChangeNotice = '';

  get initials() {
    return (this.fullName || 'M')
      .split(' ')
      .map((x: string) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  ngOnInit() {
    if (!this.session.loggedIn) {
      this.session.redirectToLogin();
      return;
    }

    const u = this.session.user;
    if (u) {
      this.fullName = u.fullName || '';
      this.email = u.email || '';
    }

    // Load saved local preferences if any
    const settingsKey = `ms_user_settings_${u?.id ?? 'unknown'}`;
    const saved = localStorage.getItem(settingsKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.timezone = parsed.timezone || this.timezone;
        this.autoMuteMic = parsed.autoMuteMic ?? true;
        this.autoTurnOffCam = parsed.autoTurnOffCam ?? false;
        this.hdVideoEnabled = parsed.hdVideoEnabled ?? true;
        this.savedUpiId = parsed.savedUpiId || this.savedUpiId;
        this.preferredPaymentMethod = parsed.preferredPaymentMethod || this.preferredPaymentMethod;
        this.emailReminders = parsed.emailReminders ?? true;
        this.soundNotifications = parsed.soundNotifications ?? true;
      } catch {}
    }

    // Start auto-sync: detect if admin updates this user's details
    this.session.startSync(
      (updatedUser: any) => {
        this.fullName = updatedUser.fullName || '';
        this.email = updatedUser.email || '';
        this.adminChangeNotice = `Your account details have been updated by the administrator. Please review your settings.`;
        setTimeout(() => this.adminChangeNotice = '', 8000);
      }
    );
  }

  ngOnDestroy() {
    this.session.stopSync();
  }

  saveSettings() {
    const settings = {
      fullName: this.fullName,
      timezone: this.timezone,
      autoMuteMic: this.autoMuteMic,
      autoTurnOffCam: this.autoTurnOffCam,
      hdVideoEnabled: this.hdVideoEnabled,
      savedUpiId: this.savedUpiId,
      preferredPaymentMethod: this.preferredPaymentMethod,
      emailReminders: this.emailReminders,
      soundNotifications: this.soundNotifications
    };

    const settingsUser = this.session.user;
    const settingsKey = `ms_user_settings_${settingsUser?.id ?? 'unknown'}`;
    localStorage.setItem(settingsKey, JSON.stringify(settings));

    // Update user full name in session if changed
    const u = this.session.user;
    if (u && this.fullName.trim()) {
      u.fullName = this.fullName.trim();
      sessionStorage.setItem('ms_user', JSON.stringify(u));
    }

    this.savedMessage = 'Your preferences and settings have been saved successfully!';
    setTimeout(() => this.savedMessage = '', 3500);
  }


}
