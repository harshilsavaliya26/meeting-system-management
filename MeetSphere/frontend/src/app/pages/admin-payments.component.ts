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
      <a class="side-link active" routerLink="/admin-payments">
        <span class="side-link-icon">₹</span> Payments &amp; Revenue
      </a>
      <a class="side-link" routerLink="/admin-tools/calendar"><span class="side-link-icon">▣</span> Calendar</a>
      <a class="side-link" routerLink="/admin-tools/notes"><span class="side-link-icon">◩</span> Notetaker</a>
      <a class="side-link" routerLink="/admin-tools/contacts"><span class="side-link-icon">♧</span> Contacts</a>
      <a class="side-link" routerLink="/admin-tools/automations"><span class="side-link-icon">✣</span> Automations</a>
      <a class="side-link" routerLink="/admin-tools/upgrade"><span class="side-link-icon">⇧</span> Subscriptions</a>
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
        <span class="eyebrow text-danger">ADMIN PAYMENT AUDIT</span>
        <h2>Revenue &amp; Transactions <span>₹</span></h2>
        <p>Review all financial transactions, hosting fees, and payment logs.</p>
      </div>
      <a routerLink="/admin" class="btn btn-outline-dark rounded-pill px-4">
        ← Back to Admin Console
      </a>
    </header>

    <div class="stat-cards">
      <div class="stat-card">
        <span class="stat-icon">₹</span>
        <small>Total Collected</small>
        <strong>₹{{ totalCollected | number:'1.2-2' }}</strong>
        <span class="stat-caption">Verified revenue</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon green">♙</span>
        <small>Paid Users</small>
        <strong>{{ uniquePaidUsers }}</strong>
        <span class="stat-caption">Unique buyers</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon orange">▤</span>
        <small>Transactions</small>
        <strong>{{ payments.length }}</strong>
        <span class="stat-caption">Total payment records</span>
      </div>
    </div>

    <section class="meetings-section mt-4">
      <div class="section-heading">
        <div>
          <h4>Payment Records</h4>
          <p>Detailed log of user meeting purchases and hosting fees.</p>
        </div>
        <span class="count-pill">{{ payments.length }} records</span>
      </div>

      <div class="table-responsive meeting-table" *ngIf="payments.length">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>USER</th>
              <th>MEETING / SESSION</th>
              <th>AMOUNT</th>
              <th>METHOD</th>
              <th>TRANSACTION ID</th>
              <th>STATUS</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of payments">
              <td>
                <b>{{ p.userName }}</b>
                <small class="d-block text-muted">{{ p.userEmail }}</small>
              </td>
              <td>{{ p.meetingTitle }}</td>
              <td>
                <span class="fw-bold text-success">₹{{ p.amount | number:'1.2-2' }}</span>
              </td>
              <td>{{ p.method }}</td>
              <td><code>{{ p.paymentId || p.transactionId }}</code></td>
              <td>
                <span class="role-badge" [class.admin-role]="p.paymentStatus === 'Paid'">
                  {{ p.paymentStatus }}
                </span>
              </td>
              <td>{{ p.paidAt ? (p.paidAt | date:'medium') : (p.createdAt | date:'medium') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="error" class="alert alert-danger mt-3">{{ error }}</div>

      <div *ngIf="!payments.length && !error" class="empty-state">
        <div class="empty-icon">₹</div>
        <h5>No payment records</h5>
        <p>Payment logs will appear here once users pay for meetings or hosting fees.</p>
      </div>
    </section>
  </main>
</div>
`
})
export class AdminPaymentsComponent implements OnInit {
  api = inject(ApiService);
  session = inject(SessionService);
  router = inject(Router);

  payments: any[] = [];
  error = '';


  get totalCollected() {
    return this.payments
      .filter(p => p.paymentStatus === 'Paid')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
  }

  get uniquePaidUsers() {
    return new Set(this.payments.filter(p => p.paymentStatus === 'Paid').map(p => p.userId)).size;
  }

  ngOnInit() {
    if (!this.session.loggedIn || !this.session.isAdmin) {
      this.session.redirectToLogin();
      return;
    }

    this.api.adminPayments().subscribe({
      next: x => { this.payments = x || []; this.error = ''; },
      error: (e: any) => { this.payments = []; this.error = e.error?.message || 'Payment data could not be loaded. Make sure the backend and MySQL database are running.'; }
    });
  }


}
