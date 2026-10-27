import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, SessionService } from '../services';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="app-shell">
  <!-- COMPLETE ADMIN WORKSPACE SIDEBAR -->
  <aside class="sidebar">
    <a class="brand side-brand" routerLink="/admin">
      <span class="brand-icon bg-danger text-white">M</span> MeetSphere
    </a>
    
    <div class="side-label">WORKSPACE</div>
    <nav class="sidebar-nav">
      <!-- 1. Overview -->
      <a class="side-link active" routerLink="/admin">
        <span class="side-link-icon">▦</span> Overview
      </a>

      <!-- 2. My meetings with count badge -->
      <a class="side-link d-flex align-items-center justify-content-between" href="#meetings" (click)="scrollTo('meetings', $event)">
        <div class="d-flex align-items-center gap-2">
          <span class="side-link-icon">◷</span><span>My meetings</span>
        </div>
        <span class="badge bg-primary-subtle text-primary rounded-pill px-2 py-0.5 small" *ngIf="meetings.length">{{ meetings.length }}</span>
      </a>

      <!-- 3. Host Meeting (₹100) -->
      <button type="button" class="side-link side-action text-primary fw-bold border-0 bg-transparent text-start w-100" (click)="openHostMeetingModal()">
        <span class="side-link-icon text-primary">＋</span><span class="text-primary">Host Meeting (₹100)</span>
      </button>

      <!-- 4. Discover meetings -->
      <a class="side-link" routerLink="/discover">
        <span class="side-link-icon">◈</span> Discover meetings
      </a>

      <!-- 5. Payment history -->
      <a class="side-link" routerLink="/admin-payments">
        <span class="side-link-icon">₹</span> Payment history
      </a>

      <!-- 6. Calendar -->
      <a class="side-link" routerLink="/calendar">
        <span class="side-link-icon">▣</span> Calendar
      </a>

      <!-- 7. Notetaker -->
      <a class="side-link" routerLink="/notetaker">
        <span class="side-link-icon">◩</span> Notetaker
      </a>

      <!-- 8. Contacts -->
      <a class="side-link" routerLink="/contacts">
        <span class="side-link-icon">♧</span> Contacts
      </a>

      <!-- 9. Automations (Zoom Integration) -->
      <a class="side-link" routerLink="/automations">
        <span class="side-link-icon">✣</span> Automations
      </a>

      <!-- 10. Upgrade plan -->
      <a class="side-link" routerLink="/upgrade">
        <span class="side-link-icon">⇧</span> Upgrade plan
      </a>

      <!-- 11. Settings -->
      <a class="side-link" routerLink="/admin-settings">
        <span class="side-link-icon">⚙</span> Settings
      </a>

      <!-- 12. Home -->
      <a class="side-link" routerLink="/">
        <span class="side-link-icon">⌂</span> Home
      </a>

      <!-- ADMIN EXCLUSIVE CONTROLS -->
      <div class="side-label text-danger fw-bold mt-3 mb-1" style="font-size: 11px;">ADMIN CONTROLS</div>

      <!-- User Logins & Errors Monitoring -->
      <a class="side-link d-flex align-items-center gap-2" routerLink="/admin-logs">
        <span class="side-link-icon">🔐</span>
        <span>User Logins &amp; Errors</span>
      </a>
      
      <a class="side-link d-flex align-items-center justify-content-between" href="#users" (click)="scrollTo('users', $event)">
        <div><span class="side-link-icon">♙</span> Users Management</div>
        <span class="badge bg-primary-subtle text-primary rounded-pill px-2 py-0.5 small" *ngIf="users.length">{{ users.length }}</span>
      </a>

      <a class="side-link d-flex align-items-center justify-content-between" href="#meetings" (click)="scrollTo('meetings', $event)">
        <div><span class="side-link-icon">◷</span> Rooms Activity</div>
        <span class="badge bg-success-subtle text-success rounded-pill px-2 py-0.5 small" *ngIf="meetings.length">{{ meetings.length }}</span>
      </a>

      <a class="side-link" routerLink="/admin-payments">
        <span class="side-link-icon">₹</span> Revenue Audit
      </a>

      <a class="side-link" routerLink="/admin-tools/governance">
        <span class="side-link-icon">◈</span> Governance Scorecard
      </a>

      <a class="side-link" href="#announcement" (click)="scrollTo('announcement', $event)">
        <span class="side-link-icon">📢</span> Platform Notice
      </a>
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
        <span class="eyebrow text-danger">MEETSPHERE CONTROL CENTER</span>
        <h2>Admin Management Console <span>✦</span></h2>
        <p>Complete workspace tools, user profiles, room controls, and revenue auditing.</p>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-primary rounded-pill px-4 shadow-sm fw-bold" (click)="openHostMeetingModal()">
          ＋ Host Meeting (₹100)
        </button>
        <a routerLink="/admin-payments" class="btn btn-outline-primary rounded-pill px-4 shadow-sm fw-bold">
          ₹ Revenue Audit
        </a>
        <button type="button" class="btn btn-outline-success rounded-pill px-4 fw-bold" (click)="exportAuditReport()">
          ⬇ Export Audit CSV
        </button>
        <a routerLink="/" class="btn btn-outline-dark rounded-pill px-4">
          View Website ↗
        </a>
      </div>
    </header>

    <!-- Success Feedback Banner -->
    <div *ngIf="feedbackMessage" class="alert alert-success d-flex align-items-center gap-2 py-3 px-4 rounded-4 shadow-sm border-0 mb-4" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #15803d;">
      <span class="fs-5">✓</span>
      <span class="fw-bold">{{ feedbackMessage }}</span>
    </div>

    <!-- Stat Cards Overview -->
    <div class="stat-cards">
      <div class="stat-card">
        <span class="stat-icon">♙</span>
        <small>Total Members</small>
        <strong>{{ users.length }}</strong>
        <span class="stat-caption">Registered accounts</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon text-danger">🛡</span>
        <small>Administrators</small>
        <strong>{{ adminCount }}</strong>
        <span class="stat-caption">Control center admins</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon green">◷</span>
        <small>Total Rooms</small>
        <strong>{{ meetings.length }}</strong>
        <span class="stat-caption">Hosted sessions</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon orange">₹</span>
        <small>Total Revenue</small>
        <strong>₹{{ totalRevenue | number:'1.2-2' }}</strong>
        <span class="stat-caption">Collected hosting fees</span>
      </div>
    </div>

    <!-- ADMIN OPERATIONS PULSE: reflects live records already loaded in the admin panel -->
    <section class="card border-0 shadow-sm rounded-4 p-4 mt-4" style="background:linear-gradient(135deg,#fff,#fff5f5);">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <span class="eyebrow text-danger">OPERATIONS CENTER</span>
          <h4 class="fw-bold mb-1">🛰 Platform Pulse</h4>
          <p class="text-muted mb-0">A quick operational snapshot based on the records currently loaded from your API.</p>
        </div>
        <button type="button" class="btn btn-danger rounded-pill px-4" (click)="load()">↻ Refresh snapshot</button>
      </div>
      <div class="row g-3">
        <div class="col-6 col-lg-3"><div class="rounded-3 p-3 h-100" style="background:#fff;"><small class="text-muted d-block">Members</small><strong class="fs-3">{{ users.length }}</strong><div class="small text-muted">{{ adminCount }} administrator(s)</div></div></div>
        <div class="col-6 col-lg-3"><div class="rounded-3 p-3 h-100" style="background:#fff;"><small class="text-muted d-block">Meeting rooms</small><strong class="fs-3">{{ meetings.length }}</strong><div class="small text-muted">Loaded room records</div></div></div>
        <div class="col-6 col-lg-3"><div class="rounded-3 p-3 h-100" style="background:#fff;"><small class="text-muted d-block">Payment records</small><strong class="fs-3">{{ payments.length }}</strong><div class="small text-muted">{{ paidPaymentCount }} marked paid</div></div></div>
        <div class="col-6 col-lg-3"><div class="rounded-3 p-3 h-100" style="background:#fff;"><small class="text-muted d-block">Paid revenue</small><strong class="fs-3">₹{{ totalRevenue | number:'1.0-0' }}</strong><div class="small text-muted">Paid transactions only</div></div></div>
      </div>
      <div class="d-flex flex-wrap gap-2 mt-3">
        <button type="button" class="btn btn-outline-dark rounded-pill" (click)="scrollTo('users', $event)">♙ Manage users</button>
        <button type="button" class="btn btn-outline-dark rounded-pill" (click)="scrollTo('meetings', $event)">◷ Review rooms</button>
        <a routerLink="/admin-payments" class="btn btn-outline-dark rounded-pill">₹ Review payments</a>
        <button type="button" class="btn btn-outline-success rounded-pill" (click)="exportAuditReport()">⬇ Export full audit</button>
      </div>
      <small class="text-muted d-block mt-3">This is an operational summary, not a server uptime guarantee. If counts look outdated, refresh the snapshot.</small>
    </section>

    <!-- ACTIONABLE OPERATIONS WATCHLIST: calculated from currently loaded API records -->
    <section class="card border-0 shadow-sm rounded-4 p-4 mt-4" style="background:linear-gradient(135deg,#fff7ed,#ffffff);">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div><span class="eyebrow" style="color:#9a3412;">ADMIN ACTION CENTER</span><h4 class="fw-bold mb-1">🚦 Operations Watchlist</h4><p class="text-muted mb-0">Quickly identify records that may need review. Counts use the records currently loaded in this panel.</p></div>
        <button type="button" class="btn btn-outline-danger rounded-pill" (click)="load()">↻ Recheck records</button>
      </div>
      <div class="row g-3">
        <div class="col-md-4"><div class="p-3 rounded-3 h-100" style="background:white;border:1px solid #fed7aa;"><small class="text-muted d-block">Not marked paid</small><strong class="fs-2">{{ unpaidPaymentCount }}</strong><div class="small text-muted">Payment records needing status review</div><a routerLink="/admin-payments" class="btn btn-sm btn-outline-danger rounded-pill mt-2">Review payments →</a></div></div>
        <div class="col-md-4"><div class="p-3 rounded-3 h-100" style="background:white;border:1px solid #fed7aa;"><small class="text-muted d-block">Rooms missing a code</small><strong class="fs-2">{{ roomsMissingCodeCount }}</strong><div class="small text-muted">Room records without a meeting code</div><button type="button" class="btn btn-sm btn-outline-dark rounded-pill mt-2" (click)="scrollTo('meetings', $event)">Review rooms →</button></div></div>
        <div class="col-md-4"><div class="p-3 rounded-3 h-100" style="background:white;border:1px solid #fed7aa;"><small class="text-muted d-block">Users without email</small><strong class="fs-2">{{ usersMissingEmailCount }}</strong><div class="small text-muted">Profiles to verify</div><button type="button" class="btn btn-sm btn-outline-dark rounded-pill mt-2" (click)="scrollTo('users', $event)">Review users →</button></div></div>
      </div>
      <small class="text-muted d-block mt-3">These are review flags, not proof of a payment failure or account problem. Verify each record before taking action.</small>
    </section>

    <!-- UNIQUE FEATURE V4: ADMIN DECISION & INCIDENT LOG -->
    <section class="card border-0 shadow-sm rounded-4 p-4 mt-4" style="background:linear-gradient(135deg,#f5f3ff,#ffffff);">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div><span class="eyebrow" style="color:#6d28d9;">ADMIN GOVERNANCE</span><h4 class="fw-bold mb-1">🧭 Decision & Incident Log</h4><p class="text-muted mb-0">Keep track of operational decisions and follow-ups. Saved privately for this admin account in this browser.</p></div>
        <button type="button" class="btn btn-outline-primary rounded-pill" (click)="exportAdminLog()" [disabled]="!adminLogItems.length">⬇ Export log</button>
      </div>
      <form class="row g-2" (ngSubmit)="addAdminLogItem()">
        <div class="col-lg-4"><label class="form-label fw-semibold" for="adminLogTitle">Decision / incident title</label><input id="adminLogTitle" class="form-control rounded-3" name="adminLogTitle" [(ngModel)]="adminLogTitle" maxlength="140" placeholder="e.g. Investigate payment delay"></div>
        <div class="col-lg-5"><label class="form-label fw-semibold" for="adminLogDetails">Notes / next action</label><input id="adminLogDetails" class="form-control rounded-3" name="adminLogDetails" [(ngModel)]="adminLogDetails" maxlength="300" placeholder="Owner, follow-up, or resolution notes"></div>
        <div class="col-lg-3 d-flex align-items-end"><button class="btn btn-primary rounded-3 w-100" type="submit" [disabled]="!adminLogTitle.trim()">＋ Add log entry</button></div>
      </form>
      <div *ngIf="adminLogItems.length; else noAdminLogItems" class="d-grid gap-2 mt-3">
        <div *ngFor="let item of adminLogItems; let i = index" class="p-3 rounded-3" style="background:white;border:1px solid #ddd6fe;">
          <div class="d-flex flex-wrap align-items-start gap-2"><div class="flex-grow-1"><div class="fw-bold" [class.text-decoration-line-through]="item.resolved">{{ item.title }}</div><div class="small text-muted mt-1">{{ item.details || 'No additional notes' }}</div><small class="text-muted">Added {{ item.createdAt }}</small></div><span class="badge rounded-pill" [class.text-bg-success]="item.resolved" [class.text-bg-warning]="!item.resolved">{{ item.resolved ? 'Resolved' : 'Open' }}</span></div>
          <div class="d-flex gap-2 mt-2"><button type="button" class="btn btn-sm btn-outline-success rounded-pill" (click)="toggleAdminLogItem(i)">{{ item.resolved ? 'Reopen' : 'Mark resolved' }}</button><button type="button" class="btn btn-sm btn-outline-secondary rounded-pill" (click)="removeAdminLogItem(i)">Remove</button></div>
        </div>
      </div>
      <ng-template #noAdminLogItems><p class="small text-muted mt-3 mb-0">No entries yet. Add an operational decision or incident to start your private log.</p></ng-template>
      <small class="text-muted d-block mt-3">This is a browser-local admin notebook, not a shared audit database. Export important entries for your records.</small>
    </section>

    <!-- PLATFORM ANNOUNCEMENT TOOL -->
    <section id="announcement" class="card border-0 shadow-sm rounded-4 p-4 mt-4 bg-white">
      <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
        <div>
          <h5 class="fw-bold text-dark mb-0">📢 Broadcast Platform Announcement</h5>
          <small class="text-muted">Publish a global message banner across the platform.</small>
        </div>
        <span class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-3 py-1 fw-bold">
          Admin Broadcast Tool
        </span>
      </div>
      <div class="row g-3">
        <div class="col-md-9">
          <input type="text" class="form-control rounded-3" [(ngModel)]="announcementText"
                 placeholder="e.g. 📢 Scheduled system maintenance tonight at 11:00 PM IST...">
        </div>
        <div class="col-md-3">
          <button type="button" class="btn btn-warning rounded-3 w-100 fw-bold shadow-sm" (click)="publishAnnouncement()">
            📢 Publish Broadcast
          </button>
        </div>
      </div>
    </section>

    <!-- COMPLETE USER MANAGEMENT SECTION -->
    <section id="users" class="meetings-section mt-4">
      <div class="section-heading">
        <div>
          <h4>Users Management &amp; Profiles</h4>
          <p>Full member details with select, edit, and delete controls. Changes reflect instantly on the user side.</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <input type="text" class="form-control form-control-sm rounded-pill px-3"
                 [(ngModel)]="userSearch" placeholder="Search user by name or email..." style="width: 250px;">
          <span class="count-pill">{{ filteredUsers.length }} users</span>
        </div>
      </div>

      <div class="table-responsive meeting-table" *ngIf="filteredUsers.length">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>MEMBER</th>
              <th>ROLE</th>
              <th class="text-center">MEETINGS</th>
              <th class="text-center">PAYMENTS</th>
              <th>TOTAL PAID</th>
              <th>JOINED</th>
              <th class="text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of filteredUsers" [class.table-active]="selectedUser?.id === u.id">
              <td><code>#{{ u.id }}</code></td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small"
                        [style.background]="u.role === 'admin' ? '#ef4444' : '#6366f1'"
                        style="width: 32px; height: 32px; font-size: 11px;">
                    {{ getUserInitials(u.fullName) }}
                  </span>
                  <div>
                    <b class="d-block text-dark">{{ u.fullName }}</b>
                    <small class="text-muted">{{ u.email }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="role-badge" [class.admin-role]="u.role === 'admin'">
                  {{ u.role | uppercase }}
                </span>
              </td>
              <td class="text-center">
                <span class="badge bg-light text-dark border px-2 py-1 rounded-pill">
                  {{ u.meetingCount || 0 }}
                </span>
              </td>
              <td class="text-center">
                <span class="badge bg-light text-dark border px-2 py-1 rounded-pill">
                  {{ u.paymentCount || 0 }}
                </span>
              </td>
              <td>
                <span class="fw-bold text-success">
                  ₹{{ (u.totalPaid || 0) | number:'1.2-2' }}
                </span>
              </td>
              <td>{{ u.createdAt | date:'mediumDate' }}</td>
              <td class="text-end">
                <div class="d-flex gap-1.5 justify-content-end">
                  <!-- SELECT / VIEW DETAILS -->
                  <button type="button" class="btn btn-sm btn-outline-info rounded-pill px-2.5"
                          title="View complete user details"
                          (click)="viewUserDetails(u)">
                    👁 Details
                  </button>

                  <!-- EDIT USER -->
                  <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-2.5"
                          title="Edit name, email or role"
                          (click)="openEditUser(u)">
                    ✏ Edit
                  </button>

                  <!-- DELETE USER -->
                  <button type="button" class="btn btn-sm btn-outline-danger rounded-pill px-2.5"
                          title="Delete user and all related records"
                          (click)="promptDeleteUser(u)">
                    🗑 Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state" *ngIf="!filteredUsers.length">
        <h5>No user records found</h5>
        <p>No users matching "{{ userSearch }}" were found.</p>
      </div>
    </section>

    <!-- MEETINGS MANAGEMENT SECTION -->
    <section id="meetings" class="meetings-section mt-4">
      <div class="section-heading">
        <div>
          <h4>Meeting Rooms Activity</h4>
          <p>All active and created meeting rooms across the platform.</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <input type="text" class="form-control form-control-sm rounded-pill px-3"
                 [(ngModel)]="meetingSearch" placeholder="Search meeting title or host..." style="width: 250px;">
          <span class="count-pill">{{ filteredMeetings.length }} rooms</span>
        </div>
      </div>

      <div class="table-responsive meeting-table" *ngIf="filteredMeetings.length">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>MEETING TITLE</th>
              <th>HOST</th>
              <th>MEETING CODE</th>
              <th>HOSTING FEE</th>
              <th>CREATED AT</th>
              <th class="text-end">ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of filteredMeetings">
              <td><b>{{ m.title }}</b></td>
              <td>{{ m.host }}</td>
              <td><code>{{ m.meetingCode }}</code></td>
              <td>
                <span class="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill fw-bold">
                  ₹{{ (m.price || 100) | number:'1.2-2' }}
                </span>
              </td>
              <td>{{ m.createdAt | date:'mediumDate' }}</td>
              <td class="text-end">
                <div class="d-flex gap-2 justify-content-end align-items-center">
                  <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-3"
                          (click)="openEditMeeting(m)">
                    ✏ Edit
                  </button>
                  <a [routerLink]="['/room', m.meetingCode]" class="btn btn-sm btn-outline-primary rounded-pill px-3">
                    Inspect Room →
                  </a>
                  <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-2.5 fw-semibold" (click)="launchZoom(m)" title="Join via Zoom">
                    📹 Zoom
                  </button>
                  <button class="btn btn-sm btn-outline-danger rounded-pill px-3" (click)="promptDeleteMeeting(m)">
                    Delete Room
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state" *ngIf="!filteredMeetings.length">
        <h5>No meeting records found</h5>
        <p>No meeting rooms matching "{{ meetingSearch }}" were found.</p>
      </div>
    </section>

  </main>
</div>
        



<!-- ================= USER DETAILS MODAL (SELECT USER) ================= -->
<div class="checkout-backdrop" *ngIf="showUserDetailsModal" (click)="showUserDetailsModal = false" style="z-index: 5000;">
  <div class="checkout-card" (click)="$event.stopPropagation()" style="max-width: 550px;">
    <div class="checkout-header">
      <div>
        <span class="eyebrow text-uppercase">USER PROFILE AUDIT</span>
        <h4 class="mb-0 mt-1">Complete User Details</h4>
      </div>
      <button type="button" class="btn-close-checkout" (click)="showUserDetailsModal = false">✕</button>
    </div>
    <div class="checkout-body" *ngIf="selectedUser">
      <!-- User Header Card -->
      <div class="d-flex align-items-center gap-3 p-3 rounded-4 bg-light mb-3">
        <span class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-4"
              [style.background]="selectedUser.role === 'admin' ? '#ef4444' : '#6366f1'"
              style="width: 56px; height: 56px;">
          {{ getUserInitials(selectedUser.fullName) }}
        </span>
        <div>
          <h5 class="mb-0 fw-bold">{{ selectedUser.fullName }}</h5>
          <div class="text-muted small">{{ selectedUser.email }}</div>
          <span class="badge mt-1" [class.bg-danger]="selectedUser.role === 'admin'" [class.bg-primary]="selectedUser.role !== 'admin'">
            ★ {{ selectedUser.role | uppercase }}
          </span>
        </div>
      </div>

      <!-- User Stats Grid -->
      <div class="row g-2 mb-3">
        <div class="col-4">
          <div class="p-2.5 rounded-3 bg-white border text-center">
            <small class="text-muted d-block" style="font-size: 11px;">Account ID</small>
            <b class="text-dark">#{{ selectedUser.id }}</b>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2.5 rounded-3 bg-white border text-center">
            <small class="text-muted d-block" style="font-size: 11px;">Meetings Hosted</small>
            <b class="text-primary">{{ selectedUser.meetingCount || 0 }}</b>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2.5 rounded-3 bg-white border text-center">
            <small class="text-muted d-block" style="font-size: 11px;">Total Paid</small>
            <b class="text-success">₹{{ (selectedUser.totalPaid || 0) | number:'1.2-2' }}</b>
          </div>
        </div>
      </div>

      <!-- Detailed Properties -->
      <div class="list-group list-group-flush border rounded-3 mb-3 small">
        <div class="list-group-item d-flex justify-content-between py-2">
          <span class="text-muted">Registered Date:</span>
          <b>{{ selectedUser.createdAt | date:'fullDate' }}</b>
        </div>
        <div class="list-group-item d-flex justify-content-between py-2">
          <span class="text-muted">Registration Time:</span>
          <b>{{ selectedUser.createdAt | date:'mediumTime' }}</b>
        </div>
        <div class="list-group-item d-flex justify-content-between py-2">
          <span class="text-muted">Completed Transactions:</span>
          <b>{{ selectedUser.paymentCount || 0 }} payments</b>
        </div>
        <div class="list-group-item d-flex justify-content-between py-2">
          <span class="text-muted">Account Status:</span>
          <span class="badge bg-success-subtle text-success">Active Member</span>
        </div>
      </div>

      <!-- Quick Actions from Detail View -->
      <div class="d-flex gap-2 justify-content-end mt-3">
        <button type="button" class="btn btn-outline-secondary rounded-pill px-3" (click)="showUserDetailsModal = false; openEditUser(selectedUser)">
          ✏ Edit User
        </button>
        <button type="button" class="btn btn-outline-primary rounded-pill px-3" (click)="promptToggleRole(selectedUser)">
          Switch to {{ selectedUser.role === 'admin' ? 'User' : 'Admin' }}
        </button>
        <button type="button" class="btn btn-outline-danger rounded-pill px-3" (click)="showUserDetailsModal = false; promptDeleteUser(selectedUser)">
          🗑 Delete User
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ================= EDIT USER MODAL ================= -->
<div class="checkout-backdrop" *ngIf="showEditUserModal" (click)="showEditUserModal = false" style="z-index: 5000;">
  <div class="checkout-card" (click)="$event.stopPropagation()">
    <div class="checkout-header">
      <div>
        <span class="eyebrow text-uppercase">ADMIN USER MANAGEMENT</span>
        <h4 class="mb-0 mt-1">Edit User Account</h4>
      </div>
      <button type="button" class="btn-close-checkout" (click)="showEditUserModal = false">✕</button>
    </div>
    <div class="checkout-body">
      <div class="alert alert-info py-2 px-3 rounded-3 small mb-3">
        ⚡ Changes will automatically sync to the user's active session without requiring manual page refresh.
      </div>
      <div class="mb-3">
        <label class="form-label small fw-semibold">Full Name</label>
        <input type="text" class="form-control" [(ngModel)]="editFullName">
      </div>
      <div class="mb-3">
        <label class="form-label small fw-semibold">Email Address</label>
        <input type="email" class="form-control" [(ngModel)]="editEmail">
      </div>
      <div class="mb-3">
        <label class="form-label small fw-semibold">Role</label>
        <select class="form-select" [(ngModel)]="editRole">
          <option value="user">User / Member</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
      <div class="d-flex gap-2 justify-content-end mt-4">
        <button type="button" class="btn btn-light rounded-pill px-4" (click)="showEditUserModal = false">Cancel</button>
        <button type="button" class="btn btn-primary rounded-pill px-4 fw-bold" (click)="saveEditUser()">Save Changes</button>
      </div>
    </div>
  </div>
</div>

<!-- ================= HOST MEETING MODAL (₹100) ================= -->
<div class="checkout-backdrop" *ngIf="showHostMeetingModal" (click)="showHostMeetingModal = false" style="z-index: 5000;">
  <div class="checkout-card" (click)="$event.stopPropagation()">
    <div class="checkout-header">
      <div>
        <span class="eyebrow text-uppercase">ADMIN INSTANT HOST</span>
        <h4 class="mb-0 mt-1">Host Meeting (₹100)</h4>
      </div>
      <button type="button" class="btn-close-checkout" (click)="showHostMeetingModal = false">✕</button>
    </div>
    <div class="checkout-body">
      <div class="mb-3">
        <label class="form-label small fw-semibold">Meeting Title *</label>
        <input type="text" class="form-control" [(ngModel)]="newMeetingTitle" placeholder="e.g. Executive Strategy & Team Sync">
      </div>
      <div class="mb-3">
        <label class="form-label small fw-semibold">Hosting / Registration Fee (₹)</label>
        <input type="number" class="form-control" [(ngModel)]="newMeetingPrice" min="0" step="10">
      </div>
      <div class="mb-3">
        <label class="form-label small fw-semibold">Schedule Time (Optional)</label>
        <input type="datetime-local" class="form-control" [(ngModel)]="newMeetingScheduledAt">
      </div>
      <div class="p-3 bg-light rounded-3 mb-3 small text-muted">
        ✦ As Administrator, creating this room instantly publishes it and registers full access with no payment barriers.
      </div>
      <div class="d-flex gap-2 justify-content-end mt-4">
        <button type="button" class="btn btn-light rounded-pill px-4" (click)="showHostMeetingModal = false">Cancel</button>
        <button type="button" class="btn btn-primary rounded-pill px-4 fw-bold" [disabled]="!newMeetingTitle.trim() || hostingBusy" (click)="createAdminMeeting()">
          {{ hostingBusy ? 'Creating...' : '＋ Create & Launch Meeting' }}
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ================= EDIT MEETING MODAL ================= -->
<div class="checkout-backdrop" *ngIf="showEditMeetingModal" (click)="showEditMeetingModal = false" style="z-index: 5000;">
  <div class="checkout-card" (click)="$event.stopPropagation()">
    <div class="checkout-header">
      <div>
        <span class="eyebrow text-uppercase">ADMIN ROOM MANAGEMENT</span>
        <h4 class="mb-0 mt-1">Edit Meeting Details</h4>
      </div>
      <button type="button" class="btn-close-checkout" (click)="showEditMeetingModal = false">✕</button>
    </div>
    <div class="checkout-body">
      <div class="mb-3">
        <label class="form-label small fw-semibold">Meeting Title</label>
        <input type="text" class="form-control" [(ngModel)]="editMeetingTitle">
      </div>
      <div class="mb-3">
        <label class="form-label small fw-semibold">Hosting / Registration Fee (₹)</label>
        <input type="number" class="form-control" [(ngModel)]="editMeetingPrice" min="0" step="10">
      </div>
      <div class="d-flex gap-2 justify-content-end mt-4">
        <button type="button" class="btn btn-light rounded-pill px-4" (click)="showEditMeetingModal = false">Cancel</button>
        <button type="button" class="btn btn-primary rounded-pill px-4 fw-bold" (click)="saveEditMeeting()">Save Changes</button>
      </div>
    </div>
  </div>
</div>

<!-- ================= CENTER DELETE USER CONFIRMATION MODAL ================= -->
<div class="checkout-backdrop" *ngIf="showDeleteUserModal" (click)="showDeleteUserModal = false" style="z-index: 6000;">
  <div class="checkout-card" (click)="$event.stopPropagation()" style="max-width: 480px;">
    <div class="checkout-header" style="background: #fff1f2; border-bottom: 1px solid #ffe4e6;">
      <div class="d-flex align-items-center gap-2">
        <span class="fs-4 text-danger">⚠️</span>
        <div>
          <span class="eyebrow text-danger text-uppercase fw-bold">ADMIN ACTION CONFIRMATION</span>
          <h4 class="mb-0 text-danger fs-5">Delete User Account</h4>
        </div>
      </div>
      <button type="button" class="btn-close-checkout" (click)="showDeleteUserModal = false">✕</button>
    </div>
    <div class="checkout-body p-4 text-center">
      <div class="rounded-circle d-inline-flex align-items-center justify-content-center bg-danger-subtle text-danger mb-3" style="width: 64px; height: 64px; font-size: 28px;">
        🗑
      </div>
      <h5 class="fw-bold mb-2 text-dark">Are you sure you want to delete this user?</h5>
      <p class="text-muted mb-3" *ngIf="userToDelete">
        User: <b class="text-dark">{{ userToDelete.fullName }}</b><br>
        Email: <span class="text-primary">{{ userToDelete.email }}</span> (ID: <code>#{{ userToDelete.id }}</code>)
      </p>
      <div class="alert alert-danger py-2 px-3 rounded-3 small text-start mb-4" style="background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b;">
        <b>⚠️ Permanent Database Action:</b><br>
        This will permanently delete this user, their hosted meetings, notes, contacts, and payment history from MySQL. Their active session will automatically log out.
      </div>
      <div class="d-flex gap-2 justify-content-center">
        <button type="button" class="btn btn-light rounded-pill px-4 fw-semibold" (click)="showDeleteUserModal = false">
          Cancel
        </button>
        <button type="button" class="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" [disabled]="deleteBusy" (click)="confirmDeleteUser()">
          {{ deleteBusy ? 'Deleting...' : '🗑 Yes, Delete User' }}
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ================= CENTER DELETE MEETING CONFIRMATION MODAL ================= -->
<div class="checkout-backdrop" *ngIf="showDeleteMeetingModal" (click)="showDeleteMeetingModal = false" style="z-index: 6000;">
  <div class="checkout-card" (click)="$event.stopPropagation()" style="max-width: 480px;">
    <div class="checkout-header" style="background: #fff1f2; border-bottom: 1px solid #ffe4e6;">
      <div class="d-flex align-items-center gap-2">
        <span class="fs-4 text-danger">⚠️</span>
        <div>
          <span class="eyebrow text-danger text-uppercase fw-bold">ADMIN ACTION CONFIRMATION</span>
          <h4 class="mb-0 text-danger fs-5">Delete Meeting Room</h4>
        </div>
      </div>
      <button type="button" class="btn-close-checkout" (click)="showDeleteMeetingModal = false">✕</button>
    </div>
    <div class="checkout-body p-4 text-center">
      <div class="rounded-circle d-inline-flex align-items-center justify-content-center bg-danger-subtle text-danger mb-3" style="width: 64px; height: 64px; font-size: 28px;">
        🚪
      </div>
      <h5 class="fw-bold mb-2 text-dark">Delete this meeting room?</h5>
      <p class="text-muted mb-3" *ngIf="meetingToDelete">
        Room Title: <b class="text-dark">{{ meetingToDelete.title }}</b><br>
        Room Code: <code>{{ meetingToDelete.meetingCode }}</code>
      </p>
      <div class="alert alert-warning py-2 px-3 rounded-3 small text-start mb-4">
        Participants will immediately lose access to this room lobby.
      </div>
      <div class="d-flex gap-2 justify-content-center">
        <button type="button" class="btn btn-light rounded-pill px-4 fw-semibold" (click)="showDeleteMeetingModal = false">
          Cancel
        </button>
        <button type="button" class="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" [disabled]="deleteBusy" (click)="confirmDeleteMeeting()">
          {{ deleteBusy ? 'Deleting...' : '🗑 Delete Room' }}
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ================= CENTER ROLE CHANGE MODAL ================= -->
<div class="checkout-backdrop" *ngIf="showRoleChangeModal" (click)="showRoleChangeModal = false" style="z-index: 6000;">
  <div class="checkout-card" (click)="$event.stopPropagation()" style="max-width: 460px;">
    <div class="checkout-header">
      <div>
        <span class="eyebrow text-uppercase">USER PERMISSIONS</span>
        <h4 class="mb-0 mt-1">Switch Account Role</h4>
      </div>
      <button type="button" class="btn-close-checkout" (click)="showRoleChangeModal = false">✕</button>
    </div>
    <div class="checkout-body p-4 text-center" *ngIf="roleUserToChange">
      <div class="rounded-circle d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary mb-3" style="width: 56px; height: 56px; font-size: 24px;">
        🛡
      </div>
      <h5 class="fw-bold mb-2 text-dark">Change {{ roleUserToChange.fullName }}'s role?</h5>
      <p class="text-muted mb-3">
        Current Role: <span class="badge bg-secondary">{{ roleUserToChange.role | uppercase }}</span><br>
        New Role: <span class="badge bg-primary fs-6 mt-1">{{ targetRole | uppercase }}</span>
      </p>
      <div class="d-flex gap-2 justify-content-center mt-3">
        <button type="button" class="btn btn-light rounded-pill px-4" (click)="showRoleChangeModal = false">
          Cancel
        </button>
        <button type="button" class="btn btn-primary rounded-pill px-4 fw-bold" (click)="confirmRoleChange()">
          Confirm Role Change
        </button>
      </div>
    </div>
  </div>
</div>


`
})
export class AdminComponent implements OnInit, OnDestroy {
  api = inject(ApiService);
  session = inject(SessionService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  users: any[] = [];
  meetings: any[] = [];
  payments: any[] = [];


  userSearch = '';
  meetingSearch = '';
  feedbackMessage = '';
  announcementText = '';
  adminLogTitle = '';
  adminLogDetails = '';
  adminLogItems: { title: string; details: string; resolved: boolean; createdAt: string }[] = [];

  private get adminLogStorageKey(): string {
    const identity = this.session.user?.id ?? this.session.user?.email ?? 'admin';
    return `ms_admin_decision_log_${encodeURIComponent(String(identity).toLowerCase())}`;
  }

  loadAdminLog() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.adminLogStorageKey) || '[]');
      this.adminLogItems = Array.isArray(saved) ? saved.filter((item: any) => item && typeof item.title === 'string').map((item: any) => ({ title: item.title.slice(0, 140), details: String(item.details || '').slice(0, 300), resolved: Boolean(item.resolved), createdAt: String(item.createdAt || '') })) : [];
    } catch { this.adminLogItems = []; }
  }

  saveAdminLog() {
    try { localStorage.setItem(this.adminLogStorageKey, JSON.stringify(this.adminLogItems)); } catch { this.showFeedback('Browser storage is unavailable. Export your admin log to keep a copy.'); }
  }

  addAdminLogItem() {
    const title = this.adminLogTitle.trim();
    if (!title) return;
    this.adminLogItems = [{ title, details: this.adminLogDetails.trim(), resolved: false, createdAt: new Date().toLocaleString() }, ...this.adminLogItems];
    this.adminLogTitle = ''; this.adminLogDetails = ''; this.saveAdminLog();
  }

  toggleAdminLogItem(index: number) {
    if (!this.adminLogItems[index]) return;
    this.adminLogItems[index].resolved = !this.adminLogItems[index].resolved; this.saveAdminLog();
  }

  removeAdminLogItem(index: number) { this.adminLogItems.splice(index, 1); this.saveAdminLog(); }

  exportAdminLog() {
    const lines = ['MeetSphere Admin Decision & Incident Log', `Admin: ${this.session.user?.fullName || this.session.user?.email || 'Administrator'}`, `Exported: ${new Date().toLocaleString()}`, '', ...this.adminLogItems.map((item, i) => `${i + 1}. [${item.resolved ? 'RESOLVED' : 'OPEN'}] ${item.title}\n   Notes: ${item.details || 'None'}\n   Added: ${item.createdAt}`)];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `meetsphere-admin-log-${new Date().toISOString().slice(0, 10)}.txt`; anchor.click(); URL.revokeObjectURL(url);
  }

  // Select / View User Details State
  showUserDetailsModal = false;
  selectedUser: any = null;

  // Edit User State
  showEditUserModal = false;
  editingUser: any = null;
  editFullName = '';
  editEmail = '';
  editRole = 'user';

  // Host Meeting State
  showHostMeetingModal = false;
  newMeetingTitle = '';
  newMeetingPrice = 100;
  newMeetingScheduledAt = '';
  hostingBusy = false;

  // Edit Meeting State
  showEditMeetingModal = false;
  editingMeeting: any = null;
  editMeetingTitle = '';
  editMeetingPrice = 100;

  // Center Delete User Modal State
  showDeleteUserModal = false;
  userToDelete: any = null;
  deleteBusy = false;

  // Center Delete Meeting Modal State
  showDeleteMeetingModal = false;
  meetingToDelete: any = null;

  // Center Role Change Modal State
  showRoleChangeModal = false;
  roleUserToChange: any = null;
  targetRole = 'user';

  private refreshTimer: any;

  getUserInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  viewUserDetails(u: any) {
    this.selectedUser = u;
    this.showUserDetailsModal = true;
  }

  openHostMeetingModal() {
    this.newMeetingTitle = '';
    this.newMeetingPrice = 100;
    this.newMeetingScheduledAt = '';
    this.showHostMeetingModal = true;
  }

  createAdminMeeting() {
    if (!this.newMeetingTitle.trim()) return;
    this.hostingBusy = true;

    const payload: any = {
      title: this.newMeetingTitle.trim(),
      price: Number(this.newMeetingPrice) || 0
    };
    if (this.newMeetingScheduledAt) {
      payload.scheduledAt = new Date(this.newMeetingScheduledAt).toISOString();
    }

    this.api.createMeeting(payload).subscribe({
      next: (res: any) => {
        this.hostingBusy = false;
        this.showHostMeetingModal = false;
        this.showFeedback(`Meeting "${res.title || this.newMeetingTitle}" created successfully! Code: ${res.meetingCode}`);
        this.load();
        if (res.meetingCode) {
          this.router.navigate(['/room', res.meetingCode]);
        }
      },
      error: (err) => {
        this.hostingBusy = false;
        this.showFeedback(err.error?.message || 'Could not create meeting room.');
      }
    });
  }

  openEditUser(u: any) {
    this.editingUser = u;
    this.editFullName = u.fullName;
    this.editEmail = u.email;
    this.editRole = u.role;
    this.showEditUserModal = true;
  }

  saveEditUser() {
    if (!this.editingUser || !this.editFullName.trim() || !this.editEmail.trim()) return;

    this.api.editUser(this.editingUser.id, {
      fullName: this.editFullName.trim(),
      email: this.editEmail.trim(),
      role: this.editRole
    }).subscribe({
      next: (r: any) => {
        this.showEditUserModal = false;
        this.showFeedback(r.message || 'User details updated. Active session will auto-sync.');
        this.load();
        if (this.selectedUser && this.selectedUser.id === this.editingUser.id) {
          this.selectedUser.fullName = this.editFullName.trim();
          this.selectedUser.email = this.editEmail.trim();
          this.selectedUser.role = this.editRole;
        }
      },
      error: (err) => this.showFeedback(err.error?.message || 'Failed to update user.')
    });
  }

  openEditMeeting(m: any) {
    this.editingMeeting = m;
    this.editMeetingTitle = m.title;
    this.editMeetingPrice = m.price || 100;
    this.showEditMeetingModal = true;
  }

  saveEditMeeting() {
    if (!this.editingMeeting || !this.editMeetingTitle.trim()) return;

    this.api.editMeeting(this.editingMeeting.id, {
      title: this.editMeetingTitle.trim(),
      price: Number(this.editMeetingPrice)
    }).subscribe({
      next: (r: any) => {
        this.showEditMeetingModal = false;
        this.showFeedback(r.message || 'Meeting updated successfully.');
        this.load();
      },
      error: (err) => this.showFeedback(err.error?.message || 'Failed to update meeting.')
    });
  }

  exportAuditReport() {
    const rows: any[][] = [
      ['Record type', 'ID', 'Name / Title', 'Email / Meeting code', 'Role / Status', 'Amount (INR)', 'Date']
    ];
    this.users.forEach(u => rows.push([
      'USER', u.id ?? '', u.fullName || '', u.email || '', u.role || 'user', '', u.createdAt || ''
    ]));
    this.meetings.forEach(m => rows.push([
      'MEETING', m.id ?? '', m.title || '', m.meetingCode || '', m.host || '', Number(m.price || 0), m.createdAt || m.scheduledAt || ''
    ]));
    this.payments.forEach(p => rows.push([
      'PAYMENT', p.id ?? p.paymentId ?? '', p.userName || p.fullName || p.meetingTitle || '', p.email || p.orderId || '', p.paymentStatus || '', Number(p.amount || 0), p.createdAt || p.paidAt || ''
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
    anchor.download = `meetsphere-admin-audit-${new Date().toISOString().slice(0,10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.showFeedback('Audit CSV exported with the currently loaded users, rooms, and payment records.');
  }

  get unpaidPaymentCount() {
    return this.payments.filter(p => String(p.paymentStatus || '').trim().toLowerCase() !== 'paid').length;
  }

  get roomsMissingCodeCount() {
    return this.meetings.filter(m => !String(m.meetingCode || '').trim()).length;
  }

  get usersMissingEmailCount() {
    return this.users.filter(u => !String(u.email || '').trim()).length;
  }

  get adminCount() {
    return this.users.filter(u => u.role === 'admin').length;
  }

  get paidPaymentCount() {
    return this.payments.filter(p => p.paymentStatus === 'Paid').length;
  }

  get totalRevenue() {
    return this.payments
      .filter(p => p.paymentStatus === 'Paid')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
  }

  get filteredUsers() {
    if (!this.userSearch.trim()) return this.users;
    const q = this.userSearch.trim().toLowerCase();
    return this.users.filter(u =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }

  get filteredMeetings() {
    if (!this.meetingSearch.trim()) return this.meetings;
    const q = this.meetingSearch.trim().toLowerCase();
    return this.meetings.filter(m =>
      (m.title || '').toLowerCase().includes(q) ||
      (m.host || '').toLowerCase().includes(q) ||
      (m.meetingCode || '').toLowerCase().includes(q)
    );
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

    this.load();
    this.loadAdminLog();

    this.route.fragment.subscribe(frag => {
      if (frag) {
        setTimeout(() => {
          const el = document.getElementById(frag);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 250);
      }
    });

    // Auto-refresh admin console so changes made by users appear promptly
    this.refreshTimer = setInterval(() => {
      this.load();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  load() {
    this.api.users().subscribe({ next: x => this.users = x || [] });
    this.api.meetings().subscribe({ next: x => this.meetings = x || [] });
    this.api.adminPayments().subscribe({ next: x => this.payments = x || [] });

  }

  launchZoom(m: any) {
    const code = String(m?.meetingCode || '').trim();
    const digitsOnly = code.replace(/[-\s]/g, '');
    if (/^\d{9,11}$/.test(digitsOnly)) {
      window.open(`https://zoom.us/j/${digitsOnly}`, '_blank');
    } else {
      window.open('https://zoom.us/start/videomeeting', '_blank');
    }
  }

  publishAnnouncement() {
    const text = this.announcementText.trim();
    if (text.length < 3 || text.length > 500) {
      this.showFeedback('Announcement must contain 3 to 500 characters.');
      return;
    }
    this.api.publishAnnouncement(text).subscribe({
      next: (result: any) => {
        this.announcementText = '';
        this.showFeedback(result?.message || 'Announcement published to all users.');
      },
      error: (err: any) => this.showFeedback(err?.error?.message || 'Could not publish announcement. Check admin login and API connection.')
    });
  }

  // Open Center Role Change Modal (NO localhost confirm popup)
  promptToggleRole(u: any) {
    this.roleUserToChange = u;
    this.targetRole = u.role === 'admin' ? 'user' : 'admin';
    this.showRoleChangeModal = true;
  }

  confirmRoleChange() {
    if (!this.roleUserToChange) return;
    const user = this.roleUserToChange;
    const newRole = this.targetRole;
    this.api.updateUserRole(user.id, newRole).subscribe({
      next: (r: any) => {
        this.showRoleChangeModal = false;
        this.showFeedback(r.message || `User "${user.fullName}" role updated to ${newRole.toUpperCase()}.`);
        this.load();
        if (this.selectedUser && this.selectedUser.id === user.id) {
          this.selectedUser.role = newRole;
        }
        this.roleUserToChange = null;
      },
      error: (err) => {
        this.showRoleChangeModal = false;
        this.showFeedback(err.error?.message || 'Could not update role.');
      }
    });
  }

  // Open Center Delete User Modal (NO localhost confirm popup)
  promptDeleteUser(u: any) {
    this.userToDelete = u;
    this.showDeleteUserModal = true;
  }

  confirmDeleteUser() {
    if (!this.userToDelete) return;
    this.deleteBusy = true;
    const deletedName = this.userToDelete.fullName;
    const deletedId = this.userToDelete.id;

    this.api.deleteUser(deletedId).subscribe({
      next: (r: any) => {
        this.deleteBusy = false;
        this.showDeleteUserModal = false;
        this.showFeedback(r.message || `User "${deletedName}" permanently deleted from MySQL database.`);
        if (this.selectedUser && this.selectedUser.id === deletedId) {
          this.selectedUser = null;
          this.showUserDetailsModal = false;
        }
        this.userToDelete = null;
        this.load();
      },
      error: (err) => {
        this.deleteBusy = false;
        this.showFeedback(err.error?.message || 'Could not delete user.');
      }
    });
  }

  // Open Center Delete Meeting Modal (NO localhost confirm popup)
  promptDeleteMeeting(m: any) {
    this.meetingToDelete = m;
    this.showDeleteMeetingModal = true;
  }

  confirmDeleteMeeting() {
    if (!this.meetingToDelete) return;
    this.deleteBusy = true;
    const title = this.meetingToDelete.title;
    const id = this.meetingToDelete.id;

    this.api.deleteMeeting(id).subscribe({
      next: () => {
        this.deleteBusy = false;
        this.showDeleteMeetingModal = false;
        this.showFeedback(`Meeting room "${title}" deleted successfully.`);
        this.meetingToDelete = null;
        this.load();
      },
      error: (err) => {
        this.deleteBusy = false;
        this.showFeedback(err.error?.message || 'Could not delete meeting.');
      }
    });
  }

  showFeedback(msg: string) {
    this.feedbackMessage = msg;
    setTimeout(() => this.feedbackMessage = '', 3500);
  }

  scrollTo(id: string, e: Event) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}
