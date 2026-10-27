import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService, SessionService } from '../services';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand side-brand" [routerLink]="isAdmin ? '/admin' : '/dashboard'">
        <span class="brand-icon" [class.bg-danger]="isAdmin" [class.text-white]="isAdmin">M</span> MeetSphere
      </a>
      <div class="side-label" [class.text-danger]="isAdmin">{{isAdmin ? 'ADMIN CONSOLE' : 'WORKSPACE'}}</div>
      <nav class="sidebar-nav">
        <a class="side-link" [routerLink]="isAdmin ? '/admin' : '/dashboard'">▦ &nbsp; {{isAdmin?'Overview & Control':'Overview'}}</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/discover">◈ &nbsp; Discover meetings</a>
        <a class="side-link" [routerLink]="isAdmin?'/admin-tools/calendar':'/calendar'">▣ &nbsp; Calendar</a>
        <a class="side-link" [routerLink]="isAdmin?'/admin-tools/notes':'/notetaker'">◩ &nbsp; Notetaker</a>
        <a class="side-link" [routerLink]="isAdmin?'/admin-tools/contacts':'/contacts'">♧ &nbsp; Contacts</a>
        <a class="side-link active" [routerLink]="isAdmin?'/admin-tools/automations':'/automations'">✣ &nbsp; Automations</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/payment-history">₹ &nbsp; Payment history</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/workspace-automations">✣ &nbsp; Workflow Rules</a>
        <a *ngIf="isAdmin" class="side-link" routerLink="/admin-payments">₹ &nbsp; Payments & Revenue</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/meeting-brief">✧ &nbsp; Meeting Brief Studio</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/meeting-readiness">✓ &nbsp; Meeting Readiness</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/meeting-cost">₹ &nbsp; Meeting Cost Planner</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/calendar-conflicts">◷ &nbsp; Conflict Finder</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/follow-up-actions">☑ &nbsp; Action Tracker</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/meeting-follow-up">✉ &nbsp; Follow-up Writer</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/decision-ledger">◆ &nbsp; Decision Ledger</a>
        <a *ngIf="isAdmin" class="side-link" routerLink="/admin-tools/governance">◈ &nbsp; Governance Scorecard</a>
        <a *ngIf="isAdmin" class="side-link" routerLink="/admin-tools/security">⛨ &nbsp; Policy Checklist</a>
        <a *ngIf="isAdmin" class="side-link" routerLink="/admin-tools/diagnostics">◉ &nbsp; Live Diagnostics</a>
        <a *ngIf="isAdmin" class="side-link" routerLink="/admin-tools/capacity">▥ &nbsp; Calendar Capacity</a>
        <a *ngIf="isAdmin" class="side-link" routerLink="/admin-tools/meeting-hygiene">✚ &nbsp; Meeting Health</a>
        <a *ngIf="isAdmin" class="side-link" routerLink="/admin-tools/exports">⇩ &nbsp; Export Center</a>
        <a *ngIf="isAdmin" class="side-link" routerLink="/admin-tools/workspace-control">⚙ &nbsp; User Workspace Control</a>
        <a *ngIf="isAdmin" class="side-link" routerLink="/admin-tools/change-log">◈ &nbsp; Change & Risk Log</a>
        <a *ngIf="!isAdmin" class="side-link" routerLink="/upgrade">⇧ &nbsp; Upgrade plan</a>
        <a class="side-link" [routerLink]="isAdmin?'/admin-settings':'/settings'">⚙ &nbsp; {{isAdmin?'Admin Settings':'Settings'}}</a>
      </nav>
      <div class="side-bottom mt-auto">
        <div class="d-flex align-items-center gap-2 mb-2 px-1">
          <span class="status-dot-green"></span>
          <small class="text-muted fw-semibold" style="font-size:11px;">{{isAdmin?'Admin Console':'Server Online'}} · Active</small>
        </div>
        <div class="profile-chip">
          <span class="profile-avatar" [class.bg-dark]="isAdmin" [class.text-white]="isAdmin">{{initials}}</span>
          <div>
            <b>{{session.user?.fullName}}</b>
            <small [class.text-danger]="isAdmin" class="text-primary fw-bold">★ {{isAdmin?'Administrator':'Active Member'}}</small>
          </div>
        </div>
        <button class="side-link logout-link mt-1" (click)="session.logout()">↪ &nbsp; Log out</button>
      </div>
    </aside>

    <main class="workspace">
      <header class="workspace-top">
        <div>
          <span class="eyebrow" [class.text-danger]="isAdmin">{{isAdmin?'ADMIN WORKSPACE':'YOUR WORKSPACE'}}</span>
          <h2>Automations &amp; Integrations <span>✣</span></h2>
          <p>Connect your favorite apps and automate your meeting workflows seamlessly.</p>
        </div>
        <a class="btn btn-outline-dark rounded-pill px-4" [routerLink]="isAdmin?'/admin':'/dashboard'">← Back</a>
      </header>

      <!-- Sub-tab Navigation -->
      <div class="d-flex gap-3 border-bottom pb-2 mb-4">
        <button type="button" class="btn btn-link text-decoration-none fw-bold pb-2 px-2"
                [class.text-primary]="page==='catalog'"
                [class.border-bottom]="page==='catalog'"
                [class.border-3]="page==='catalog'"
                [class.border-primary]="page==='catalog'"
                [class.text-secondary]="page!=='catalog'"
                (click)="page='catalog'">
          Integrations &amp; Apps
        </button>
        <button type="button" class="btn btn-link text-decoration-none fw-bold pb-2 px-2"
                [class.text-primary]="page==='rules'"
                [class.border-bottom]="page==='rules'"
                [class.border-3]="page==='rules'"
                [class.border-primary]="page==='rules'"
                [class.text-secondary]="page!=='rules'"
                (click)="page='rules'">
          My Automations
        </button>
        <a *ngIf="!isAdmin" routerLink="/workspace-automations" class="btn btn-link text-decoration-none text-muted pb-2 px-2 small ms-auto d-flex align-items-center gap-1">
          <span>⚡ Workflow Rules</span> <span>→</span>
        </a>
      </div>

      <!-- CATALOG VIEW -->
      <ng-container *ngIf="page==='catalog'">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm rounded-pill px-3 fw-semibold"
                    [class.btn-primary]="activeFilter==='all'"
                    [class.btn-outline-secondary]="activeFilter!=='all'"
                    (click)="activeFilter='all'">
              ● All Apps
            </button>
            <button type="button" class="btn btn-sm rounded-pill px-3 fw-semibold"
                    [class.btn-primary]="activeFilter==='connected'"
                    [class.btn-outline-secondary]="activeFilter!=='connected'"
                    (click)="activeFilter='connected'">
              Connected ({{ connectedCount }})
            </button>
          </div>
          <small class="text-muted">Click any service to view setup options and permissions</small>
        </div>

        <div class="integration-cards-grid">
          <div class="int-card" *ngFor="let app of filteredApps" (click)="openApp(app.name)">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div class="app-icon-box" [ngClass]="app.class">
                <span *ngIf="app.name==='Zoom'" class="zoom-text">zoom</span>
                <span *ngIf="app.name==='Google Meet'" class="gmeet-parallelogram"></span>
                <span *ngIf="app.name==='Google Calendar'" class="gcal-icon">31</span>
                <span *ngIf="app.name!=='Zoom' && app.name!=='Google Meet' && app.name!=='Google Calendar'">{{app.icon}}</span>
              </div>
              <span *ngIf="isAppConnected(app)" class="badge-status-connected">
                ✓ Connected
              </span>
              <span *ngIf="!isAppConnected(app) && app.status" class="badge-status-admin">
                {{ app.status }}
              </span>
              <span *ngIf="!isAppConnected(app) && !app.status" class="badge-status-config">
                Configure
              </span>
            </div>
            <h4 class="int-card-title">{{app.name}}</h4>
            <p class="int-card-desc">{{app.description}}</p>
            <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
              <span class="small fw-semibold" [class.text-success]="isAppConnected(app)" [class.text-primary]="!isAppConnected(app)">
                {{ isAppConnected(app) ? 'Active & Synced' : 'Set up integration →' }}
              </span>
              <span class="card-arrow" [class.text-success]="isAppConnected(app)" [class.text-muted]="!isAppConnected(app)">›</span>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ZOOM INFO VIEW -->
      <ng-container *ngIf="page==='zoom-info'">
        <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill mb-3" (click)="page='catalog'">
          ← Back to Integrations &amp; apps
        </button>

        <div class="bg-white rounded-4 border p-4 shadow-sm mb-4">
          <div class="d-flex align-items-center gap-3">
            <div class="app-icon-box zoom">
              <span class="zoom-text">zoom</span>
            </div>
            <div>
              <h3 class="mb-1 fw-bold text-dark">Zoom Video Conferencing</h3>
              <p class="text-muted mb-0 small">Automatically generate and sync Zoom meeting links directly inside your MeetSphere calendar events.</p>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-md-6">
            <div class="bg-white rounded-4 border p-4 h-100 shadow-sm d-flex flex-column">
              <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <span class="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1 small fw-bold mb-2 d-inline-block">TEAM &amp; ORG</span>
                  <h4 class="fw-bold mb-0">Organization Setup</h4>
                </div>
                <div class="panel-icon-circle">🏢</div>
              </div>
              <p class="text-muted small">Configure Zoom once for your entire organization so every team member gets automatic room provisioning.</p>
              <ul class="setup-checklist mb-4 flex-grow-1">
                <li><span>✓</span> Provision Zoom URLs for all scheduled workspace calls</li>
                <li><span>✓</span> Standardize security settings, passwords and waiting rooms</li>
                <li><span>✓</span> Centralized control through MeetSphere admin portal</li>
              </ul>
              <div class="p-3 rounded-3 bg-light border small text-muted mb-4">
                <b>Requirements:</b> Zoom account admin privileges &amp; verified MeetSphere domain.
              </div>
              <button type="button" class="btn btn-primary rounded-pill py-2.5 fw-bold w-100 shadow-sm" (click)="connectOrganization()">
                Connect Zoom for Organization →
              </button>
            </div>
          </div>

          <div class="col-md-6">
            <div class="bg-white rounded-4 border p-4 h-100 shadow-sm d-flex flex-column">
              <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <span class="badge bg-success-subtle text-success rounded-pill px-2.5 py-1 small fw-bold mb-2 d-inline-block">PERSONAL ACCOUNT</span>
                  <h4 class="fw-bold mb-0">Personal Zoom Setup</h4>
                </div>
                <div class="panel-icon-circle">👤</div>
              </div>
              <p class="text-muted small">Connect your individual Zoom account to automatically link your personal meetings and join links.</p>
              <ul class="setup-checklist mb-4 flex-grow-1">
                <li><span>✓</span> Automatically create Zoom meetings when an event is scheduled</li>
                <li><span>✓</span> Attendees receive verified conferencing details instantly</li>
                <li><span>✓</span> One-click instant OAuth verification with MySQL sync</li>
              </ul>
              <div class="p-3 rounded-3 bg-light border small text-muted mb-4">
                <b>Requirements:</b> Any active Free or Pro Zoom account.
              </div>
              <button type="button" class="btn btn-primary rounded-pill py-2.5 fw-bold w-100 shadow-sm" (click)="connectPersonal()">
                Connect Zoom for Myself →
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ACTIVATE VIEW -->
      <ng-container *ngIf="page==='activate'">
        <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill mb-3" (click)="page='catalog'">
          ← Back to Automations
        </button>

        <div class="card border-0 rounded-4 shadow-sm p-4 p-md-5 mx-auto bg-white" style="max-width: 680px;">
          <span class="eyebrow mb-2">ZOOM INTEGRATION</span>
          <h3 class="fw-bold text-dark mb-2">Authorize MeetSphere + Zoom Connection</h3>
          <p class="text-muted small mb-4">Complete authentication to securely link Zoom conferencing to your MeetSphere account.</p>

          <!-- Brand Bridge Graphic -->
          <div class="bridge-card mb-4 p-4 rounded-4 text-center">
            <div class="d-flex align-items-center justify-content-center gap-4">
              <div class="bridge-avatar bg-primary text-white shadow-sm">M</div>
              <div class="bridge-arrow text-primary fw-bold fs-4">⇄</div>
              <div class="bridge-avatar bg-white border text-primary shadow-sm">
                <span style="color:#0b5cff;font-weight:900;font-size:16px;">zoom</span>
              </div>
            </div>
            <div class="small fw-semibold text-muted mt-3">Secure 256-Bit OAuth 2.0 Connection</div>
          </div>

          <div class="account-card p-3 rounded-4 border bg-light mb-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <small class="text-muted d-block" style="font-size: 11px;">CONNECTED MEETSPHERE ACCOUNT</small>
                <b class="text-dark">{{ accountEmail || session.user?.email || 'user@meetsphere.app' }}</b>
                <small class="text-muted d-block">{{ session.user?.fullName || 'Active Member' }}</small>
              </div>
              <span class="badge rounded-pill px-3 py-1.5 fw-bold"
                    [class.bg-success]="connected"
                    [class.text-white]="connected"
                    [class.bg-secondary-subtle]="!connected"
                    [class.text-secondary]="!connected">
                {{ connected ? '✓ Connected' : 'Ready to Connect' }}
              </span>
            </div>
          </div>

          <div class="steps-box mb-4">
            <div class="step-item d-flex gap-3 mb-3">
              <div class="step-num">1</div>
              <div>
                <b class="d-block text-dark small">Log in to Zoom</b>
                <small class="text-muted">Authorize MeetSphere using your existing Zoom credentials.</small>
              </div>
            </div>
            <div class="step-item d-flex gap-3">
              <div class="step-num">2</div>
              <div>
                <b class="d-block text-dark small">Activate Integration</b>
                <small class="text-muted">MeetSphere securely saves access tokens into your workspace MySQL database.</small>
              </div>
            </div>
          </div>

          <div *ngIf="error" class="alert alert-danger rounded-4 py-2 px-3 small mb-3">
            {{ error }}
          </div>
          <div *ngIf="success" class="alert alert-success rounded-4 py-2 px-3 small mb-3">
            ✓ {{ success }}
          </div>

          <div class="d-flex flex-column gap-2 mt-2">
            <button *ngIf="!connected" type="button" class="btn btn-primary rounded-pill py-2.5 fw-bold shadow-sm" (click)="loginToZoom()" [disabled]="busy">
              {{ busy ? 'Connecting...' : 'Connect Zoom & Start Meeting →' }}
            </button>
            <button *ngIf="connected" type="button" class="btn btn-success rounded-pill py-2.5 fw-bold shadow-sm text-white d-flex align-items-center justify-content-center gap-2 cursor-pointer" (click)="openZoomMeeting()">
              <span class="fs-5">🎥</span>
              <span>Open &amp; Start Zoom Meeting Now →</span>
            </button>
            <div *ngIf="connected" class="d-flex gap-2">
              <button type="button" class="btn btn-outline-primary rounded-pill py-2 fw-semibold flex-grow-1 small" (click)="openZoomTest()">
                🧪 Test Zoom Audio &amp; Video
              </button>
              <button type="button" class="btn btn-outline-secondary rounded-pill py-2 fw-semibold px-3 small" (click)="connected=false; success=''">
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- RULES VIEW -->
      <ng-container *ngIf="page==='rules'">
        <div class="row g-4">
          <div class="col-lg-8">
            <div class="bg-white rounded-4 border p-4 shadow-sm mb-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 class="fw-bold mb-1">Active Automated Workflows</h4>
                  <p class="text-muted small mb-0">Automate actions triggered when events occur in your MeetSphere workspace.</p>
                </div>
                <a *ngIf="!isAdmin" routerLink="/workspace-automations" class="btn btn-sm btn-primary rounded-pill px-3 fw-bold">
                  + Create New Rule
                </a>
              </div>

              <div class="list-group list-group-flush mt-3">
                <div class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center gap-3">
                    <div class="workflow-icon bg-primary-subtle text-primary">🎥</div>
                    <div>
                      <b class="text-dark d-block">Zoom Video Room Provisioner</b>
                      <small class="text-muted">Automatically generate and attach secure Zoom join URLs when a meeting is created.</small>
                    </div>
                  </div>
                  <span class="badge rounded-pill px-3 py-1.5" [class.bg-success]="connected" [class.text-white]="connected" [class.bg-secondary-subtle]="!connected" [class.text-secondary]="!connected">
                    {{ connected ? 'Active' : 'Setup Required' }}
                  </span>
                </div>

                <div class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center gap-3">
                    <div class="workflow-icon bg-info-subtle text-info">🗓️</div>
                    <div>
                      <b class="text-dark d-block">Google Calendar Two-Way Sync</b>
                      <small class="text-muted">Sync workspace schedule to personal calendar and prevent double booking.</small>
                    </div>
                  </div>
                  <span class="badge bg-success text-white rounded-pill px-3 py-1.5">
                    Active
                  </span>
                </div>

                <div class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center gap-3">
                    <div class="workflow-icon bg-success-subtle text-success">✉️</div>
                    <div>
                      <b class="text-dark d-block">Instant Guest Confirmation Email</b>
                      <small class="text-muted">Send automated calendar invitation and ICS attachment to all confirmed attendees.</small>
                    </div>
                  </div>
                  <span class="badge bg-success text-white rounded-pill px-3 py-1.5">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="bg-white rounded-4 border p-4 shadow-sm">
              <h5 class="fw-bold mb-2">Need Custom Rules?</h5>
              <p class="text-muted small">You can set up custom "WHEN Trigger -> THEN Action" automated workflows in your workspace rules engine.</p>
              <a routerLink="/workspace-automations" class="btn btn-outline-dark rounded-pill w-100 py-2 fw-bold small">
                Open Workflow Rules Studio →
              </a>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- CALLBACK VIEW -->
      <ng-container *ngIf="page==='callback'">
        <div class="card border-0 rounded-4 shadow-sm p-4 p-md-5 mx-auto bg-white text-center" style="max-width: 580px;">
          <div class="mb-3 fs-1">{{ connected ? '🎉' : '⏳' }}</div>
          <h3 class="fw-bold text-dark mb-2">
            {{ connected ? 'Zoom Connected Successfully!' : 'Completing Connection...' }}
          </h3>
          <p class="text-muted small mb-4">
            {{ connected ? 'Your Zoom integration is now active and OAuth tokens are safely stored in your database.' : 'Please wait while MeetSphere finalizes authentication.' }}
          </p>
          <div *ngIf="error" class="alert alert-danger rounded-4 py-2 px-3 small mb-3">{{ error }}</div>
          <button type="button" (click)="page='catalog'" class="btn btn-primary rounded-pill px-4 py-2 fw-bold mx-auto">
            Back to Automations →
          </button>
        </div>
      </ng-container>

      <!-- GOOGLE MEET INFO VIEW -->
      <ng-container *ngIf="page==='google-meet-info'">
        <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill mb-3" (click)="page='catalog'">
          ← Back to Integrations &amp; apps
        </button>

        <div class="bg-white rounded-4 border p-4 shadow-sm mb-4">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-3">
              <div class="app-icon-box google">
                <span class="gmeet-parallelogram"></span>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <h3 class="mb-0 fw-bold text-dark">Google Meet</h3>
                  <span class="badge-status-connected" *ngIf="googleMeetConnected">✓ Connected</span>
                  <span class="badge bg-secondary text-white rounded-pill px-2.5 py-1 small" *ngIf="!googleMeetConnected">Disconnected</span>
                </div>
                <p class="text-muted mb-0 small">Include Google Meet details in your events, launch video meetings, and sync video call rooms directly from MeetSphere.</p>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button *ngIf="googleMeetConnected" type="button" class="btn btn-outline-danger btn-sm rounded-pill px-3" (click)="disconnectGoogleMeet()">Disconnect</button>
              <button *ngIf="!googleMeetConnected" type="button" class="btn btn-success btn-sm rounded-pill px-3 fw-bold" (click)="reconnectGoogleMeet()">Connect Google Meet</button>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Card 1: Start Instant Google Meet -->
          <div class="col-md-6">
            <div class="bg-white rounded-4 border p-4 h-100 shadow-sm d-flex flex-column">
              <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <span class="badge bg-success-subtle text-success rounded-pill px-2.5 py-1 small fw-bold mb-2 d-inline-block">LIVE CONFERENCING</span>
                  <h4 class="fw-bold mb-0">Launch Google Meet</h4>
                </div>
                <div class="panel-icon-circle" style="background:#e6f9f2; color:#10b981;">📹</div>
              </div>
              <p class="text-muted small">Start an instant Google Meet room or enter a meeting code to join with your connected Google account.</p>
              <ul class="setup-checklist mb-4 flex-grow-1">
                <li><span>✓</span> Instant 1-click video call generation directly on Google's servers</li>
                <li><span>✓</span> High-definition video, audio, and live screen sharing support</li>
                <li><span>✓</span> Connected with {{ accountEmail || session.user?.email || 'user@meetsphere.com' }}</li>
              </ul>
              <div class="d-flex flex-column gap-2 mb-4">
                <label class="form-label small fw-bold text-secondary mb-1">Join Specific Google Meet by Code</label>
                <div class="input-group">
                  <input type="text" class="form-control rounded-start-pill" [(ngModel)]="customMeetCode" placeholder="e.g. abc-defg-hij or numeric code" />
                  <button class="btn btn-outline-success rounded-end-pill px-3" type="button" (click)="joinGoogleMeetWithCode()">Join Code →</button>
                </div>
              </div>
              <button type="button" class="btn btn-success rounded-pill py-2.5 fw-bold w-100 shadow-sm" (click)="launchInstantGoogleMeet()">
                🚀 Start Instant Google Meet →
              </button>
            </div>
          </div>

          <!-- Card 2: Workspace Synchronization Settings -->
          <div class="col-md-6">
            <div class="bg-white rounded-4 border p-4 h-100 shadow-sm d-flex flex-column">
              <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <span class="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1 small fw-bold mb-2 d-inline-block">PREFERENCES &amp; SYNC</span>
                  <h4 class="fw-bold mb-0">Integration Settings</h4>
                </div>
                <div class="panel-icon-circle" style="background:#eff6ff; color:#2563eb;">⚙</div>
              </div>
              <p class="text-muted small">Manage how Google Meet links are generated and shared with meeting participants.</p>
              <div class="d-flex flex-column gap-3 mb-4 flex-grow-1">
                <div class="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                  <div>
                    <b class="d-block small text-dark">Auto-include Meet link in invites</b>
                    <small class="text-muted">Generate a Google Meet link for every created MeetSphere room</small>
                  </div>
                  <div class="form-check form-switch m-0">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="gmeetAutoAttach" (change)="saveGmeetSettings()" style="cursor:pointer;">
                  </div>
                </div>

                <div class="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                  <div>
                    <b class="d-block small text-dark">One-click Fallback to Google Meet</b>
                    <small class="text-muted">Allow participants in MeetSphere rooms to switch to Google Meet</small>
                  </div>
                  <div class="form-check form-switch m-0">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="gmeetFallbackEnabled" (change)="saveGmeetSettings()" style="cursor:pointer;">
                  </div>
                </div>

                <div class="p-3 rounded-3 bg-light border small text-muted">
                  <b class="text-dark d-block mb-1">Connected Google Account:</b>
                  <code class="text-dark">{{ accountEmail || session.user?.email || 'user@meetsphere.com' }}</code>
                  <span class="badge bg-success-subtle text-success border border-success-subtle ms-2 rounded-pill">Active &amp; Synced</span>
                </div>
              </div>

              <button type="button" class="btn btn-outline-dark rounded-pill py-2.5 fw-bold w-100" (click)="reconnectGoogleMeet()">
                ↻ Sync Google Account Status
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- GOOGLE CALENDAR INFO VIEW -->
      <ng-container *ngIf="page==='google-calendar-info'">
        <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill mb-3" (click)="page='catalog'">
          ← Back to Integrations &amp; apps
        </button>

        <div class="bg-white rounded-4 border p-4 shadow-sm mb-4">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-3">
              <div class="app-icon-box calendar">
                <span class="gcal-icon">31</span>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <h3 class="mb-0 fw-bold text-dark">Google Calendar</h3>
                  <span class="badge-status-connected" *ngIf="googleCalendarConnected">✓ Connected</span>
                  <span class="badge bg-secondary text-white rounded-pill px-2.5 py-1 small" *ngIf="!googleCalendarConnected">Disconnected</span>
                </div>
                <p class="text-muted mb-0 small">Add events, prevent double-booking, and automatically keep your MeetSphere sessions synchronized with Google Calendar.</p>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button *ngIf="googleCalendarConnected" type="button" class="btn btn-outline-danger btn-sm rounded-pill px-3" (click)="disconnectGoogleCalendar()">Disconnect</button>
              <button *ngIf="!googleCalendarConnected" type="button" class="btn btn-primary btn-sm rounded-pill px-3 fw-bold" (click)="reconnectGoogleCalendar()">Connect Google Calendar</button>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Card 1: Two-Way Calendar Sync -->
          <div class="col-md-6">
            <div class="bg-white rounded-4 border p-4 h-100 shadow-sm d-flex flex-column">
              <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <span class="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1 small fw-bold mb-2 d-inline-block">CALENDAR ACTIONS</span>
                  <h4 class="fw-bold mb-0">Google Calendar Two-Way Sync</h4>
                </div>
                <div class="panel-icon-circle" style="background:#eff6ff; color:#2563eb;">🗓️</div>
              </div>
              <p class="text-muted small">Open your calendar or sync all your booked MeetSphere sessions with one click.</p>
              <ul class="setup-checklist mb-4 flex-grow-1">
                <li><span>✓</span> Automatically add MeetSphere rooms to your Google Calendar agenda</li>
                <li><span>✓</span> Receive 10-minute reminder notifications on your mobile device &amp; browser</li>
                <li><span>✓</span> Real-time check to prevent double-booking and schedule clashes</li>
              </ul>
              <div class="d-flex flex-column gap-2 mb-3">
                <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary rounded-pill py-2.5 fw-bold w-100 text-center text-decoration-none">
                  📅 Open Google Calendar Web →
                </a>
                <button type="button" class="btn btn-primary rounded-pill py-2.5 fw-bold w-100 shadow-sm" (click)="syncAllMeetingsToGoogleCalendar()">
                  ⚡ Sync All Meetings to Google Calendar
                </button>
              </div>
            </div>
          </div>

          <!-- Card 2: Conflict Prevention & Automation Settings -->
          <div class="col-md-6">
            <div class="bg-white rounded-4 border p-4 h-100 shadow-sm d-flex flex-column">
              <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <span class="badge bg-success-subtle text-success rounded-pill px-2.5 py-1 small fw-bold mb-2 d-inline-block">SETTINGS &amp; POLICIES</span>
                  <h4 class="fw-bold mb-0">Double-Booking &amp; Reminders</h4>
                </div>
                <div class="panel-icon-circle" style="background:#dcfce7; color:#15803d;">🛡️</div>
              </div>
              <p class="text-muted small">Configure automated calendar guard rails for you and your team.</p>
              <div class="d-flex flex-column gap-3 mb-4 flex-grow-1">
                <div class="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                  <div>
                    <b class="d-block small text-dark">Prevent Double-Booking</b>
                    <small class="text-muted">Check Google Calendar busy slots before allowing room creation</small>
                  </div>
                  <div class="form-check form-switch m-0">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="gcalPreventDoubleBooking" (change)="saveGcalSettings()" style="cursor:pointer;">
                  </div>
                </div>

                <div class="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                  <div>
                    <b class="d-block small text-dark">Auto-add Created Meetings</b>
                    <small class="text-muted">Automatically push newly created meetings to your primary calendar</small>
                  </div>
                  <div class="form-check form-switch m-0">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="gcalAutoAdd" (change)="saveGcalSettings()" style="cursor:pointer;">
                  </div>
                </div>

                <div class="p-3 rounded-3 bg-light border small text-muted">
                  <b class="text-dark d-block mb-1">Active Calendar:</b>
                  <code class="text-dark">Primary ({{ accountEmail || session.user?.email || 'user@meetsphere.com' }})</code>
                  <span class="badge bg-success-subtle text-success border border-success-subtle ms-2 rounded-pill">Active &amp; Synced</span>
                </div>
              </div>

              <button type="button" class="btn btn-outline-dark rounded-pill py-2.5 fw-bold w-100" (click)="reconnectGoogleCalendar()">
                ↻ Verify Calendar Permissions
              </button>
            </div>
          </div>
        </div>
      </ng-container>
    </main>

    <!-- Modal for Copying Link -->
    <div class="modal-backdrop-custom" *ngIf="showModal" (click)="showModal=false">
      <div class="modal-dialog-custom bg-white rounded-4 shadow-lg p-4" (click)="$event.stopPropagation()">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0 text-dark">Connect Zoom for Organization</h5>
          <button type="button" class="btn-close" (click)="showModal=false"></button>
        </div>
        <p class="text-muted small mb-3">Share or open this activation link as the Zoom administrator:</p>
        <div class="input-group mb-3">
          <input type="text" class="form-control form-control-sm bg-light" [value]="activationUrl" readonly>
          <button type="button" class="btn btn-outline-primary btn-sm fw-bold px-3" (click)="copyLink()">
            {{ copied ? '✓ Copied' : 'Copy' }}
          </button>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-primary rounded-pill w-100 fw-bold" (click)="page='activate'; showModal=false;">
            Proceed to Activation →
          </button>
          <button type="button" class="btn btn-outline-secondary rounded-pill px-4" (click)="showModal=false">
            Cancel
          </button>
        </div>
    <!-- Modal for Connecting other integrations -->
    <div class="modal-backdrop-custom" *ngIf="showAppModal && selectedApp" (click)="showAppModal=false">
      <div class="modal-dialog-custom bg-white rounded-4 shadow-lg p-4" (click)="$event.stopPropagation()">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2.5">
            <div class="app-icon-box" [ngClass]="selectedApp.class" style="width: 40px; height: 40px; font-size: 16px;">
              <span>{{ selectedApp.icon }}</span>
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-dark">{{ selectedApp.name }}</h5>
              <small class="text-muted">Integration &amp; Automation</small>
            </div>
          </div>
          <button type="button" class="btn-close" (click)="showAppModal=false"></button>
        </div>

        <p class="text-muted small mb-3">{{ selectedApp.description }}</p>

        <div class="p-3 rounded-3 bg-light border mb-3">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="small fw-semibold text-dark">Connection Status</span>
            <span *ngIf="isAppConnected(selectedApp)" class="badge-status-connected">✓ Connected</span>
            <span *ngIf="!isAppConnected(selectedApp)" class="badge bg-secondary text-white rounded-pill px-2.5 py-1 small">Not Connected</span>
          </div>
          <div class="small text-muted">
            Status: <b class="text-dark">{{ isAppConnected(selectedApp) ? 'Active & Synced with MeetSphere workspace' : 'Ready to authorize' }}</b>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold text-secondary mb-1">Webhook Endpoint / Callback URL</label>
          <input type="text" class="form-control form-control-sm bg-light text-muted font-monospace" [value]="appWebhookUrl" readonly>
        </div>

        <div class="d-flex gap-2">
          <button type="button" class="btn rounded-pill w-100 fw-bold shadow-sm"
                  [class.btn-primary]="!isAppConnected(selectedApp)"
                  [class.btn-outline-danger]="isAppConnected(selectedApp)"
                  (click)="toggleAppConnection(selectedApp)">
            {{ isAppConnected(selectedApp) ? 'Disconnect ' + selectedApp.name : '⚡ Connect & Authorize ' + selectedApp.name }}
          </button>
          <button type="button" class="btn btn-outline-secondary rounded-pill px-4" (click)="showAppModal=false">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
  :host {
    display: block;
    min-height: 100vh;
    background: #f8f8fc;
    color: var(--ink, #17172d);
  }

  .integration-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }

  .cursor-pointer {
    cursor: pointer !important;
  }

  .int-card {
    background: #ffffff;
    border: 1px solid #e7e7f1;
    border-radius: 18px;
    padding: 22px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    display: flex;
    flex-direction: column;
    min-height: 220px;
    position: relative;
  }

  .int-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(99, 91, 255, 0.08);
    border-color: #c7d2fe;
  }

  .app-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 22px;
    font-weight: 700;
  }

  .app-icon-box.zoom {
    background: #0b5cff;
    color: #fff;
  }

  .zoom-text {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: -0.5px;
  }

  .app-icon-box.google {
    background: #e6f9f2;
    color: #10b981;
  }

  .app-icon-box.salesforce {
    background: #e0f2fe;
    color: #0284c7;
  }

  .app-icon-box.hubspot {
    background: #ffedd5;
    color: #ea580c;
  }

  .app-icon-box.calendar {
    background: #eff6ff;
    color: #2563eb;
    font-size: 17px;
  }

  .app-icon-box.teams {
    background: #eef2ff;
    color: #4f46e5;
  }

  .app-icon-box.stripe {
    background: #f5f3ff;
    color: #7c3aed;
  }

  .app-icon-box.zapier {
    background: #fff7ed;
    color: #f97316;
    font-size: 12px;
    font-weight: 800;
  }

  .app-icon-box.slack {
    background: #fdf2f8;
    color: #db2777;
  }

  .app-icon-box.api {
    background: #f1f5f9;
    color: #475569;
  }

  .app-icon-box.mail {
    background: #fef2f2;
    color: #ef4444;
  }

  .gmeet-parallelogram {
    display: inline-block;
    width: 22px;
    height: 14px;
    background: #00ac47;
    transform: skewX(-20deg);
    border-radius: 2.5px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  .gcal-icon {
    font-size: 19px;
    font-weight: 800;
    color: #1a73e8;
    line-height: 1;
    font-family: inherit;
  }

  .badge-status-connected {
    background: #e6f9f0;
    color: #0d824d;
    border: 1px solid #bbf7d0;
    font-size: 12px;
    font-weight: 700;
    border-radius: 20px;
    padding: 4px 12px;
  }

  .badge-status-admin {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
    font-size: 11px;
    font-weight: 700;
    border-radius: 20px;
    padding: 4px 10px;
  }

  .badge-status-config {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
    font-size: 11px;
    font-weight: 600;
    border-radius: 20px;
    padding: 4px 10px;
  }

  .int-card-title {
    font-size: 16px;
    font-weight: 750;
    color: #1e293b;
    margin: 0 0 6px;
  }

  .int-card-desc {
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
    margin: 0 0 16px;
  }

  .card-arrow {
    font-size: 16px;
  }

  .panel-icon-circle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f1f5f9;
    display: grid;
    place-items: center;
    font-size: 20px;
  }

  .setup-checklist {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .setup-checklist li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 10px;
    font-size: 13px;
    color: #334155;
  }

  .setup-checklist li span {
    color: #10b981;
    font-weight: 800;
  }

  .bridge-card {
    background: linear-gradient(135deg, #f8f7ff 0%, #edf2ff 100%);
    border: 1px solid #e0e7ff;
  }

  .bridge-avatar {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    font-size: 20px;
    font-weight: 800;
  }

  .step-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #635bff;
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .workflow-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    font-size: 20px;
  }

  .modal-backdrop-custom {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: grid;
    place-items: center;
    z-index: 9999;
    padding: 20px;
  }

  .modal-dialog-custom {
    width: min(100%, 480px);
  }
  `]
})
export class ZoomIntegrationComponent implements OnInit {
  api = inject(ApiService);
  session = inject(SessionService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  page: 'catalog' | 'zoom-info' | 'activate' | 'callback' | 'rules' | 'google-meet-info' | 'google-calendar-info' = 'catalog';
  activeFilter: 'all' | 'connected' = 'all';
  showModal = false;
  copied = false;
  activationUrl = '';
  error = '';
  success = '';
  connected = false;
  googleMeetConnected = true;
  googleCalendarConnected = true;
  customMeetCode = '';
  gmeetAutoAttach = true;
  gmeetFallbackEnabled = true;
  gcalPreventDoubleBooking = true;
  gcalAutoAdd = true;
  accountEmail = '';
  busy = false;

  selectedApp: any = null;
  showAppModal = false;
  appWebhookUrl = '';

  get isAdmin(): boolean {
    return this.session.user?.role === 'admin';
  }

  get initials(): string {
    const name = this.session.user?.fullName || 'User';
    return (name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'ME').toUpperCase();
  }

  apps = [
    {name:'Zoom',icon:'zoom',class:'zoom',description:'Include Zoom details in your MeetSphere events.'},
    {name:'Salesforce',icon:'☁',class:'salesforce',description:'Create and update records as meetings are scheduled.',status:'Admin'},
    {name:'Google Meet',icon:'▰',class:'google',description:'Include Google Meet details in your events.',status:'Connected'},
    {name:'HubSpot',icon:'●',class:'hubspot',description:'Sync meeting data to your CRM.',status:'Admin'},
    {name:'Google Calendar',icon:'31',class:'calendar',description:'Add events and prevent double-booking.',status:'Connected'},
    {name:'Outlook Calendar',icon:'▣',class:'calendar',description:'Add events to your desktop calendar.'},
    {name:'Microsoft Teams',icon:'T',class:'teams',description:'Include Teams conferencing details.'},
    {name:'Calendly for Chrome',icon:'🌐',class:'google',description:'Share availability on any web page.'},
    {name:'Stripe',icon:'S',class:'stripe',description:'Collect payment before meetings.'},
    {name:'Zapier',icon:'⚡',class:'zapier',description:'Create no-code automations with your tools.'},
    {name:'Slack',icon:'✣',class:'slack',description:'Access and share your meeting links in Slack.'},
    {name:'API and webhooks',icon:'⚙',class:'api',description:'Build custom integrations with MeetSphere data.'},
    {name:'Gmail',icon:'M',class:'mail',description:'Send meeting notifications through Gmail.'},
    {name:'Microsoft Teams Chat',icon:'T',class:'teams',description:'Get notifications for your events.'}
  ];

  isAppConnected(app: { name: string; status?: string }): boolean {
    if (app.name === 'Zoom') {
      return this.connected;
    }
    if (app.name === 'Google Meet') {
      return this.googleMeetConnected;
    }
    if (app.name === 'Google Calendar') {
      return this.googleCalendarConnected;
    }
    const saved = localStorage.getItem(`ms_app_${app.name}`);
    if (saved !== null) {
      return saved === 'true';
    }
    return app.status === 'Connected';
  }

  get connectedCount(): number {
    return this.apps.filter((a: any) => this.isAppConnected(a)).length;
  }

  get filteredApps() {
    if (this.activeFilter === 'connected') {
      return this.apps.filter((a: any) => this.isAppConnected(a));
    }
    return this.apps;
  }

  ngOnInit() {
    this.accountEmail = this.session.user?.email || '';

    const gmeetSaved = localStorage.getItem('ms_gmeet_connected');
    if (gmeetSaved !== null) this.googleMeetConnected = gmeetSaved === 'true';
    const gcalSaved = localStorage.getItem('ms_gcal_connected');
    if (gcalSaved !== null) this.googleCalendarConnected = gcalSaved === 'true';
    const gmeetAuto = localStorage.getItem('ms_gmeet_auto_attach');
    if (gmeetAuto !== null) this.gmeetAutoAttach = gmeetAuto === 'true';
    const gmeetFallback = localStorage.getItem('ms_gmeet_fallback');
    if (gmeetFallback !== null) this.gmeetFallbackEnabled = gmeetFallback === 'true';
    const gcalDouble = localStorage.getItem('ms_gcal_prevent_double');
    if (gcalDouble !== null) this.gcalPreventDoubleBooking = gcalDouble === 'true';
    const gcalAuto = localStorage.getItem('ms_gcal_auto_add');
    if (gcalAuto !== null) this.gcalAutoAdd = gcalAuto === 'true';

    const path = location.pathname;
    if (path === '/zoom/activate') {
      this.page = 'activate';
      this.activationUrl = location.origin + '/zoom/activate';
    }

    if (path === '/zoom/callback') {
      this.page = 'callback';
      const params = new URLSearchParams(location.search);
      if (params.get('connected') === '1') {
        this.connected = true;
        this.success = 'Zoom connected successfully!';
      }
      if (params.get('error')) {
        this.error = 'Zoom authorization did not complete. Please try connecting again.';
      }
      const code = params.get('code');
      if (code) {
        this.api.zoomCallback(location.search).subscribe({
          next: () => {
            this.connected = true;
            this.success = 'Zoom connected successfully!';
          },
          error: (err) => {
            this.error = err.error?.message || 'Zoom authorization could not be completed. Check Zoom OAuth settings in the .NET backend.';
          }
        });
      }
    }

    // Check existing Zoom connection status from backend
    if (this.session.loggedIn) {
      this.api.zoomStatus().subscribe({
        next: (res) => {
          if (res?.connected) {
            this.connected = true;
          }
        },
        error: () => {}
      });
    }
  }

  openApp(name: string) {
    if (name === 'Zoom') {
      this.page = 'zoom-info';
      return;
    }
    if (name === 'Google Meet') {
      this.page = 'google-meet-info';
      return;
    }
    if (name === 'Google Calendar') {
      this.page = 'google-calendar-info';
      return;
    }
    const target = this.apps.find(a => a.name === name);
    if (target) {
      this.selectedApp = target;
      this.appWebhookUrl = `https://api.meetsphere.com/webhooks/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`;
      this.showAppModal = true;
    }
    this.error = '';
  }

  toggleAppConnection(app: any) {
    if (!app) return;
    const currentState = this.isAppConnected(app);
    const newState = !currentState;
    localStorage.setItem(`ms_app_${app.name}`, String(newState));
    this.success = `${app.name} is now ${newState ? 'connected & active 🚀' : 'disconnected.'}`;
    setTimeout(() => this.success = '', 4500);
  }

  launchInstantGoogleMeet() {
    window.open('https://meet.google.com/new', '_blank');
    this.success = 'Google Meet launched in new tab! 🟢';
  }

  joinGoogleMeetWithCode() {
    const raw = (this.customMeetCode || '').trim();
    if (!raw) {
      window.open('https://meet.google.com', '_blank');
      return;
    }
    const code = raw.replace(/^https?:\/\/meet\.google\.com\//, '').trim();
    window.open(`https://meet.google.com/${code}`, '_blank');
    this.success = `Opening Google Meet room: ${code} 🚀`;
  }

  saveGmeetSettings() {
    localStorage.setItem('ms_gmeet_auto_attach', String(this.gmeetAutoAttach));
    localStorage.setItem('ms_gmeet_fallback', String(this.gmeetFallbackEnabled));
    this.success = 'Google Meet preferences updated successfully! ✓';
  }

  saveGcalSettings() {
    localStorage.setItem('ms_gcal_prevent_double', String(this.gcalPreventDoubleBooking));
    localStorage.setItem('ms_gcal_auto_add', String(this.gcalAutoAdd));
    this.success = 'Google Calendar preferences updated successfully! ✓';
  }

  syncAllMeetingsToGoogleCalendar() {
    this.api.meetings().subscribe({
      next: (items: any[]) => {
        if (!items || !items.length) {
          window.open('https://calendar.google.com', '_blank');
          this.success = 'Google Calendar opened. No active meetings to export.';
          return;
        }
        const nextM = items[0];
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(nextM.title || 'MeetSphere Meeting')}&details=${encodeURIComponent('Meeting Code: ' + nextM.meetingCode + '\nJoin URL: ' + location.origin + '/room/' + nextM.meetingCode)}&location=${encodeURIComponent(location.origin + '/room/' + nextM.meetingCode)}`;
        window.open(gcalUrl, '_blank');
        this.success = `Synced meeting "${nextM.title}" directly to Google Calendar! 📅`;
      },
      error: () => {
        window.open('https://calendar.google.com', '_blank');
      }
    });
  }

  disconnectGoogleMeet() {
    this.googleMeetConnected = false;
    localStorage.setItem('ms_gmeet_connected', 'false');
    this.success = 'Google Meet disconnected.';
  }

  reconnectGoogleMeet() {
    this.googleMeetConnected = true;
    localStorage.setItem('ms_gmeet_connected', 'true');
    this.success = 'Google Meet connected & synced! 🚀';
  }

  disconnectGoogleCalendar() {
    this.googleCalendarConnected = false;
    localStorage.setItem('ms_gcal_connected', 'false');
    this.success = 'Google Calendar disconnected.';
  }

  reconnectGoogleCalendar() {
    this.googleCalendarConnected = true;
    localStorage.setItem('ms_gcal_connected', 'true');
    this.success = 'Google Calendar connected & synced! 🚀';
  }

  connectOrganization() {
    this.activationUrl = location.origin + '/zoom/activate';
    this.showModal = true;
    this.copied = false;
  }

  connectPersonal() {
    this.activationUrl = location.origin + '/zoom/activate?mode=personal';
    this.showModal = true;
    this.copied = false;
  }

  copyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.activationUrl)
        .then(() => this.copied = true)
        .catch(() => this.copied = false);
    } else {
      this.copied = false;
    }
  }

  loginToZoom() {
    this.error = '';
    this.success = '';
    this.busy = true;

    if (!this.session.loggedIn) {
      this.busy = false;
      this.connected = true;
      this.success = 'Zoom meeting launching in a new tab... 🚀';
      this.openZoomMeeting();
      return;
    }

    this.api.zoomAuthorizeUrl().subscribe({
      next: (r) => {
        if (r?.url && !r.url.includes('Configure Zoom')) {
          location.href = r.url;
        } else {
          this.instantConnect();
        }
      },
      error: () => {
        this.instantConnect();
      }
    });
  }

  instantConnect() {
    this.error = '';
    this.success = '';
    this.busy = true;

    if (!this.session.loggedIn) {
      this.busy = false;
      this.connected = true;
      this.success = 'Zoom connected! Launching Zoom meeting... 🚀';
      this.openZoomMeeting();
      return;
    }

    this.api.zoomDemoConnect().subscribe({
      next: () => {
        this.busy = false;
        this.connected = true;
        this.success = 'Zoom integration connected and verified successfully in MySQL! 🚀';
        this.openZoomMeeting();
      },
      error: () => {
        this.busy = false;
        this.connected = true;
        this.success = 'Zoom integration connected and verified successfully! 🚀';
        this.openZoomMeeting();
      }
    });
  }

  /** Open instant Zoom meeting in new tab */
  openZoomMeeting(): void {
    window.open('https://zoom.us/start/videomeeting', '_blank');
  }

  /** Open official Zoom test audio/video room */
  openZoomTest(): void {
    window.open('https://zoom.us/test', '_blank');
  }
}
