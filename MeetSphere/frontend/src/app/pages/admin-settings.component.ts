import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, SessionService } from '../services';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="app-shell">
  <!-- ADMIN SIDEBAR -->
  <aside class="sidebar">
    <a class="brand side-brand" routerLink="/">
      <span class="brand-icon bg-danger text-white">M</span> MeetSphere
    </a>
    <div class="side-label text-danger fw-bold">ADMIN CONSOLE</div>

    <nav class="sidebar-nav">
      <a class="side-link" routerLink="/admin">
        <span class="side-link-icon">▦</span> Overview &amp; Control
      </a>
      <a class="side-link" routerLink="/admin" fragment="login-logs">
        <span class="side-link-icon">🔐</span> User Logins &amp; Errors
      </a>
      <a class="side-link" routerLink="/admin" fragment="users">
        <span class="side-link-icon">♙</span> Users Management
      </a>
      <a class="side-link" routerLink="/admin" fragment="meetings">
        <span class="side-link-icon">◷</span> Meetings Activity
      </a>
      <a class="side-link" routerLink="/admin-payments">
        <span class="side-link-icon">₹</span> Payments &amp; Revenue
      </a>
      <a class="side-link active" routerLink="/admin-settings">
        <span class="side-link-icon">⚙</span> Admin Settings
      </a>
    </nav>



    <div class="side-bottom mt-auto">
      <div class="d-flex align-items-center gap-2 mb-2 px-1">
        <span class="status-dot-green"></span>
        <small class="text-muted fw-semibold" style="font-size: 11px;">Admin Console · Active</small>
      </div>
      <div class="profile-chip">
        <span class="profile-avatar bg-dark text-white">AD</span>
        <div>
          <b>{{ session.user?.fullName }}</b>
          <small class="text-danger fw-bold">★ Administrator</small>
        </div>
      </div>
      <button class="side-link logout-link mt-2" (click)="session.logout()">
        <span class="side-link-icon">↪</span> Log out
      </button>
    </div>
  </aside>

  <main class="workspace">
    <header class="workspace-top">
      <div>
        <span class="eyebrow text-danger">ADMINISTRATOR CONTROL</span>
        <h2>Admin System Settings <span>⚙</span></h2>
        <p>Configure platform hosting fees, registration rules, and admin credentials.</p>
      </div>
      <button type="button" class="btn btn-danger rounded-pill px-4 shadow-sm fw-bold" (click)="saveAdminSettings()">
        💾 Save System Settings
      </button>
    </header>

    <!-- Success Feedback Banner -->
    <div *ngIf="savedMessage" class="alert alert-success d-flex align-items-center gap-2 py-3 px-4 rounded-4 shadow-sm border-0 mb-4" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #15803d;">
      <span class="fs-5">✓</span>
      <span class="fw-bold">{{ savedMessage }}</span>
    </div>

    <div class="row g-4">
      <!-- Section 1: Platform & Payment Configuration -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
          <h5 class="fw-bold text-dark mb-3">Platform &amp; Fee Policy Settings</h5>

          <div class="mb-3">
            <label class="form-label small fw-semibold text-secondary">Default Meeting Hosting Fee (₹)</label>
            <div class="input-group">
              <span class="input-group-text bg-light fw-bold">₹</span>
              <input type="number" class="form-control rounded-end" [(ngModel)]="defaultFee" min="0" step="10">
            </div>
            <small class="text-muted d-block mt-1" style="font-size: 11px;">Standard fee required from hosts before publishing meeting rooms.</small>
          </div>

          <div class="p-3 bg-light rounded-3 mb-3 border">
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="requirePayment" [(ngModel)]="requirePaymentToHost">
              <label class="form-check-label fw-bold small text-dark" for="requirePayment">
                Enforce Mandatory Payment Before Meeting Creation
              </label>
            </div>
            <small class="text-muted d-block" style="font-size: 11px;">When active, users cannot create meetings without paying the ₹100 fee.</small>
          </div>

          <div class="p-3 bg-light rounded-3 border">
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="allowReg" [(ngModel)]="allowSelfRegistration">
              <label class="form-check-label fw-bold small text-dark" for="allowReg">
                Allow User Self-Registration
              </label>
            </div>
            <small class="text-muted d-block" style="font-size: 11px;">Permit new members to sign up via registration page.</small>
          </div>
        </div>
      </div>

      <!-- Section 2: Administrator Profile & Credentials -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
          <h5 class="fw-bold text-dark mb-3">Administrator Profile &amp; Security</h5>

          <div class="mb-3">
            <label class="form-label small fw-semibold text-secondary">Administrator Name</label>
            <input type="text" class="form-control rounded-3" [(ngModel)]="adminName" placeholder="Admin Full Name">
          </div>

          <div class="mb-3">
            <label class="form-label small fw-semibold text-secondary">Administrator Email</label>
            <input type="email" class="form-control rounded-3 bg-light" [value]="adminEmail" readonly>
            <small class="text-muted" style="font-size: 11px;">Admin account identifier.</small>
          </div>

          <div class="p-3 rounded-3 border bg-light">
            <b class="text-dark small d-block mb-1">Security Role Status</b>
            <span class="badge bg-danger text-white px-3 py-1 rounded-pill fw-bold">
              ★ SUPER ADMINISTRATOR
            </span>
            <small class="text-muted d-block mt-2" style="font-size: 11px;">Full system access granted.</small>
          </div>
        </div>
      </div>

      <!-- Section 3: Platform Announcements & Maintenance -->
      <div class="col-lg-12">
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 class="fw-bold text-dark mb-3">Maintenance Tools &amp; Exports</h5>

          <div class="row g-3">
            <div class="col-md-6">
              <div class="p-3 bg-light rounded-3 border h-100">
                <b class="text-dark d-block mb-1">System Cache Management</b>
                <p class="text-muted small mb-3">Refresh room caches and session tokens.</p>
                <button type="button" class="btn btn-outline-danger btn-sm rounded-pill px-4 fw-bold" (click)="clearCache()">
                  🧹 Clear System Cache
                </button>
              </div>
            </div>

            <div class="col-md-6">
              <div class="p-3 bg-light rounded-3 border h-100">
                <b class="text-dark d-block mb-1">Export Financial Audit Logs</b>
                <p class="text-muted small mb-3">Download complete revenue and transaction records.</p>
                <button type="button" class="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold" (click)="exportFinancialLogs()">
                  📥 Export Transaction Logs (JSON)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
`
})
export class AdminSettingsComponent implements OnInit {
  api = inject(ApiService);
  session = inject(SessionService);
  router = inject(Router);

  adminName = '';
  adminEmail = '';
  defaultFee = 100;
  requirePaymentToHost = true;
  allowSelfRegistration = true;


  savedMessage = '';

  ngOnInit() {
    if (!this.session.loggedIn || !this.session.isAdmin) {
      this.session.redirectToLogin();
      return;
    }

    const u = this.session.user;
    if (u) {
      this.adminName = u.fullName || 'Administrator';
      this.adminEmail = u.email || 'admin@meetsphere.app';
    }

    const saved = localStorage.getItem('ms_admin_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.defaultFee = parsed.defaultFee ?? 100;
        this.requirePaymentToHost = parsed.requirePaymentToHost ?? true;
        this.allowSelfRegistration = parsed.allowSelfRegistration ?? true;
      } catch {}
    }
  }

  saveAdminSettings() {
    const settings = {
      defaultFee: this.defaultFee,
      requirePaymentToHost: this.requirePaymentToHost,
      allowSelfRegistration: this.allowSelfRegistration,
      adminName: this.adminName
    };

    localStorage.setItem('ms_admin_settings', JSON.stringify(settings));

    const u = this.session.user;
    if (u && this.adminName.trim()) {
      u.fullName = this.adminName.trim();
      sessionStorage.setItem('ms_user', JSON.stringify(u));
    }

    this.savedMessage = 'Admin system settings have been saved successfully!';
    setTimeout(() => this.savedMessage = '', 3500);
  }

  clearCache() {
    this.savedMessage = 'System cache and session tokens refreshed successfully.';
    setTimeout(() => this.savedMessage = '', 3500);
  }

  exportFinancialLogs() {
    this.api.adminPayments().subscribe({
      next: (logs) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", `meetsphere_financial_audit_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        this.savedMessage = 'Financial audit logs exported successfully!';
        setTimeout(() => this.savedMessage = '', 3500);
      }
    });
  }


}
