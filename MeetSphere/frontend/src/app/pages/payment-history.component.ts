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
    <aside class="sidebar">
      <a class="brand side-brand" routerLink="/dashboard"><span class="brand-icon">M</span> MeetSphere</a>
      <div class="side-label">WORKSPACE</div>
      <nav class="sidebar-nav">
        <a class="side-link" routerLink="/dashboard">▦ &nbsp; Overview</a>
        <a class="side-link" routerLink="/discover">◈ &nbsp; Discover meetings</a>
        <a class="side-link active" routerLink="/payment-history">₹ &nbsp; Payment history</a>
        <a class="side-link" routerLink="/calendar">▣ &nbsp; Calendar</a>
        <a class="side-link" routerLink="/notetaker">◩ &nbsp; Notetaker</a>
        <a class="side-link" routerLink="/contacts">♧ &nbsp; Contacts</a>
        <a class="side-link" routerLink="/automations">✣ &nbsp; Automations</a>
        <a class="side-link" routerLink="/upgrade">⇧ &nbsp; Upgrade plan</a>
        <a class="side-link" routerLink="/settings">⚙ &nbsp; Settings</a>
        <a class="side-link" routerLink="/">⌂ &nbsp; Home</a>
      </nav>



      <div class="side-bottom">
        <div class="d-flex align-items-center gap-2 mb-2 px-1">
          <span class="status-dot-green"></span>
          <small class="text-muted fw-semibold" style="font-size: 11px;">Server Online · Payments Ready</small>
        </div>
        <div class="profile-chip">
          <span class="profile-avatar">{{ initials }}</span>
          <div>
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
          <span class="eyebrow">YOUR ACCOUNT</span>
          <h2>Payment history <span>₹</span></h2>
          <p>Review your meeting purchases and transaction status.</p>
        </div>
        <a routerLink="/discover" class="btn btn-primary rounded-pill px-4">Discover meetings</a>
      </header>
      <section class="meetings-section">
        <div class="section-heading">
          <div>
            <h4>Your transactions</h4>
            <p>Payment records associated with your account.</p>
          </div>
          <span class="count-pill">{{ payments.length }} records</span>
        </div>
        <div class="table-responsive meeting-table" *ngIf="payments.length">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>MEETING</th>
                <th>AMOUNT</th>
                <th>METHOD</th>
                <th>TRANSACTION</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of payments">
                <td>
                  <b>{{ p.meetingTitle }}</b>
                  <small class="d-block text-muted" *ngIf="p.meetingCode">Code: {{ p.meetingCode }}</small>
                </td>
                <td>₹{{ p.amount | number:'1.2-2' }}</td>
                <td>{{ p.method }}</td>
                <td><code>{{ p.paymentId || p.transactionId }}</code></td>
                <td>
                  <span class="role-badge" [class.admin-role]="p.paymentStatus === 'Paid'">{{ p.paymentStatus }}</span>
                </td>
                <td>{{ p.paidAt ? (p.paidAt | date:'medium') : (p.createdAt | date:'medium') }}</td>
                <td>
                  <a *ngIf="p.paymentStatus === 'Paid' && p.meetingCode" [routerLink]="['/room', p.meetingCode]" class="btn btn-sm btn-primary rounded-pill px-3">Enter room →</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div *ngIf="!payments.length && !error" class="empty-state">
          <div class="empty-icon">₹</div>
          <h5>No payments yet</h5>
          <p>Paid meeting transactions will appear here.</p>
        </div>
        <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
      </section>
    </main>
  </div>`
})
export class PaymentHistoryComponent implements OnInit {
  api = inject(ApiService);
  session = inject(SessionService);
  router = inject(Router);

  payments: any[] = [];
  error = '';


  get initials() {
    return (this.session.user?.fullName || 'M')
      .split(' ')
      .map((x: string) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  ngOnInit() {
    this.api.myPayments().subscribe({
      next: x => { this.payments = x || []; this.error = ''; },
      error: () => this.error = 'Could not load payment history. Please check that the API and database are running.'
    });
  }


}
