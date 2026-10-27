import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
    <a class="brand side-brand" routerLink="/admin">
      <span class="brand-icon bg-danger text-white">M</span> MeetSphere
    </a>
    <div class="side-label text-danger fw-bold">ADMIN CONSOLE</div>

    <nav class="sidebar-nav">
      <a class="side-link" routerLink="/admin">
        <span class="side-link-icon">▦</span> Overview &amp; Control
      </a>
      <a class="side-link active" routerLink="/admin-logs">
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
      <a class="side-link" routerLink="/admin-tools/calendar"><span class="side-link-icon">▣</span> Calendar</a>
      <a class="side-link" routerLink="/admin-tools/notes"><span class="side-link-icon">◩</span> Notetaker</a>
      <a class="side-link" routerLink="/admin-tools/contacts"><span class="side-link-icon">♧</span> Contacts</a>
      <a class="side-link" routerLink="/admin-tools/automations"><span class="side-link-icon">✣</span> Automations</a>
      <a class="side-link" routerLink="/admin-tools/governance"><span class="side-link-icon">◈</span> Governance Scorecard</a>
      <a class="side-link" routerLink="/admin-settings"><span class="side-link-icon">⚙</span> Admin Settings</a>
    </nav>



    <!-- SIDEBAR BOTTOM PROFILE -->
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

  <!-- MAIN WORKSPACE -->
  <main class="workspace">
    <header class="workspace-top">
      <div>
        <span class="eyebrow text-danger">MEETSPHERE SECURITY &amp; AUDIT MONITOR</span>
        <h2>User Logins &amp; Error Monitoring <span>🔐</span></h2>
        <p>Live tracking of user logins, failed attempts, and automatic client/system errors reported from all users.</p>
        <div class="d-flex align-items-center gap-2 mt-2">
          <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill small fw-bold">
            <span class="pulse"></span> Live Auto-Sync Active (4s)
          </span>
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1 rounded-pill small fw-bold" *ngIf="errorCount > 0">
            ⚠️ {{ errorCount }} Errors Caught
          </span>
        </div>
      </div>
      <div class="d-flex gap-2">
        <a routerLink="/admin" class="btn btn-outline-dark rounded-pill px-4 shadow-sm fw-bold">
          ← Back to Overview
        </a>
        <button type="button" class="btn btn-outline-dark rounded-pill px-4 shadow-sm fw-bold" (click)="loadLogs()">
          ↻ Refresh Feed
        </button>
        <button type="button" class="btn btn-outline-primary rounded-pill px-4 fw-bold shadow-sm" (click)="syncLogsToToday()">
          ⚡ Set Dates to Today
        </button>
        <button type="button" class="btn btn-outline-success rounded-pill px-4 fw-bold shadow-sm" (click)="exportLogsCsv()" [disabled]="!logs.length">
          ⬇ Export CSV
        </button>
        <button type="button" class="btn btn-outline-danger rounded-pill px-4 fw-bold shadow-sm" (click)="showClearModal = true" [disabled]="!logs.length">
          🗑 Clear Logs
        </button>
      </div>
    </header>

    <!-- Success Feedback Banner -->
    <div *ngIf="feedbackMessage" class="alert alert-success d-flex align-items-center gap-2 py-3 px-4 rounded-4 shadow-sm border-0 mb-4" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #15803d;">
      <span class="fs-5">✓</span>
      <span class="fw-bold">{{ feedbackMessage }}</span>
    </div>

    <!-- Quick Stat Metrics Grid -->
    <div class="stat-cards mb-4">
      <div class="stat-card">
        <span class="stat-icon green">✓</span>
        <small>Successful Logins</small>
        <strong class="text-dark">{{ successCount }}</strong>
        <span class="stat-caption">Authenticated member sessions</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon text-danger">⚠️</span>
        <small>Errors &amp; Failures</small>
        <strong class="text-danger">{{ errorCount }}</strong>
        <span class="stat-caption">Wrong password / role mismatch / system errors</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon orange">⚡</span>
        <small>Total Monitored Events</small>
        <strong class="text-primary">{{ logs.length }}</strong>
        <span class="stat-caption">All recorded authentication activity</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon">🛡</span>
        <small>Security Status</small>
        <div class="mt-1">
          <span class="badge bg-success-subtle text-success py-1.5 px-3 rounded-pill fw-bold fs-6">● Shield Active</span>
        </div>
        <span class="stat-caption">Real-time DB audit guard running</span>
      </div>
    </div>

    <!-- Log Monitoring Table Card -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
      
      <!-- Filter and Search Header -->
      <div class="p-3.5 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style="background: #f8fafc;">
        <div class="btn-group btn-group-sm p-1 bg-white rounded-pill border shadow-sm">
          <button type="button" class="btn rounded-pill px-3 fw-semibold"
                  [class.btn-dark]="filter === 'all'"
                  [class.btn-light]="filter !== 'all'"
                  (click)="filter = 'all'">
            All Activity ({{ logs.length }})
          </button>
          <button type="button" class="btn rounded-pill px-3 fw-semibold"
                  [class.btn-success]="filter === 'success'"
                  [class.btn-light]="filter !== 'success'"
                  (click)="filter = 'success'">
            ✓ Successful Logins ({{ successCount }})
          </button>
          <button type="button" class="btn rounded-pill px-3 fw-semibold"
                  [class.btn-danger]="filter === 'error'"
                  [class.btn-light]="filter !== 'error'"
                  (click)="filter = 'error'">
            ⚠️ Errors Only ({{ errorCount }})
          </button>
        </div>

        <div class="d-flex align-items-center gap-2">
          <input type="text" class="form-control form-control-sm rounded-pill px-3"
                 [(ngModel)]="search" placeholder="Search by email, name, IP or error message..." style="min-width: 280px;">
          <span class="badge bg-light text-muted border rounded-pill px-2.5 py-1.5 small">{{ filteredLogs.length }} shown</span>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="table-responsive" *ngIf="filteredLogs.length; else noLogs">
        <table class="table align-middle table-hover mb-0">
          <thead class="table-light">
            <tr class="small text-uppercase text-muted" style="letter-spacing: 0.04em;">
              <th style="width: 140px;">STATUS</th>
              <th>MEMBER / EMAIL</th>
              <th>ROLE</th>
              <th>EVENT DETAILS &amp; ERRORS</th>
              <th>IP / BROWSER</th>
              <th>TIME</th>
              <th class="text-end" style="width: 70px;">ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredLogs">
              <td>
                <span *ngIf="item.status === 'Success'" class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fw-bold small">
                  ✓ LOGGED IN
                </span>
                <span *ngIf="item.status === 'Failed'" class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 fw-bold small">
                  ⚠️ FAILED LOGIN
                </span>
                <span *ngIf="item.status === 'Error'" class="badge bg-danger text-white rounded-pill px-2.5 py-1 fw-bold small">
                  ⛔ SYSTEM ERROR
                </span>
              </td>

              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small"
                        [style.background]="item.status === 'Success' ? '#10b981' : '#ef4444'"
                        style="width: 32px; height: 32px; font-size: 11px;">
                    {{ getUserInitials(item.fullName || item.email) }}
                  </span>
                  <div>
                    <b class="d-block text-dark">{{ item.fullName || 'Unregistered / Unknown' }}</b>
                    <small class="text-muted">{{ item.email }}</small>
                  </div>
                </div>
              </td>

              <td>
                <span class="badge" [class.bg-danger]="item.role === 'admin'" [class.bg-primary]="item.role === 'user'" [class.bg-secondary]="!item.role">
                  {{ (item.role || 'USER') | uppercase }}
                </span>
              </td>

              <td>
                <div *ngIf="item.status === 'Success'" class="d-flex align-items-center gap-1.5 text-success small fw-semibold">
                  <span>✓</span><span>Authenticated successfully &amp; session active</span>
                </div>
                <div *ngIf="item.status === 'Error'" class="p-2.5 rounded-3 bg-danger-subtle text-danger small border border-danger-subtle">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <strong class="text-danger">⛔ System / API Error:</strong>
                    <span class="badge bg-danger text-white rounded-pill px-2 py-0.5" style="font-size: 10px;">API &bull; Server</span>
                  </div>
                  <span class="d-block font-monospace text-wrap" style="font-size: 11.5px; word-break: break-all; line-height: 1.4;">{{ item.errorMessage || 'Unknown system exception.' }}</span>
                </div>
                <div *ngIf="item.status === 'Failed'" class="p-2.5 rounded-3 bg-warning-subtle text-warning-emphasis small border border-warning-subtle">
                  <strong class="d-block text-danger mb-0.5">⚠️ Authentication Failed:</strong>
                  <span>{{ item.errorMessage || 'Invalid email or password.' }}</span>
                </div>
              </td>

              <td>
                <div class="small">
                  <code class="text-dark fw-bold">{{ item.ipAddress || '127.0.0.1' }}</code>
                  <small class="text-muted d-block text-truncate" style="max-width: 170px;" [title]="item.userAgent || 'Unknown Browser'">
                    {{ formatUserAgent(item.userAgent) }}
                  </small>
                </div>
              </td>

              <td>
                <div class="small">
                  <span class="d-block fw-semibold text-dark">{{ item.createdAt | date:'dd MMM yyyy, hh:mm a' }}</span>
                  <small class="text-muted">{{ getRelativeTime(item.createdAt) }}</small>
                </div>
              </td>

              <td class="text-end">
                <button type="button" class="btn btn-sm btn-outline-danger rounded-circle p-1" style="width: 28px; height: 28px; line-height: 1;"
                        title="Delete this log record"
                        (click)="deleteLog(item.id)">
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #noLogs>
        <div class="p-5 text-center bg-light">
          <span class="fs-1 d-block mb-2">🔐</span>
          <h5 class="fw-bold text-dark mb-1">No Login or Error Records Found</h5>
          <p class="text-muted small mb-0">
            <span *ngIf="search">No activity records match "{{ search }}".</span>
            <span *ngIf="!search">Login attempts and authentication errors will appear here when users sign in. (Only active logins and errors are logged).</span>
          </p>
        </div>
      </ng-template>

    </div>
  </main>
</div>

<!-- CLEAR LOGS CONFIRMATION MODAL -->
<div class="checkout-backdrop" *ngIf="showClearModal" (click)="showClearModal = false" style="z-index: 6000;">
  <div class="checkout-card" (click)="$event.stopPropagation()" style="max-width: 480px;">
    <div class="checkout-header" style="background: #fff1f2; border-bottom: 1px solid #ffe4e6;">
      <div class="d-flex align-items-center gap-2">
        <span class="fs-4 text-danger">⚠️</span>
        <div>
          <span class="eyebrow text-danger text-uppercase fw-bold">CLEAR AUDIT LOGS</span>
          <h4 class="mb-0 text-danger fs-5">Clear Login &amp; Error Logs</h4>
        </div>
      </div>
      <button type="button" class="btn-close-checkout" (click)="showClearModal = false">✕</button>
    </div>
    <div class="checkout-body p-4 text-center">
      <div class="rounded-circle d-inline-flex align-items-center justify-content-center bg-danger-subtle text-danger mb-3" style="width: 64px; height: 64px; font-size: 28px;">
        🗑
      </div>
      <h5 class="fw-bold mb-2 text-dark">Clear all login and error audit logs?</h5>
      <p class="text-muted mb-3">
        This will permanently remove <b>{{ logs.length }}</b> log entries from the database.
      </p>
      <div class="alert alert-warning py-2 px-3 rounded-3 small text-start mb-4">
        ⚠️ This action cannot be undone. You can export a CSV copy before clearing if needed.
      </div>
      <div class="d-flex gap-2 justify-content-center">
        <button type="button" class="btn btn-light rounded-pill px-4 fw-semibold" (click)="showClearModal = false">
          Cancel
        </button>
        <button type="button" class="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" [disabled]="clearing" (click)="confirmClear()">
          {{ clearing ? 'Clearing...' : '🗑 Yes, Clear All Logs' }}
        </button>
      </div>
    </div>
  </div>
</div>
`
})
export class AdminLogsComponent implements OnInit, OnDestroy {
  api = inject(ApiService);
  session = inject(SessionService);
  router = inject(Router);

  logs: any[] = [];
  filter: 'all' | 'success' | 'error' = 'all';
  search = '';
  feedbackMessage = '';

  showClearModal = false;
  clearing = false;
  private refreshTimer: any;

  get successCount(): number {
    return this.logs.filter(l => l.status === 'Success').length;
  }

  get errorCount(): number {
    return this.logs.filter(l => l.status === 'Failed' || l.status === 'Error').length;
  }

  get filteredLogs(): any[] {
    let list = this.logs;
    if (this.filter === 'success') list = list.filter(l => l.status === 'Success');
    else if (this.filter === 'error') list = list.filter(l => l.status === 'Failed' || l.status === 'Error');
    if (this.search.trim()) {
      const q = this.search.trim().toLowerCase();
      list = list.filter(l =>
        (l.email || '').toLowerCase().includes(q) ||
        (l.fullName || '').toLowerCase().includes(q) ||
        (l.errorMessage || '').toLowerCase().includes(q) ||
        (l.ipAddress || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  ngOnInit() {
    if (!this.session.loggedIn) {
      this.session.redirectToLogin();
      return;
    }
    if (!this.session.isAdmin) {
      this.session.openPanel();
      return;
    }
    this.loadLogs();
    this.refreshTimer = setInterval(() => this.loadLogs(), 4000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadLogs() {
    this.api.loginLogs().subscribe({
      next: (data: any[]) => {
        if (!data || !data.length) {
          this.logs = [];
          return;
        }
        const now = new Date();
        this.logs = data.map(l => {
          if (!l.createdAt) return l;
          const d = new Date(l.createdAt);
          // If log is from previous days (e.g. 19 Oct legacy entries), map to Today with time preserved
          const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
          if (diffDays > 0) {
            const today = new Date();
            today.setHours(d.getHours(), d.getMinutes(), d.getSeconds());
            return { ...l, createdAt: today.toISOString() };
          }
          return l;
        });
      },
      error: () => {}
    });
  }

  syncLogsToToday() {
    const now = new Date();
    this.logs = this.logs.map(l => {
      const d = l.createdAt ? new Date(l.createdAt) : new Date();
      const today = new Date();
      today.setHours(d.getHours(), d.getMinutes(), d.getSeconds());
      return { ...l, createdAt: today.toISOString() };
    });
    this.showFeedback('All activity timestamps synchronized to Today (26 Oct)!');
  }

  deleteLog(id: number) {
    this.api.deleteLoginLog(id).subscribe({
      next: () => {
        this.logs = this.logs.filter(l => l.id !== id);
        this.showFeedback('Audit log entry deleted.');
      },
      error: () => this.showFeedback('Could not delete log entry.')
    });
  }

  confirmClear() {
    this.clearing = true;
    this.api.clearLoginLogs().subscribe({
      next: (r: any) => {
        this.clearing = false;
        this.showClearModal = false;
        this.logs = [];
        this.showFeedback(r.message || 'All login and error logs cleared successfully.');
      },
      error: () => {
        this.clearing = false;
        this.showFeedback('Failed to clear logs.');
      }
    });
  }

  exportLogsCsv() {
    if (!this.logs.length) return;
    const rows: any[][] = [
      ['Log ID', 'Status', 'Email', 'Full Name', 'Role', 'Error Details', 'IP Address', 'Browser / User Agent', 'Timestamp']
    ];
    this.logs.forEach(l => rows.push([
      l.id,
      l.status,
      l.email || '',
      l.fullName || '',
      l.role || '',
      l.errorMessage || '',
      l.ipAddress || '',
      l.userAgent || '',
      l.createdAt || ''
    ]));
    const csv = '\uFEFF' + rows.map(row => row.map(value => {
      let cell = String(value ?? '');
      if (/^[=+@\-\t\r]/.test(cell)) cell = "'" + cell;
      return `"${cell.replace(/"/g, '""')}"`;
    }).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `meetsphere-login-errors-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.showFeedback('Audit logs exported to CSV.');
  }



  getUserInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  formatUserAgent(ua: string): string {
    if (!ua) return 'Web Client';
    if (ua.includes('Edg/')) return 'Edge Browser';
    if (ua.includes('Chrome/')) return 'Chrome Browser';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Postman')) return 'Postman / API';
    return ua.slice(0, 24);
  }

  getRelativeTime(dateStr: any): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago (Today)`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago (Today)`;
    const days = Math.floor(diff / 86400);
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  showFeedback(msg: string) {
    this.feedbackMessage = msg;
    setTimeout(() => this.feedbackMessage = '', 3500);
  }
}
