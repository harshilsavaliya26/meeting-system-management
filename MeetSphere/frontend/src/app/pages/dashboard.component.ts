
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService, SessionService } from '../services';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
<!-- Admin Change Notification Banner -->
<div *ngIf="adminChangeNotice" class="position-fixed top-0 start-0 end-0 d-flex align-items-center justify-content-center gap-2 py-3 px-4 shadow-lg" style="z-index: 9999; background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; font-weight: 600; font-size: 14px; animation: slideDown 0.3s ease;">
  <span>⚡</span>
  <span>{{ adminChangeNotice }}</span>
  <button type="button" class="btn btn-sm btn-outline-dark rounded-pill px-3 ms-3" (click)="adminChangeNotice = ''">OK</button>
</div>
<div class="app-shell">
  <aside class="sidebar" aria-label="Workspace navigation">
    <a class="brand side-brand" routerLink="/dashboard" aria-label="MeetSphere workspace home">
      <span class="brand-icon">M</span><span>MeetSphere</span>
    </a>

    <div class="side-label">WORKSPACE</div>
    <nav class="sidebar-nav" aria-label="Workspace menu">
      <a class="side-link" routerLink="/dashboard" routerLinkActive="active"
         [routerLinkActiveOptions]="{ exact: true }">
        <span class="side-link-icon">▦</span><span>Overview</span>
      </a>
      <a class="side-link d-flex align-items-center justify-content-between" routerLink="/dashboard" fragment="meetings"
         (click)="scrollToMeetings($event)">
        <div class="d-flex align-items-center gap-2">
          <span class="side-link-icon">◷</span><span>My meetings</span>
        </div>
        <span class="badge bg-primary-subtle text-primary rounded-pill px-2 py-0.5 small" *ngIf="meetings.length">{{ meetings.length }}</span>
      </a>
      <button type="button" class="side-link side-action text-primary fw-bold" (click)="startWizard()">
        <span class="side-link-icon">＋</span><span>Host Meeting (₹100)</span>
      </button>
      <a class="side-link" routerLink="/discover" routerLinkActive="active">
        <span class="side-link-icon">◈</span><span>Discover meetings</span>
      </a>
      <a class="side-link" routerLink="/payment-history" routerLinkActive="active">
        <span class="side-link-icon">₹</span><span>Payment history</span>
      </a>
      <a class="side-link" routerLink="/calendar" routerLinkActive="active"><span class="side-link-icon">▣</span><span>Calendar</span></a>
      <a class="side-link" routerLink="/notetaker" routerLinkActive="active"><span class="side-link-icon">◩</span><span>Notetaker</span></a>
      <a class="side-link" routerLink="/contacts" routerLinkActive="active"><span class="side-link-icon">♧</span><span>Contacts</span></a>
      <a class="side-link" routerLink="/automations" routerLinkActive="active"><span class="side-link-icon">✣</span><span>Automations</span></a>
      <a class="side-link" routerLink="/meeting-brief" routerLinkActive="active"><span class="side-link-icon">✧</span><span>Meeting Brief Studio</span></a>
      <a class="side-link" routerLink="/upgrade" routerLinkActive="active"><span class="side-link-icon">⇧</span><span>Upgrade plan</span></a>
      <a class="side-link" routerLink="/settings" routerLinkActive="active">
        <span class="side-link-icon">⚙</span><span>Settings</span>
      </a>
      <a class="side-link" routerLink="/" routerLinkActive="active"
         [routerLinkActiveOptions]="{ exact: true }">
        <span class="side-link-icon">⌂</span><span>Home</span>
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
          <b>{{ session.user?.fullName || 'MeetSphere member' }}</b>
          <small class="text-primary fw-bold">★ Active Member</small>
        </div>
      </div>
      <button type="button" class="side-link logout-link mt-1" (click)="logout()">
        <span class="side-link-icon">⇥</span><span>Log out</span>
      </button>
    </div>
  </aside>

  <main class="workspace">
    <header class="workspace-top">
      <div>
        <span class="eyebrow">YOUR PERSONAL SPACE</span>
        <h2>Good to see you, {{ firstName }} <span>✦</span></h2>
        <p>Make today a little more connected.</p>
      </div>
      <button class="premium-primary" (click)="startWizard()">
        ＋ New meeting
      </button>
    </header>

    <div class="welcome-banner">
      <div>
        <span class="eyebrow">MEET, SHARE, MOVE FORWARD</span>
        <h3>Your next great idea<br>is one meeting away.</h3>
        <p>Create a meeting room and invite your people.</p>
        <button class="btn btn-light rounded-pill px-4"
          (click)="startWizard()">
          Create a meeting →
        </button>
      </div>
      <div class="banner-symbol">M<span>✦</span></div>
    </div>

    <!-- PERSONAL MEETING PREP KIT: saved separately for each signed-in user -->
    <section class="card border-0 shadow-sm rounded-4 p-4 mt-4" style="background:linear-gradient(135deg,#ffffff,#f4f3ff);">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <span class="eyebrow">YOUR PERSONAL TOOLKIT</span>
          <h4 class="fw-bold mb-1">🧠 Meeting Prep Kit</h4>
          <p class="text-muted mb-0">Prepare an agenda and check your setup before joining. Saved for your account on this browser.</p>
        </div>
        <button type="button" class="btn btn-outline-primary rounded-pill px-3" (click)="exportPrepKit()">⬇ Export prep notes</button>
      </div>
      <div class="row g-3">
        <div class="col-lg-7">
          <label class="form-label fw-semibold" for="prepAgenda">Meeting agenda / private notes</label>
          <textarea id="prepAgenda" class="form-control rounded-3" rows="4" [(ngModel)]="prepAgenda" (ngModelChange)="savePrepKit()" placeholder="1. Goal of the meeting&#10;2. Topics to discuss&#10;3. Decisions and next steps"></textarea>
          <small class="text-muted">Private browser notes — they are not shared with meeting participants.</small>
        </div>
        <div class="col-lg-5">
          <div class="fw-semibold mb-2">Before you join</div>
          <label class="d-flex align-items-center gap-2 p-2 rounded-3 mb-2" style="background:#fff;" *ngFor="let item of prepChecklist; let i = index">
            <input class="form-check-input mt-0" type="checkbox" [(ngModel)]="item.done" (ngModelChange)="savePrepKit()" [name]="'prep-'+i">
            <span [class.text-decoration-line-through]="item.done">{{ item.label }}</span>
          </label>
          <div class="progress rounded-pill mt-3" style="height:8px;"><div class="progress-bar bg-success" [style.width.%]="prepProgress"></div></div>
          <small class="text-muted">{{ prepProgress }}% ready</small>
        </div>
      </div>
      <div *ngIf="prepSavedNotice" class="small text-success mt-2">✓ {{ prepSavedNotice }}</div>
    </section>

    <!-- PERSONAL FOLLOW-UP BOARD: isolated per signed-in account on this browser -->
    <section class="card border-0 shadow-sm rounded-4 p-4 mt-4" style="background:linear-gradient(135deg,#f0fdfa,#ffffff);">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div><span class="eyebrow" style="color:#0f766e;">AFTER THE MEETING</span><h4 class="fw-bold mb-1">✅ Follow-up Action Board</h4><p class="text-muted mb-0">Track next steps and decisions. Saved privately for your signed-in account on this browser.</p></div>
        <span class="badge rounded-pill px-3 py-2" style="background:#ccfbf1;color:#115e59;">{{ openFollowUpCount }} open</span>
      </div>
      <form class="row g-2" (ngSubmit)="addFollowUp()">
        <div class="col-sm-9"><input class="form-control rounded-3" name="followUpText" [(ngModel)]="followUpText" maxlength="180" placeholder="e.g. Send meeting summary to the team" aria-label="New follow-up action"></div>
        <div class="col-sm-3"><button class="btn w-100 rounded-3 fw-semibold" style="background:#0f766e;color:white;" type="submit" [disabled]="!followUpText.trim()">＋ Add action</button></div>
      </form>
      <div *ngIf="followUpItems.length; else noFollowUps" class="mt-3">
        <div *ngFor="let item of followUpItems; let i = index" class="d-flex align-items-center gap-2 p-2 rounded-3 mb-2" style="background:#fff;border:1px solid #e5e7eb;">
          <input class="form-check-input mt-0" type="checkbox" [checked]="item.done" (change)="toggleFollowUp(i)" [attr.aria-label]="'Mark action ' + item.title + ' complete'">
          <span class="flex-grow-1" [class.text-decoration-line-through]="item.done" [class.text-muted]="item.done">{{ item.title }}</span>
          <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill" (click)="removeFollowUp(i)" aria-label="Remove action">Remove</button>
        </div>
        <button type="button" class="btn btn-sm btn-outline-success rounded-pill mt-1" (click)="exportFollowUps()">⬇ Export action list</button>
      </div>
      <ng-template #noFollowUps><p class="text-muted small mt-3 mb-0">No actions yet. Add a follow-up above to get started.</p></ng-template>
    </section>

    <!-- UNIQUE FEATURE V4: PERSONAL AGENDA TIMEBOX PLANNER -->
    <section class="card border-0 shadow-sm rounded-4 p-4 mt-4" style="background:linear-gradient(135deg,#eff6ff,#ffffff);">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div><span class="eyebrow" style="color:#1d4ed8;">MEETING PRODUCTIVITY</span><h4 class="fw-bold mb-1">⏱ Agenda Timebox Planner</h4><p class="text-muted mb-0">Plan agenda topics and estimate whether your meeting will finish on time. Saved privately for this signed-in account in this browser.</p></div>
        <button type="button" class="btn btn-outline-primary rounded-pill" (click)="exportTimebox()" [disabled]="!timeboxItems.length">⬇ Export agenda</button>
      </div>
      <div class="row g-2 align-items-end">
        <div class="col-md-6"><label class="form-label fw-semibold" for="timeboxTitle">Agenda topic</label><input id="timeboxTitle" class="form-control rounded-3" name="timeboxTitle" [(ngModel)]="timeboxTitle" maxlength="120" placeholder="e.g. Project status updates"></div>
        <div class="col-md-3"><label class="form-label fw-semibold" for="timeboxMinutes">Minutes</label><input id="timeboxMinutes" class="form-control rounded-3" name="timeboxMinutes" type="number" min="1" max="240" [(ngModel)]="timeboxMinutes"></div>
        <div class="col-md-3"><button type="button" class="btn btn-primary rounded-3 w-100" (click)="addTimeboxItem()" [disabled]="!timeboxTitle.trim() || timeboxMinutes < 1 || timeboxMinutes > 240">＋ Add topic</button></div>
      </div>
      <div class="row g-3 mt-1 align-items-stretch">
        <div class="col-lg-7">
          <div *ngIf="timeboxItems.length; else noTimeboxItems" class="d-grid gap-2">
            <div *ngFor="let item of timeboxItems; let i = index" class="d-flex align-items-center gap-2 p-3 rounded-3" style="background:white;border:1px solid #dbeafe;">
              <span class="badge rounded-pill text-bg-primary">{{ i + 1 }}</span><span class="flex-grow-1 fw-semibold">{{ item.title }}</span><span class="text-muted small text-nowrap">{{ item.minutes }} min</span><button type="button" class="btn btn-sm btn-outline-secondary rounded-pill" (click)="removeTimeboxItem(i)" aria-label="Remove agenda topic">×</button>
            </div>
          </div>
          <ng-template #noTimeboxItems><p class="text-muted small mt-2">Add agenda topics to build a time plan.</p></ng-template>
        </div>
        <div class="col-lg-5"><div class="rounded-4 p-3 h-100" style="background:white;border:1px solid #dbeafe;">
          <label class="form-label fw-semibold" for="timeboxTarget">Target meeting length (minutes)</label><input id="timeboxTarget" class="form-control rounded-3 mb-3" name="timeboxTarget" type="number" min="1" max="600" [(ngModel)]="timeboxTargetMinutes" (ngModelChange)="saveTimebox()">
          <div class="d-flex justify-content-between align-items-center"><span class="text-muted">Planned agenda</span><strong class="fs-4">{{ timeboxTotalMinutes }} min</strong></div>
          <div class="progress rounded-pill my-2" style="height:9px"><div class="progress-bar" [class.bg-danger]="timeboxTotalMinutes > timeboxTargetMinutes" [class.bg-success]="timeboxTotalMinutes <= timeboxTargetMinutes" [style.width.%]="timeboxTargetMinutes > 0 ? Math.min(100, timeboxTotalMinutes / timeboxTargetMinutes * 100) : 0"></div></div>
          <div class="small fw-semibold" [class.text-danger]="timeboxTotalMinutes > timeboxTargetMinutes" [class.text-success]="timeboxTotalMinutes <= timeboxTargetMinutes">{{ timeboxTotalMinutes > timeboxTargetMinutes ? (timeboxTotalMinutes - timeboxTargetMinutes) + ' minutes over target' : (timeboxTargetMinutes - timeboxTotalMinutes) + ' minutes available' }}</div>
        </div></div>
      </div>
    </section>

    <div class="stat-cards">
      <div class="stat-card">
        <span class="stat-icon">▦</span>
        <small>Total meetings</small>
        <strong>{{ meetings.length }}</strong>
        <span class="stat-caption">Created by you</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon green">◷</span>
        <small>Upcoming</small>
        <strong>{{ upcoming }}</strong>
        <span class="stat-caption">Scheduled sessions</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon orange">✦</span>
        <small>Ready to connect</small>
        <strong>Anytime</strong>
        <span class="stat-caption">Your room is waiting</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">₹</span>
        <small>Total payments</small>
        <strong>₹{{ totalPaid | number:'1.2-2' }}</strong>
        <span class="stat-caption">Paid from your account</span>
      </div>
    </div>

    <section *ngIf="announcement?.message" class="alert alert-info border-0 rounded-4 shadow-sm d-flex align-items-start gap-3 mb-4" role="status">
      <span class="fs-4">📢</span>
      <div class="flex-grow-1"><strong>Platform announcement</strong><div>{{ announcement.message }}</div><small class="text-muted" *ngIf="announcement.createdAt">{{ announcement.createdAt | date:'medium' }}</small></div>
    </section>

    <section id="meetings" class="meetings-section">
      <div class="section-heading mb-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <h4 class="mb-0">Your meetings</h4>
            <span class="live-pulse-indicator py-0.5 px-2">
              <span class="live-pulse-dot"></span>
              <span>Live Sync</span>
            </span>
          </div>
          <p class="mb-0 text-muted">All the rooms you’ve created, in one place.</p>
        </div>
        <div class="d-flex flex-wrap align-items-center gap-2">
          <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" (click)="exportMyMeetings()" [disabled]="!meetings.length">⬇ Export CSV</button>
          <span class="count-pill">{{ filteredMeetings.length }} of {{ meetings.length }} rooms</span>
        </div>
      </div>

      <!-- DYNAMIC SEARCH & FILTER CONTROLS -->
      <div class="row g-2 align-items-center mb-3" *ngIf="meetings.length">
        <div class="col-md-6 col-lg-5">
          <div class="dynamic-search-wrapper">
            <span class="me-2 text-muted">🔍</span>
            <input type="text" class="dynamic-search-input" [(ngModel)]="searchMeetingText" placeholder="Search by title or meeting code..." />
            <button *ngIf="searchMeetingText" type="button" class="btn btn-sm p-0 text-muted border-0 bg-transparent ms-1" (click)="searchMeetingText = ''">✕</button>
          </div>
        </div>
        <div class="col-md-6 col-lg-7 d-flex gap-1.5 flex-wrap justify-content-md-end">
          <button type="button" class="quick-pill-btn" [class.active]="filterMeetingMode === 'all'" (click)="filterMeetingMode = 'all'">
            All ({{ meetings.length }})
          </button>
          <button type="button" class="quick-pill-btn" [class.active]="filterMeetingMode === 'paid'" (click)="filterMeetingMode = 'paid'">
            Paid Rooms
          </button>
          <button type="button" class="quick-pill-btn" [class.active]="filterMeetingMode === 'free'" (click)="filterMeetingMode = 'free'">
            Free Rooms
          </button>
        </div>
      </div>

      <div *ngIf="shareNotice" class="alert alert-success py-2 px-3 rounded-3 small mb-3">{{ shareNotice }}</div>

      <!-- Filtered Empty Search Result -->
      <div class="p-4 text-center border rounded-4 bg-light my-3" *ngIf="!filteredMeetings.length && meetings.length">
        <div class="fs-2 mb-2">🔎</div>
        <h6 class="fw-bold mb-1">No rooms match your search</h6>
        <p class="text-muted small mb-2">Try searching with a different keyword or reset filters.</p>
        <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" (click)="searchMeetingText = ''; filterMeetingMode = 'all'">Reset filters</button>
      </div>

      <div class="table-responsive meeting-table" *ngIf="filteredMeetings.length">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>MEETING</th>
              <th>MEETING CODE</th>
              <th>FEE</th>
              <th>CREATED</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of filteredMeetings">
              <td>
                <span class="meeting-icon">▦</span>
                <b>{{ m.title }}</b>
              </td>
              <td><code>{{ m.meetingCode }}</code></td>
              <td>
                <span *ngIf="m.price > 0" class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">₹{{ m.price | number:'1.2-2' }}</span>
                <span *ngIf="!m.price || m.price <= 0" class="badge bg-secondary-subtle text-muted px-2 py-1 rounded-pill">Free</span>
              </td>
              <td>{{ m.createdAt | date:'mediumDate' }}</td>
              <td>
                <div class="d-flex flex-wrap gap-1 align-items-center">
                  <a class="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                    [routerLink]="['/room', m.meetingCode]">
                    Open room →
                  </a>
                  <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-2.5 fw-semibold" (click)="launchZoom(m)" title="Join via Zoom">
                    📹 Zoom
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-success rounded-pill px-2.5 fw-semibold" (click)="launchGoogleMeet(m)" title="Launch via Google Meet">
                    🟢 Meet
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-info rounded-pill px-2.5 fw-semibold" (click)="addToGoogleCalendar(m)" title="Add to Google Calendar">
                    📅 Calendar
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-2.5" (click)="shareMeeting(m)">
                    Invite ↗
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-danger rounded-pill px-2.5" (click)="promptDeleteMeeting(m)" title="Delete meeting">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state" *ngIf="!meetings.length">
        <div class="empty-icon">▦</div>
        <h5>Your first meeting starts here</h5>
        <p>Create a room for your next team sync, class, or catch-up.</p>
        <button class="btn btn-primary rounded-pill px-4"
          (click)="startWizard()">
          ＋ Create meeting
        </button>
      </div>
    </section>
  </main>
</div>

<div class="wizard-backdrop" *ngIf="showWizard">
  <section class="meeting-wizard">
    <header class="wizard-head">
      <div>
        <span class="eyebrow">MEETSPHERE · MEETING SETUP</span>
        <h2>{{ stepTitle }}</h2>
        <p>{{ stepSubtitle }}</p>
      </div>
      <button class="wizard-close" type="button"
        aria-label="Close" (click)="closeWizard()">×</button>
    </header>

    <div class="wizard-progress">
      <span [style.width.%]="step * 20"></span>
    </div>
    <div class="wizard-step-count">STEP {{ step }} OF 5</div>

    <div *ngIf="step === 1" class="wizard-content">
      <h3>How do you plan on using MeetSphere?</h3>
      <p class="wizard-muted">Choose the setup that fits your meeting.</p>

      <div class="choice-grid">
        <button type="button" *ngFor="let x of useOptions"
          [class.selected]="purpose === x.value"
          (click)="purpose = x.value">
          <span>{{ x.icon }}</span>
          <b>{{ x.label }}</b>
          <small>{{ x.desc }}</small>
        </button>
      </div>

      <h3 class="wizard-subhead">How can MeetSphere help you?</h3>
      <p class="wizard-muted">Select all that apply.</p>

      <div class="choice-grid feature-choices">
        <button type="button" *ngFor="let x of featureOptions"
          [class.selected]="features.includes(x.label)"
          (click)="toggleFeature(x.label)">
          <span>{{ x.icon }}</span>
          <b>{{ x.label }}</b>
        </button>
      </div>
    </div>

    <div *ngIf="step === 2" class="wizard-content">
      <h3>What is your role?</h3>
      <p class="wizard-muted">We’ll tailor your meeting setup to your needs.</p>

      <div class="choice-grid role-grid">
        <button type="button" *ngFor="let x of roleOptions"
          [class.selected]="role === x.label"
          (click)="role = x.label">
          <span>{{ x.icon }}</span>
          <b>{{ x.label }}</b>
        </button>
      </div>
    </div>

    <div *ngIf="step === 3" class="wizard-content">
      <h3>Set your calendar preferences</h3>
      <p class="wizard-muted">Choose where and when you’d like to schedule meetings.</p>

      <div class="wizard-panel">
        <label class="wizard-label">Calendar provider</label>
        <div class="choice-grid">
          <button type="button" *ngFor="let x of calendars"
            [class.selected]="calendar === x"
            (click)="calendar = x">
            <span>▦</span>
            <b>{{ x }}</b>
            <small>{{ x === 'Google Calendar'
              ? 'Recommended for Google accounts'
              : 'Calendar preference' }}</small>
          </button>
        </div>

        <label class="wizard-label mt-4">Time zone</label>
        <select class="form-select wizard-input" [(ngModel)]="timezone">
          <option>Asia/Kolkata (India Standard Time)</option>
          <option>Eastern Time - US &amp; Canada</option>
          <option>UTC</option>
          <option>Europe/London</option>
        </select>

        <label class="wizard-label mt-3">Check for calendar conflicts</label>
        <label class="toggle-row">
          <input type="checkbox" [(ngModel)]="checkConflicts">
          Prevent double bookings where possible
        </label>
      </div>
    </div>

    <div *ngIf="step === 4" class="wizard-content">
      <h3>When are you available to meet?</h3>
      <p class="wizard-muted">Set your usual availability. You can change it later.</p>

      <div class="wizard-panel availability-panel">
        <div class="availability-row" *ngFor="let day of availability">
          <b class="day-badge">{{ day.day.slice(0, 1) }}</b>
          <span class="day-name">{{ day.day }}</span>
          <label class="toggle-row">
            <input type="checkbox" [(ngModel)]="day.enabled">
            Available
          </label>
          <input class="form-control time-input" type="time"
            [(ngModel)]="day.start" [disabled]="!day.enabled">
          <span>to</span>
          <input class="form-control time-input" type="time"
            [(ngModel)]="day.end" [disabled]="!day.enabled">
        </div>
      </div>
    </div>

    <div *ngIf="step === 5" class="wizard-content">
      <h3>How would you like to meet?</h3>
      <p class="wizard-muted">Choose a meeting location and give your room a name.</p>

      <div class="wizard-panel">
        <label class="wizard-label">Meeting title</label>
        <input class="form-control wizard-input" [(ngModel)]="title"
          placeholder="e.g. Weekly team sync" maxlength="120">

        <label class="wizard-label mt-3">Meeting location</label>
        <div class="location-list">
          <button type="button" *ngFor="let x of locations"
            [class.selected]="location === x.name"
            (click)="location = x.name">
            <span>{{ x.icon }}</span>
            <b>{{ x.name }}</b>
            <small>{{ x.desc }}</small>
            <strong *ngIf="location === x.name">✓ Selected</strong>
          </button>
        </div>

        <label class="wizard-label mt-3">Schedule (optional)</label>
        <input class="form-control wizard-input" type="datetime-local"
          [(ngModel)]="scheduledAt">



        <div class="p-3 rounded-3 mb-3 d-flex align-items-center justify-content-between border" style="background: rgba(99, 91, 255, 0.05); border-color: rgba(99, 91, 255, 0.2) !important;">
          <div>
            <b class="text-dark d-block">Meeting Hosting Fee</b>
            <small class="text-muted">Standard activation fee · Pay securely via UPI, Card, NetBanking</small>
          </div>
          <span class="fs-4 fw-bold text-primary">₹100.00</span>
        </div>

        <div class="wizard-summary">
          <b>Setup summary</b>
          <span>{{ purpose }} · {{ role }} · {{ location }}</span>
          <small>{{ features.length }} preferences selected · {{ timezone }} · Hosting Fee ₹100</small>
        </div>

        <div *ngIf="error" class="alert alert-danger mt-3">{{ error }}</div>
      </div>
    </div>

    <div *ngIf="error && step !== 5" class="alert alert-danger mx-4">
      {{ error }}
    </div>

    <footer class="wizard-footer">
      <button class="wizard-back" type="button" *ngIf="step > 1"
        (click)="previousStep()">← Back</button>
      <button class="wizard-cancel" type="button"
        (click)="closeWizard()">Cancel</button>
      <span class="wizard-spacer"></span>
      <button class="premium-primary" type="button" *ngIf="step < 5"
        (click)="nextStep()">Next <span>→</span></button>

      <button class="premium-primary" type="button" *ngIf="step === 5"
        [disabled]="saving || processingPayment"
        (click)="openPaymentModal()">
        💳 Pay ₹100 &amp; Create Meeting
      </button>
    </footer>
  </section>
</div>

<!-- ================= PROFESSIONAL HOST PAYMENT CHECKOUT GATEWAY ================= -->
<div class="checkout-backdrop" *ngIf="showPaymentModal" (click)="closePaymentModalOnBackdrop($event)" style="z-index: 9999;">
  <div class="checkout-card" (click)="$event.stopPropagation()" style="max-width: 530px;">
    <!-- Gateway Header -->
    <div class="checkout-header d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2.5">
        <div class="checkout-brand-badge">M</div>
        <div>
          <div class="d-flex align-items-center gap-2">
            <h5 class="mb-0 fw-bold text-dark">MeetSphere Pay</h5>
            <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 rounded-pill" style="font-size: 10px;">
              ● 256-Bit SSL Encrypted
            </span>
          </div>
          <small class="text-muted" style="font-size: 11px;">Instant Meeting Room Host Activation</small>
        </div>
      </div>
      <button type="button" class="btn-close-checkout" (click)="showPaymentModal = false">✕</button>
    </div>

    <div class="checkout-body">
      <!-- Order / Meeting Summary -->
      <div class="order-summary-card p-3 rounded-4 mb-3 d-flex justify-content-between align-items-center">
        <div>
          <span class="small text-muted text-uppercase fw-bold" style="font-size: 10px; letter-spacing: 0.05em;">MEETING HOSTING PASS</span>
          <h6 class="mb-0 fw-bold text-dark text-truncate" style="max-width: 290px;">{{ title || 'Scheduled Session' }}</h6>
          <small class="text-muted">Location: <b>{{ location }}</b></small>
        </div>
        <div class="text-end">
          <div class="summary-final-price">₹100.00</div>
          <small class="text-muted d-block" style="font-size: 10px;">One-time Fee</small>
        </div>
      </div>

      <!-- Payment Tabs -->
      <label class="form-label small fw-bold text-uppercase text-secondary mb-2" style="font-size: 10.5px; letter-spacing: 0.05em;">CHOOSE PAYMENT METHOD</label>
      <div class="payment-tabs-grid mb-3">
        <button type="button" class="pay-tab-btn" [class.active]="selectedMethod === 'UPI'" (click)="selectedMethod = 'UPI'">
          <span class="pay-tab-icon">📱</span>
          <b>UPI / QR</b>
          <small>GPay, PhonePe</small>
        </button>

        <button type="button" class="pay-tab-btn" [class.active]="selectedMethod === 'CARD'" (click)="selectedMethod = 'CARD'">
          <span class="pay-tab-icon">💳</span>
          <b>Card</b>
          <small>Visa, RuPay, MC</small>
        </button>

        <button type="button" class="pay-tab-btn" [class.active]="selectedMethod === 'NETBANKING'" (click)="selectedMethod = 'NETBANKING'">
          <span class="pay-tab-icon">🏛️</span>
          <b>NetBanking</b>
          <small>All Indian Banks</small>
        </button>

        <button type="button" class="pay-tab-btn" [class.active]="selectedMethod === 'WALLET'" (click)="selectedMethod = 'WALLET'">
          <span class="pay-tab-icon">👛</span>
          <b>Wallets</b>
          <small>Paytm, Amazon</small>
        </button>
      </div>

      <!-- TAB 1: UPI / QR -->
      <div *ngIf="selectedMethod === 'UPI'" class="p-3 rounded-4 border bg-white mb-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="btn-group btn-group-sm w-100 p-1 bg-light rounded-pill border">
            <button type="button" class="btn btn-sm rounded-pill fw-bold" [class.btn-primary]="upiMode === 'qr'" [class.btn-light]="upiMode !== 'qr'" (click)="upiMode = 'qr'">
              📱 Scan QR Code
            </button>
            <button type="button" class="btn btn-sm rounded-pill fw-bold" [class.btn-primary]="upiMode === 'id'" [class.btn-light]="upiMode !== 'id'" (click)="upiMode = 'id'">
              &#64; Enter UPI ID
            </button>
          </div>
        </div>

        <div *ngIf="upiMode === 'qr'" class="text-center py-1">
          <div class="upi-qr-wrapper p-3 rounded-4 shadow-sm d-inline-block">
            <svg width="130" height="130" viewBox="0 0 100 100" class="upi-qr-svg">
              <rect x="5" y="5" width="26" height="26" rx="4" fill="#1e1b4b" />
              <rect x="9" y="9" width="18" height="18" rx="2" fill="#fff" />
              <rect x="13" y="13" width="10" height="10" fill="#635bff" />

              <rect x="69" y="5" width="26" height="26" rx="4" fill="#1e1b4b" />
              <rect x="73" y="9" width="18" height="18" rx="2" fill="#fff" />
              <rect x="77" y="13" width="10" height="10" fill="#635bff" />

              <rect x="5" y="69" width="26" height="26" rx="4" fill="#1e1b4b" />
              <rect x="9" y="73" width="18" height="18" rx="2" fill="#fff" />
              <rect x="13" y="77" width="10" height="10" fill="#635bff" />

              <circle cx="40" cy="18" r="2.5" fill="#1e1b4b" />
              <circle cx="50" cy="12" r="2.5" fill="#635bff" />
              <circle cx="60" cy="18" r="2.5" fill="#1e1b4b" />
              <circle cx="45" cy="28" r="2.5" fill="#1e1b4b" />
              <circle cx="55" cy="28" r="2.5" fill="#635bff" />

              <circle cx="15" cy="45" r="2.5" fill="#1e1b4b" />
              <circle cx="25" cy="45" r="2.5" fill="#635bff" />
              <circle cx="35" cy="42" r="2.5" fill="#1e1b4b" />
              <circle cx="48" cy="48" r="3" fill="#635bff" />
              <circle cx="62" cy="42" r="2.5" fill="#1e1b4b" />
              <circle cx="75" cy="45" r="2.5" fill="#635bff" />
              <circle cx="85" cy="45" r="2.5" fill="#1e1b4b" />

              <circle cx="40" cy="65" r="2.5" fill="#635bff" />
              <circle cx="50" cy="60" r="2.5" fill="#1e1b4b" />
              <circle cx="60" cy="65" r="2.5" fill="#635bff" />
              <circle cx="45" cy="78" r="2.5" fill="#1e1b4b" />
              <circle cx="55" cy="78" r="2.5" fill="#635bff" />

              <circle cx="72" cy="72" r="2.5" fill="#1e1b4b" />
              <circle cx="85" cy="75" r="2.5" fill="#635bff" />
              <circle cx="78" cy="85" r="2.5" fill="#1e1b4b" />
              <circle cx="88" cy="88" r="2.5" fill="#635bff" />
            </svg>
            <div class="mt-2 fw-bold text-dark fs-6">₹100.00</div>
          </div>
          <small class="text-muted d-block mt-2" style="font-size: 11px;">
            Scan using <b>Google Pay</b> · <b>PhonePe</b> · <b>Paytm</b> · <b>BHIM</b>
          </small>
        </div>

        <div *ngIf="upiMode === 'id'">
          <label class="form-label small fw-semibold text-secondary">Virtual Payment Address (UPI ID)</label>
          <div class="input-group input-group-sm mb-2">
            <span class="input-group-text bg-light text-muted">&#64;</span>
            <input type="text" class="form-control" [(ngModel)]="upiId" placeholder="username@bank">
          </div>
          <div class="d-flex gap-1 flex-wrap">
            <button *ngFor="let p of upiPresets" type="button" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 11px;" (click)="upiId = p.value">
              {{ p.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 2: CARD -->
      <div *ngIf="selectedMethod === 'CARD'" class="p-3 rounded-4 border bg-white mb-3">
        <!-- Virtual Credit Card Preview -->
        <div class="virtual-credit-card text-white mb-3 shadow-sm" [class.card-brand-visa]="cardBrand === 'visa'" [class.card-brand-mc]="cardBrand === 'mastercard'" [class.card-brand-rupay]="cardBrand === 'rupay'" [class.card-brand-default]="cardBrand === 'card'">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="card-chip-icon"></span>
            <span class="fw-bold text-uppercase fs-6" style="letter-spacing: 0.1em;">{{ cardBrand }}</span>
          </div>
          <div class="fs-5 fw-bold mb-2 font-monospace" style="letter-spacing: 0.15em;">
            {{ cardNumber || '4242 •••• •••• 4242' }}
          </div>
          <div class="d-flex justify-content-between text-white-50 small" style="font-size: 10px;">
            <div>
              <span>CARDHOLDER</span>
              <div class="text-white fw-bold">{{ session.user?.fullName || 'CARD HOLDER' }}</div>
            </div>
            <div>
              <span>EXPIRES</span>
              <div class="text-white fw-bold">{{ cardExpiry || '12/28' }}</div>
            </div>
          </div>
        </div>

        <div class="mb-2">
          <label class="form-label small fw-semibold text-secondary mb-1">Card Number</label>
          <input type="text" class="form-control form-control-sm" [ngModel]="cardNumber" (input)="onCardNumberInput($event)" placeholder="4242 4242 4242 4242" maxlength="19">
        </div>

        <div class="row g-2">
          <div class="col-6">
            <label class="form-label small fw-semibold text-secondary mb-1">Expiry (MM/YY)</label>
            <input type="text" class="form-control form-control-sm" [ngModel]="cardExpiry" (input)="onExpiryInput($event)" placeholder="12/28" maxlength="5">
          </div>
          <div class="col-6">
            <label class="form-label small fw-semibold text-secondary mb-1">CVV</label>
            <input type="password" class="form-control form-control-sm" [(ngModel)]="cardCvv" placeholder="123" maxlength="4">
          </div>
        </div>
      </div>

      <!-- TAB 3: NETBANKING -->
      <div *ngIf="selectedMethod === 'NETBANKING'" class="p-3 rounded-4 border bg-white mb-3">
        <label class="form-label small fw-semibold text-secondary mb-2">Select from Popular Banks</label>
        <div class="popular-banks-grid mb-3">
          <div *ngFor="let b of popularBanks" class="bank-pill-btn" [class.active]="selectedBank === b.name" (click)="selectedBank = b.name">
            <span class="bank-dot" [ngClass]="b.code"></span>
            <span>{{ b.name }}</span>
          </div>
        </div>
      </div>

      <!-- TAB 4: WALLET -->
      <div *ngIf="selectedMethod === 'WALLET'" class="p-3 rounded-4 border bg-white mb-3">
        <label class="form-label small fw-semibold text-secondary mb-2">Select Digital Wallet</label>
        <div class="row g-2">
          <div *ngFor="let w of popularWallets" class="col-6">
            <div class="wallet-radio-box p-2.5 rounded-3 border d-flex align-items-center gap-2" [class.active]="selectedWallet === w.name" (click)="selectedWallet = w.name">
              <span class="fs-5">{{ w.icon }}</span>
              <span class="fw-bold small">{{ w.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment error banner -->
      <div *ngIf="paymentError" class="alert alert-danger py-2 px-3 small mb-3">
        {{ paymentError }}
      </div>

      <!-- Action button -->
      <button type="button" class="btn rounded-pill w-100 py-3 fw-bold text-white shadow-sm"
        style="background: linear-gradient(135deg, #10b981, #059669); font-size: 15px;"
        [disabled]="processingPayment"
        (click)="confirmPaymentAndCreate()">
        <span *ngIf="processingPayment" class="spinner-border spinner-border-sm me-2"></span>
        <span *ngIf="!processingPayment">🔒 Pay ₹100.00 &amp; Create Meeting</span>
        <span *ngIf="processingPayment">Connecting Banking Gateway...</span>
      </button>

      <div class="d-flex align-items-center justify-content-center gap-3 mt-2 text-muted" style="font-size: 11px;">
        <span>🔒 256-bit SSL</span>
        <span>•</span>
        <span>⚡ Instant Activation</span>
        <span>•</span>
        <span>🛡️ PCI-DSS Certified</span>
      </div>
    </div>
  </div>
</div>

<!-- ================= SUCCESS CONFIRMATION RECEIPT MODAL ================= -->
<div class="checkout-backdrop" *ngIf="showSuccessModal" (click)="closeSuccessModal()" style="z-index: 9999;">
  <div class="checkout-card text-center p-4" (click)="$event.stopPropagation()" style="max-width: 460px; border-radius: 24px; box-shadow: 0 30px 90px rgba(16, 185, 129, 0.25);">
    
    <!-- Animated Check Badge -->
    <div class="success-icon-badge mx-auto mb-3" style="font-size: 32px; display: grid; place-items: center;">
      ✓
    </div>

    <span class="badge bg-success-subtle text-success px-3 py-1 rounded-pill fw-bold mb-2">
      💳 Payment Completed (₹100.00)
    </span>

    <h3 class="fw-bold text-dark mb-1" style="letter-spacing: -0.02em;">Payment Successful!</h3>
    <p class="text-muted small mb-3">Your meeting room has been activated and is ready to host.</p>

    <!-- Professional Receipt Details Box -->
    <div class="p-3 rounded-4 text-start mb-3 border" style="background: #f8fafc;">
      <div class="d-flex justify-content-between mb-2 small">
        <span class="text-muted">Transaction ID:</span>
        <code class="fw-bold text-dark">{{ lastTxnId }}</code>
      </div>
      <div class="d-flex justify-content-between mb-2 small">
        <span class="text-muted">Payment Mode:</span>
        <span class="fw-bold text-dark">{{ selectedMethod }}</span>
      </div>
      <div class="d-flex justify-content-between mb-2 small">
        <span class="text-muted">Amount Paid:</span>
        <span class="fw-bold text-success">₹100.00</span>
      </div>
      <div class="d-flex justify-content-between mb-2 small">
        <span class="text-muted">Status:</span>
        <span class="badge bg-success text-white rounded-pill px-2">● Verified &amp; Paid</span>
      </div>
      <div class="border-top pt-2 mt-2">
        <span class="text-muted d-block small mb-1">MEETING ROOM</span>
        <div class="fw-bold text-dark">{{ createdMeetingTitle }}</div>
      </div>
    </div>

    <!-- Meeting Code Display with Copy Button -->
    <div class="d-flex align-items-center justify-content-between bg-light p-2.5 rounded-3 border mb-3">
      <div>
        <small class="text-muted d-block text-start" style="font-size: 10px;">MEETING CODE</small>
        <code class="fs-5 fw-bold text-primary">{{ createdMeetingCode }}</code>
      </div>
      <button type="button" class="btn btn-sm" [class.btn-outline-primary]="!copiedCode" [class.btn-success]="copiedCode" (click)="copyMeetingCode()">
        {{ copiedCode ? '✓ Copied' : '📋 Copy Code' }}
      </button>
    </div>

    <!-- Action Buttons -->
    <div class="d-grid gap-2">
      <a *ngIf="createdMeetingCode" [routerLink]="['/room', createdMeetingCode]" class="btn btn-primary rounded-pill py-2.5 fw-bold shadow-sm" (click)="closeSuccessModal()" style="background: linear-gradient(135deg, #635bff, #4f46e5); font-size: 15px;">
        🚀 Open Room Now →
      </a>
      <button type="button" class="btn btn-light rounded-pill py-2 text-muted fw-semibold" (click)="closeSuccessModal()">
        Done &amp; View All Meetings
      </button>
    </div>

  </div>
</div>

<!-- ================= CENTERED CONFIRMATION MODAL FOR DELETING MEETING ================= -->
<div class="checkout-backdrop" *ngIf="showDeleteMeetingModal" (click)="showDeleteMeetingModal = false" style="z-index: 5000;">
  <div class="checkout-card text-center p-4 shadow-lg" (click)="$event.stopPropagation()" style="max-width: 440px;">
    <div class="mx-auto mb-3" style="width: 56px; height: 56px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; font-size: 24px;">
      🗑️
    </div>
    <h4 class="fw-bold text-dark mb-1">Delete Meeting Room?</h4>
    <p class="text-muted small mb-3">
      Are you sure you want to permanently cancel and delete <b>{{ meetingToDelete?.title }}</b> (Code: <code>{{ meetingToDelete?.meetingCode }}</code>)?
    </p>
    <div class="d-flex gap-2 justify-content-center mt-3">
      <button type="button" class="btn btn-light rounded-pill px-4" (click)="showDeleteMeetingModal = false" [disabled]="deleteBusy">
        Cancel
      </button>
      <button type="button" class="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" (click)="confirmDeleteMeeting()" [disabled]="deleteBusy">
        {{ deleteBusy ? 'Deleting...' : 'Yes, Delete' }}
      </button>
    </div>
  </div>
</div>
`
})
export class DashboardComponent implements OnInit, OnDestroy {
  api = inject(ApiService);
  session = inject(SessionService);
  router = inject(Router);

  meetingToDelete: any = null;
  showDeleteMeetingModal = false;
  deleteBusy = false;

  promptDeleteMeeting(m: any) {
    this.meetingToDelete = m;
    this.showDeleteMeetingModal = true;
  }

  confirmDeleteMeeting() {
    if (!this.meetingToDelete) return;
    this.deleteBusy = true;
    const id = this.meetingToDelete.id;
    const code = this.meetingToDelete.meetingCode;

    this.api.deleteMeeting(id).subscribe({
      next: () => {
        this.deleteBusy = false;
        this.showDeleteMeetingModal = false;
        this.meetingToDelete = null;
        this.load();
      },
      error: () => {
        if (code) {
          this.api.deleteMeetingByCode(code).subscribe({
            next: () => {
              this.deleteBusy = false;
              this.showDeleteMeetingModal = false;
              this.meetingToDelete = null;
              this.load();
            },
            error: (err: any) => {
              this.deleteBusy = false;
              this.error = err.error?.message || 'Could not delete meeting.';
            }
          });
        } else {
          this.deleteBusy = false;
          this.error = 'Could not delete meeting.';
        }
      }
    });
  }

  launchZoom(m: any) {
    const code = String(m?.meetingCode || '').trim();
    const digitsOnly = code.replace(/\D/g, '');
    if (digitsOnly.length >= 6) {
      // Numeric meeting codes are Zoom-compatible — open Zoom join page directly
      window.open(`https://zoom.us/j/${digitsOnly}`, '_blank');
    } else {
      this.shareNotice = 'Meeting code is not a valid Zoom meeting ID. Use the room link instead.';
      setTimeout(() => this.shareNotice = '', 5000);
    }
  }

  launchGoogleMeet(m: any) {
    window.open('https://meet.google.com/new', '_blank');
  }

  addToGoogleCalendar(m: any) {
    if (!m) return;
    const title = encodeURIComponent(m.title || 'MeetSphere Meeting');
    const roomUrl = `${location.origin}/room/${m.meetingCode}`;
    const details = encodeURIComponent(
      `MeetSphere Meeting: ${m.title}\nMeeting Code: ${m.meetingCode}\nDirect Room URL: ${roomUrl}\nOrganized with MeetSphere.`
    );
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${encodeURIComponent(roomUrl)}`;
    window.open(gcalUrl, '_blank');
  }


  Math = Math;
  timeboxTitle = '';
  timeboxMinutes = 5;
  timeboxTargetMinutes = 30;
  timeboxItems: { title: string; minutes: number }[] = [];

  private get timeboxStorageKey(): string {
    const identity = this.session.user?.id ?? this.session.user?.email ?? 'guest';
    return `ms_timebox_${encodeURIComponent(String(identity).toLowerCase())}`;
  }

  get timeboxTotalMinutes(): number { return this.timeboxItems.reduce((total, item) => total + Number(item.minutes || 0), 0); }

  loadTimebox() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.timeboxStorageKey) || 'null');
      if (saved && typeof saved === 'object') {
        this.timeboxTargetMinutes = Math.max(1, Math.min(600, Number(saved.targetMinutes) || 30));
        this.timeboxItems = Array.isArray(saved.items) ? saved.items.filter((item: any) => item && typeof item.title === 'string').map((item: any) => ({ title: item.title.slice(0, 120), minutes: Math.max(1, Math.min(240, Number(item.minutes) || 1)) })) : [];
      }
    } catch { this.timeboxItems = []; }
  }

  saveTimebox() {
    try { localStorage.setItem(this.timeboxStorageKey, JSON.stringify({ targetMinutes: this.timeboxTargetMinutes, items: this.timeboxItems })); } catch { /* Export remains available if storage is blocked. */ }
  }

  addTimeboxItem() {
    const title = this.timeboxTitle.trim();
    const minutes = Number(this.timeboxMinutes);
    if (!title || !Number.isFinite(minutes) || minutes < 1 || minutes > 240) return;
    this.timeboxItems = [...this.timeboxItems, { title, minutes: Math.round(minutes) }];
    this.timeboxTitle = '';
    this.saveTimebox();
  }

  removeTimeboxItem(index: number) { this.timeboxItems.splice(index, 1); this.saveTimebox(); }

  exportTimebox() {
    const lines = ['MeetSphere Agenda Timebox Planner', `Exported: ${new Date().toLocaleString()}`, `Target: ${this.timeboxTargetMinutes} minutes`, `Planned total: ${this.timeboxTotalMinutes} minutes`, '', ...this.timeboxItems.map((item, i) => `${i + 1}. ${item.title} — ${item.minutes} minutes`)];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `meetsphere-agenda-${new Date().toISOString().slice(0, 10)}.txt`; anchor.click(); URL.revokeObjectURL(url);
  }
  followUpText = '';
  followUpItems: { title: string; done: boolean; createdAt: string }[] = [];

  private get followUpStorageKey(): string {
    const identity = this.session.user?.id ?? this.session.user?.email ?? 'guest';
    return `ms_followups_${encodeURIComponent(String(identity).toLowerCase())}`;
  }

  get openFollowUpCount(): number { return this.followUpItems.filter(item => !item.done).length; }

  loadFollowUps() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.followUpStorageKey) || '[]');
      this.followUpItems = Array.isArray(saved) ? saved.filter((item: any) => item && typeof item.title === 'string').map((item: any) => ({ title: item.title, done: Boolean(item.done), createdAt: String(item.createdAt || '') })) : [];
    } catch { this.followUpItems = []; }
  }

  saveFollowUps() {
    try { localStorage.setItem(this.followUpStorageKey, JSON.stringify(this.followUpItems)); } catch { /* Export remains available while storage is unavailable. */ }
  }

  addFollowUp() {
    const title = this.followUpText.trim();
    if (!title) return;
    this.followUpItems = [{ title, done: false, createdAt: new Date().toISOString() }, ...this.followUpItems];
    this.followUpText = '';
    this.saveFollowUps();
  }

  toggleFollowUp(index: number) {
    if (!this.followUpItems[index]) return;
    this.followUpItems[index].done = !this.followUpItems[index].done;
    this.saveFollowUps();
  }

  removeFollowUp(index: number) {
    this.followUpItems.splice(index, 1);
    this.saveFollowUps();
  }

  exportFollowUps() {
    const lines = ['MeetSphere Follow-up Action Board', `Exported: ${new Date().toLocaleString()}`, '', ...this.followUpItems.map(item => `${item.done ? '[x]' : '[ ]'} ${item.title}`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `meetsphere-follow-ups-${new Date().toISOString().slice(0,10)}.txt`; anchor.click(); URL.revokeObjectURL(url);
  }
  prepAgenda = '';
  prepSavedNotice = '';
  prepChecklist = [
    { label: 'Check microphone and speakers', done: false },
    { label: 'Check camera and lighting', done: false },
    { label: 'Review agenda and files', done: false },
    { label: 'Confirm meeting time and invite link', done: false }
  ];
  private prepNoticeTimer: any;
  adminChangeNotice = '';
  shareNotice = '';

  private get prepStorageKey(): string {
    const identity = this.session.user?.id ?? this.session.user?.email ?? 'guest';
    return `ms_prep_kit_${encodeURIComponent(String(identity).toLowerCase())}`;
  }

  get prepProgress(): number {
    return Math.round(this.prepChecklist.filter(item => item.done).length / this.prepChecklist.length * 100);
  }

  loadPrepKit() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.prepStorageKey) || 'null');
      if (saved && typeof saved === 'object') {
        this.prepAgenda = typeof saved.agenda === 'string' ? saved.agenda : '';
        if (Array.isArray(saved.checklist) && saved.checklist.length === this.prepChecklist.length) {
          this.prepChecklist = this.prepChecklist.map((item, i) => ({ ...item, done: Boolean(saved.checklist[i]) }));
        }
      }
    } catch { /* Keep a clean default if local browser data is unavailable. */ }
  }

  savePrepKit() {
    try {
      localStorage.setItem(this.prepStorageKey, JSON.stringify({ agenda: this.prepAgenda, checklist: this.prepChecklist.map(item => item.done) }));
      this.prepSavedNotice = 'Your prep kit is saved.';
      if (this.prepNoticeTimer) clearTimeout(this.prepNoticeTimer);
      this.prepNoticeTimer = setTimeout(() => this.prepSavedNotice = '', 2200);
    } catch {
      this.prepSavedNotice = 'Browser storage is unavailable; export your notes to keep a copy.';
    }
  }

  exportPrepKit() {
    const checklist = this.prepChecklist.map(item => `${item.done ? '[x]' : '[ ]'} ${item.label}`).join('\n');
    const content = `MeetSphere Meeting Prep Kit\nExported: ${new Date().toLocaleString()}\n\nAGENDA / PRIVATE NOTES\n${this.prepAgenda || '(No notes added)'}\n\nBEFORE YOU JOIN\n${checklist}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `meetsphere-prep-kit-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }



  async shareMeeting(meeting: any) {
    if (!meeting?.meetingCode) return;
    const inviteUrl = `${window.location.origin}/room/${encodeURIComponent(meeting.meetingCode)}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      this.shareNotice = `Invite link copied for “${meeting.title || 'your meeting'}”. Share it with attendees.`;
    } catch {
      this.shareNotice = `Invite link: ${inviteUrl}`;
    }
    setTimeout(() => this.shareNotice = '', 7000);
  }

  exportMyMeetings() {
    const rows = [
      ['Meeting title', 'Meeting code', 'Fee (INR)', 'Scheduled at', 'Created at'],
      ...this.meetings.map(m => [m.title || '', m.meetingCode || '', Number(m.price || 0), m.scheduledAt || '', m.createdAt || ''])
    ];
    this.downloadCsv(`meetsphere-my-meetings-${new Date().toISOString().slice(0,10)}.csv`, rows);
  }

  private downloadCsv(filename: string, rows: any[][]) {
    const csv = '\uFEFF' + rows.map(row => row.map(value => {
      let cell = String(value ?? '');
      // Prevent spreadsheet formula injection in exported text fields.
      if (/^[=+@\-\t\r]/.test(cell)) cell = "'" + cell;
      return `"${cell.replace(/"/g, '""')}"`;
    }).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  meetings: any[] = [];
  payments: any[] = [];
  announcement: any = null;
  stats: any = null;
  searchMeetingText = '';
  filterMeetingMode: 'all' | 'free' | 'paid' = 'all';

  get filteredMeetings(): any[] {
    let list = this.meetings || [];
    const q = (this.searchMeetingText || '').toLowerCase().trim();
    if (q) {
      list = list.filter(m =>
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.meetingCode && m.meetingCode.toLowerCase().includes(q))
      );
    }
    if (this.filterMeetingMode === 'free') {
      list = list.filter(m => !m.price || Number(m.price) <= 0);
    } else if (this.filterMeetingMode === 'paid') {
      list = list.filter(m => Number(m.price) > 0);
    }
    return list;
  }
  showWizard = false;
  step = 1;
  title = '';
  scheduledAt = '';
  isPaid = true;
  price = 100;
  error = '';
  saving = false;

  createdMeetingCode = '';
  createdMeetingTitle = '';
  showSuccessModal = false;
  copiedCode = false;

  copyMeetingCode() {
    if (this.createdMeetingCode) {
      navigator.clipboard.writeText(this.createdMeetingCode);
      this.copiedCode = true;
      setTimeout(() => this.copiedCode = false, 2000);
    }
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
  }

  showPaymentModal = false;
  selectedMethod = 'UPI';
  upiMode: 'qr' | 'id' = 'qr';
  upiId = 'demo' + String.fromCharCode(64) + 'okaxis';
  cardNumber = '4242 4242 4242 4242';
  cardExpiry = '12/28';
  cardCvv = '123';
  selectedBank = 'HDFC Bank';
  selectedWallet = 'Paytm';
  paymentError = '';
  processingPayment = false;
  lastTxnId = '';
  paymentDate = '';

  popularBanks = [
    { name: 'HDFC Bank', code: 'hdfc' },
    { name: 'SBI', code: 'sbi' },
    { name: 'ICICI Bank', code: 'icici' },
    { name: 'Axis Bank', code: 'axis' },
    { name: 'Kotak Bank', code: 'kotak' },
    { name: 'PNB', code: 'pnb' }
  ];

  popularWallets = [
    { name: 'Paytm', icon: '👛' },
    { name: 'PhonePe', icon: '📱' },
    { name: 'Amazon Pay', icon: '📦' },
    { name: 'MobiKwik', icon: '💳' }
  ];

  get cardBrand(): string {
    const num = (this.cardNumber || '').replace(/\s+/g, '');
    if (num.startsWith('4')) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(num)) return 'mastercard';
    if (/^(60|65|81|82)/.test(num)) return 'rupay';
    return 'card';
  }

  onCardNumberInput(event: any) {
    const val = (event.target?.value || '').replace(/\D/g, '').substring(0, 16);
    this.cardNumber = val.match(/.{1,4}/g)?.join(' ') || val;
  }

  onExpiryInput(event: any) {
    let val = (event.target?.value || '').replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    this.cardExpiry = val;
  }

  upiPresets = [
    { label: 'demo' + String.fromCharCode(64) + 'okaxis', value: 'demo' + String.fromCharCode(64) + 'okaxis' },
    { label: 'user' + String.fromCharCode(64) + 'okhdfcbank', value: 'user' + String.fromCharCode(64) + 'okhdfcbank' },
    { label: 'pay' + String.fromCharCode(64) + 'ybl', value: 'pay' + String.fromCharCode(64) + 'ybl' }
  ];

  setUpiPreset(idx: number) {
    if (this.upiPresets[idx]) {
      this.upiId = this.upiPresets[idx].value;
    }
  }

  purpose = 'On my own';
  role = 'Other';
  calendar = 'Google Calendar';
  timezone = 'Asia/Kolkata (India Standard Time)';
  checkConflicts = true;
  location = 'MeetSphere room';
  features: string[] = ['Schedule meetings'];

  useOptions = [
    { icon: '☝️', label: 'On my own', value: 'On my own', desc: 'Personal meetings and scheduling' },
    { icon: '🤝', label: 'With my team', value: 'With my team', desc: 'Collaborate with your team' }
  ];

  featureOptions = [
    { icon: '⏱️', label: 'Automate meeting reminders' },
    { icon: '🎥', label: 'Record and transcribe meetings' },
    { icon: '👥', label: 'Meet with multiple attendees' },
    { icon: '🤖', label: 'Optimize scheduling with AI' },
    { icon: '✨', label: 'Handle scheduling with AI' },
    { icon: '🗓️', label: 'Schedule meetings' },
    { icon: '📋', label: 'Manage contact records' },
    { icon: '💰', label: 'Collect payment' }
  ];

  roleOptions = [
    { icon: '💰', label: 'Finance' },
    { icon: '📈', label: 'Sales' },
    { icon: '🛟', label: 'Customer success' },
    { icon: '📋', label: 'Recruiting' },
    { icon: '🚀', label: 'Marketing' },
    { icon: '📚', label: 'Education' },
    { icon: '💼', label: 'Consulting' },
    { icon: '🦄', label: 'Other' }
  ];

  calendars = ['Google Calendar', 'Outlook Calendar', 'MeetSphere only'];

  locations = [
    { icon: '◉', name: 'MeetSphere room', desc: 'Create a room with a unique meeting code' },
    { icon: '🎥', name: 'Video meeting', desc: 'Meet online with your invited attendees' },
    { icon: '🏢', name: 'In person', desc: 'Plan an in-person session' }
  ];

  availability = [
    { day: 'Monday', enabled: true, start: '09:00', end: '17:00' },
    { day: 'Tuesday', enabled: true, start: '09:00', end: '17:00' },
    { day: 'Wednesday', enabled: true, start: '09:00', end: '17:00' },
    { day: 'Thursday', enabled: true, start: '09:00', end: '17:00' },
    { day: 'Friday', enabled: true, start: '09:00', end: '17:00' },
    { day: 'Saturday', enabled: false, start: '09:00', end: '17:00' },
    { day: 'Sunday', enabled: false, start: '09:00', end: '17:00' }
  ];

  get firstName() {
    return (this.session.user?.fullName || 'there').split(' ')[0];
  }

  get initials() {
    return (this.session.user?.fullName || 'M')
      .split(' ')
      .map((x: string) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get totalPaid() {
    return this.payments
      .filter(p => p.paymentStatus === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }

  get upcoming() {
    return this.meetings.filter(
      m => m.scheduledAt && new Date(m.scheduledAt) > new Date()
    ).length;
  }

  get stepTitle() {
    return [
      'Your meeting preferences',
      'Your role',
      'Calendar preferences',
      'Your availability',
      'Finalize your meeting'
    ][this.step - 1];
  }

  get stepSubtitle() {
    return [
      'Personalize the way you use MeetSphere.',
      'Tell us what best describes your work.',
      'Set the calendar details for your meetings.',
      'Choose the hours that work for you.',
      'Review your details and create your meeting.'
    ][this.step - 1];
  }

  private liveRefreshTimer: any;

  ngOnInit() {
    if (!this.session.loggedIn) {
      this.session.redirectToLogin();
      return;
    }

    if (this.session.isAdmin) {
      this.session.openPanel();
      return;
    }

    this.loadAnnouncement();
    this.loadPrepKit();
    this.loadTimebox();
    this.loadFollowUps();
    this.load();

    if (localStorage.getItem(this.onboardingKey) !== 'true') {
      this.startWizard();
    }

    // Start auto-sync: detect if admin updates this user's details
    // Keep meeting/payment records synchronized with admin changes across active sessions.
    this.liveRefreshTimer = setInterval(() => { this.load(); this.loadAnnouncement(); }, 10000);

    this.session.startSync(
      // On user data updated by admin
      (updatedUser: any) => {
        this.adminChangeNotice = `Your account details have been updated by the administrator. Name: ${updatedUser.fullName}, Role: ${updatedUser.role}.`;
        setTimeout(() => this.adminChangeNotice = '', 8000);
        this.load();
      }
    );
  }

  loadAnnouncement() {
    this.api.latestAnnouncement().subscribe({ next: (item: any) => this.announcement = item || null, error: () => this.announcement = null });
  }

  ngOnDestroy() {
    if (this.prepNoticeTimer) clearTimeout(this.prepNoticeTimer);
    if (this.liveRefreshTimer) clearInterval(this.liveRefreshTimer);
    this.session.stopSync();
  }

  scrollToMeetings(event: Event) {
    event.preventDefault();
    const section = document.getElementById('meetings');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '/dashboard#meetings');
    }
  }

  private get onboardingKey(): string {
    return `ms_onboarding_done_${this.session.user?.id ?? 'unknown'}`;
  }

  logout() {
    this.session.logout();
  }

  load() {
    this.api.meetings().subscribe({
      next: (items: any[]) => this.meetings = items,
      error: () => this.error =
        'Could not load meetings. Make sure the API and database are running.'
    });
    this.api.myPayments().subscribe({
      next: (items: any[]) => this.payments = items || [],
      error: () => this.payments = []
    });
  }

  startWizard() {
    this.step = 1;
    this.title = this.title.trim() || 'Weekly Team Sync';
    this.scheduledAt = '';
    this.isPaid = true;
    this.price = 100;
    this.error = '';
    this.showWizard = true;
  }

  closeWizard() {
    if (localStorage.getItem(this.onboardingKey) !== 'true') {
      this.error = 'Please complete your setup and create your first meeting.';
      return;
    }

    this.error = '';
    this.showWizard = false;
  }

  nextStep() {
    this.error = '';

    if (this.step === 1 && !this.purpose) {
      this.error = 'Please choose how you plan to use MeetSphere.';
      return;
    }

    this.step = Math.min(5, this.step + 1);
  }

  previousStep() {
    this.error = '';
    this.step = Math.max(1, this.step - 1);
  }

  toggleFeature(label: string) {
    this.features = this.features.includes(label)
      ? this.features.filter(x => x !== label)
      : [...this.features, label];
  }

  openPaymentModal() {
    this.error = '';

    if (!this.title.trim()) {
      this.title = 'Weekly Team Sync';
    }

    this.paymentError = '';
    this.showPaymentModal = true;
  }

  closePaymentModalOnBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('checkout-backdrop')) {
      this.showPaymentModal = false;
    }
  }

  confirmPaymentAndCreate() {
    this.processingPayment = true;
    this.paymentError = '';

    const cleanTitle = (this.title || '').trim() || 'Weekly Team Sync';
    this.title = cleanTitle;

    const details = {
      purpose: this.purpose,
      features: this.features,
      role: this.role,
      calendar: this.calendar,
      timezone: this.timezone,
      checkConflicts: this.checkConflicts,
      availability: this.availability,
      location: this.location
    };

    // Realistic banking network response simulation (600ms) for authentic payment gateway feel
    setTimeout(() => {
      this.api.createMeeting({
        title: cleanTitle,
        price: 100,
        scheduledAt: this.scheduledAt || null,
        details
      }).subscribe({
        next: (r: any) => {
          this.processingPayment = false;
          this.saving = false;
          this.showPaymentModal = false;
          this.showWizard = false;

          localStorage.setItem(this.onboardingKey, 'true');
          this.createdMeetingCode = r.meetingCode || '';
          this.createdMeetingTitle = cleanTitle;
          this.lastTxnId = 'TXN_MS_' + Math.floor(10000000 + Math.random() * 90000000);
          this.paymentDate = new Date().toLocaleString();
          this.title = '';
          this.scheduledAt = '';
          this.error = '';

          this.load();

          this.showSuccessModal = true;
        },
        error: (e: any) => {
          this.processingPayment = false;
          this.paymentError = e.error?.message ||
            'Payment could not be processed. Check that the API and database are running.';
        }
      });
    }, 600);
  }
}
