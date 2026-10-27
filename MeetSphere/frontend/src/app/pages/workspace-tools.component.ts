import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, SessionService } from '../services';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="app-shell">
  <aside class="sidebar">
    <a class="brand side-brand" [routerLink]="isAdmin ? '/admin' : '/dashboard'"><span class="brand-icon" [class.bg-danger]="isAdmin" [class.text-white]="isAdmin">M</span> MeetSphere</a>
    <div class="side-label" [class.text-danger]="isAdmin">{{isAdmin ? 'ADMIN CONSOLE' : 'WORKSPACE'}}</div>
    <nav class="sidebar-nav">
      <a class="side-link" [routerLink]="isAdmin ? '/admin' : '/dashboard'">▦ &nbsp; {{isAdmin?'Overview & Control':'Overview'}}</a>
      <a *ngIf="isAdmin" class="side-link" routerLink="/admin" fragment="login-logs">🔐 &nbsp; User Logins &amp; Errors</a>
      <a *ngIf="!isAdmin" class="side-link" routerLink="/discover">◈ &nbsp; Discover meetings</a>
      <a class="side-link" [class.active]="tool==='calendar'" [routerLink]="isAdmin?'/admin-tools/calendar':'/calendar'">▣ &nbsp; Calendar</a>
      <a class="side-link" [class.active]="tool==='notes'" [routerLink]="isAdmin?'/admin-tools/notes':'/notetaker'">◩ &nbsp; Notetaker</a>
      <a class="side-link" [class.active]="tool==='contacts'" [routerLink]="isAdmin?'/admin-tools/contacts':'/contacts'">♧ &nbsp; Contacts</a>
      <a class="side-link" [class.active]="tool==='automations'" [routerLink]="isAdmin?'/admin-tools/automations':'/automations'">✣ &nbsp; Automations</a>
      <a *ngIf="!isAdmin" class="side-link" routerLink="/payment-history">₹ &nbsp; Payment history</a>
      <a *ngIf="!isAdmin" class="side-link" [class.active]="tool==='automations'" routerLink="/workspace-automations">✣ &nbsp; Workflow Rules</a>
      <a *ngIf="isAdmin" class="side-link" routerLink="/admin-payments">₹ &nbsp; Payments & Revenue</a>
      <a *ngIf="!isAdmin" class="side-link" [class.active]="tool==='brief'" routerLink="/meeting-brief">✧ &nbsp; Meeting Brief Studio</a>
      <a *ngIf="!isAdmin" class="side-link" [class.active]="tool==='readiness'" routerLink="/meeting-readiness">✓ &nbsp; Meeting Readiness</a>
      <a *ngIf="!isAdmin" class="side-link" [class.active]="tool==='cost'" routerLink="/meeting-cost">₹ &nbsp; Meeting Cost Planner</a>
      <a *ngIf="!isAdmin" class="side-link" [class.active]="tool==='conflicts'" routerLink="/calendar-conflicts">◷ &nbsp; Conflict Finder</a>
      <a *ngIf="!isAdmin" class="side-link" [class.active]="tool==='actions'" routerLink="/follow-up-actions">☑ &nbsp; Action Tracker</a>
      <a *ngIf="!isAdmin" class="side-link" [class.active]="tool==='followup-message'" routerLink="/meeting-follow-up">✉ &nbsp; Follow-up Writer</a>
      <a *ngIf="!isAdmin" class="side-link" [class.active]="tool==='decision-ledger'" routerLink="/decision-ledger">◆ &nbsp; Decision Ledger</a>
      <a *ngIf="isAdmin" class="side-link" [class.active]="tool==='governance'" routerLink="/admin-tools/governance">◈ &nbsp; Governance Scorecard</a>
      <a *ngIf="isAdmin" class="side-link" [class.active]="tool==='security'" routerLink="/admin-tools/security">⛨ &nbsp; Policy Checklist</a>
      <a *ngIf="isAdmin" class="side-link" [class.active]="tool==='diagnostics'" routerLink="/admin-tools/diagnostics">◉ &nbsp; Live Diagnostics</a>
      <a *ngIf="isAdmin" class="side-link" [class.active]="tool==='capacity'" routerLink="/admin-tools/capacity">▥ &nbsp; Calendar Capacity</a>
      <a *ngIf="isAdmin" class="side-link" [class.active]="tool==='hygiene'" routerLink="/admin-tools/meeting-hygiene">✚ &nbsp; Meeting Health</a>
      <a *ngIf="isAdmin" class="side-link" [class.active]="tool==='exports'" routerLink="/admin-tools/exports">⇩ &nbsp; Export Center</a>
      <a *ngIf="isAdmin" class="side-link" [class.active]="tool==='workspace-control'" routerLink="/admin-tools/workspace-control">⚙ &nbsp; User Workspace Control</a>
      <a *ngIf="isAdmin" class="side-link" [class.active]="tool==='change-log'" routerLink="/admin-tools/change-log">◈ &nbsp; Change & Risk Log</a>
      <a *ngIf="!isAdmin" class="side-link" [class.active]="tool==='upgrade'" routerLink="/upgrade">⇧ &nbsp; Upgrade plan</a>
      <a class="side-link" [routerLink]="isAdmin?'/admin-settings':'/settings'">⚙ &nbsp; {{isAdmin?'Admin Settings':'Settings'}}</a>
    </nav>
    <div class="side-bottom mt-auto">
      <div class="d-flex align-items-center gap-2 mb-2 px-1"><span class="status-dot-green"></span><small class="text-muted fw-semibold" style="font-size:11px;">{{isAdmin?'Admin Console':'Server Online'}} · Active</small></div>
      <div class="profile-chip"><span class="profile-avatar" [class.bg-dark]="isAdmin" [class.text-white]="isAdmin">{{initials}}</span><div><b>{{session.user?.fullName}}</b><small [class.text-danger]="isAdmin" class="text-primary fw-bold">★ {{isAdmin?'Administrator':'Active Member'}}</small></div></div>
      <button class="side-link logout-link mt-1" (click)="session.logout()">↪ &nbsp; Log out</button>
    </div>
  </aside>

  <main class="workspace">
    <header class="workspace-top">
      <div>
        <span class="eyebrow" [class.text-danger]="isAdmin">{{isAdmin?'ADMIN WORKSPACE':'YOUR WORKSPACE'}}</span>
        <h2>{{title}} <span>{{icon}}</span></h2>
        <p>{{subtitle}}</p>
      </div>
      <a class="btn btn-outline-dark rounded-pill px-4" [routerLink]="isAdmin?'/admin':'/dashboard'">← Back</a>
    </header>

    <div *ngIf="message" class="alert alert-success rounded-4 border-0 shadow-sm">✓ {{message}}</div>
    <div *ngIf="error" class="alert alert-danger rounded-4">{{error}}</div>

    <ng-container [ngSwitch]="tool">
      <section *ngSwitchCase="'calendar'" class="w-100 mb-4">
        <div class="cal-view-shell">
          <!-- Main Heading matching Photo 6 -->
          <div class="text-center mb-3">
            <h2 class="cal-hero-schedule-title mb-1">MeetSphere Schedule</h2>
            <p class="text-muted small mb-0">Dynamic Workspace &amp; Events Calendar</p>
          </div>

          <!-- Photo 6 Month Navigation & Controls Bar -->
          <div class="cal-nav-bar-photo d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <!-- Left: < Month Year > and Today -->
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="cal-arrow-btn" (click)="prevGridMonth()" title="Previous month">
                ‹
              </button>
              <h4 class="cal-grid-month-heading mb-0 px-2 fw-bold">{{ gridMonthTitle }}</h4>
              <button type="button" class="cal-arrow-btn" (click)="nextGridMonth()" title="Next month">
                ›
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-3 ms-2 fw-semibold" (click)="goToTodayGrid()">
                Today
              </button>
            </div>

            <!-- Right: View switchers + Schedule Event Button -->
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <!-- View Switcher -->
              <div class="btn-group p-1 bg-light rounded-pill border">
                <button type="button" class="btn btn-sm rounded-pill px-3 fw-bold"
                        [class.btn-primary]="calViewMode === 'month'"
                        [class.text-muted]="calViewMode !== 'month'"
                        [class.bg-transparent]="calViewMode !== 'month'"
                        (click)="calViewMode = 'month'">
                  ▦ Month Schedule
                </button>
                <button type="button" class="btn btn-sm rounded-pill px-3 fw-bold"
                        [class.btn-primary]="calViewMode === 'agenda'"
                        [class.text-muted]="calViewMode !== 'agenda'"
                        [class.bg-transparent]="calViewMode !== 'agenda'"
                        (click)="calViewMode = 'agenda'">
                  ☰ Agenda List ({{ filteredCalendarItems.length }})
                </button>
              </div>

              <button type="button" class="btn btn-sm btn-primary rounded-pill px-3 fw-bold shadow-sm" (click)="openScheduleModal()">
                + Schedule event
              </button>
            </div>
          </div>

          <!-- Filter & Search Sub-toolbar -->
          <div class="cal-toolbar-sub d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 p-2 rounded-3 bg-light border">
            <div class="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
              <!-- Source Dropdown -->
              <div class="dropdown position-relative">
                <button type="button" class="cal-pill-btn" (click)="calShowSourceDropdown = !calShowSourceDropdown">
                  {{ calSourceFilter === 'all' ? 'My MeetSphere' : 'MeetSphere only' }} ⌵
                </button>
                <div class="cal-dropdown-menu" *ngIf="calShowSourceDropdown">
                  <div class="cal-dropdown-item" [class.active]="calSourceFilter==='all'" (click)="calSourceFilter='all'; calShowSourceDropdown=false">
                    My MeetSphere
                  </div>
                  <div class="cal-dropdown-item" [class.active]="calSourceFilter==='meetsphere'" (click)="calSourceFilter='meetsphere'; calShowSourceDropdown=false">
                    MeetSphere only
                  </div>
                </div>
              </div>

              <!-- Search input -->
              <div class="cal-search-wrap">
                <span class="cal-search-icon">🔍</span>
                <input type="text" class="cal-search-input" [(ngModel)]="calSearchQuery" placeholder="Search events or rooms...">
                <button *ngIf="calSearchQuery" type="button" class="cal-search-clear" (click)="calSearchQuery=''">✕</button>
              </div>

              <!-- Filter dropdown -->
              <div class="dropdown position-relative">
                <button type="button" class="cal-pill-btn" (click)="calShowFilterDropdown = !calShowFilterDropdown">
                  ≡ Filter ⌵
                </button>
                <div class="cal-dropdown-menu" *ngIf="calShowFilterDropdown">
                  <div class="cal-dropdown-item" (click)="calRangeFilter='today'; calShowFilterDropdown=false">Today's meetings</div>
                  <div class="cal-dropdown-item" (click)="calRangeFilter='upcoming'; calShowFilterDropdown=false">Upcoming only</div>
                  <div class="cal-dropdown-item" (click)="calRangeFilter='this_week'; calShowFilterDropdown=false">This week</div>
                  <div class="cal-dropdown-item" (click)="calRangeFilter='all'; calShowFilterDropdown=false">All dates</div>
                  <div class="cal-dropdown-item text-danger" (click)="clearCalFilter(); calShowFilterDropdown=false">Clear all filters</div>
                </div>
              </div>
            </div>

            <!-- Counter -->
            <div class="cal-counter text-muted small pe-2">
              Showing {{ filteredCalendarItems.length }} event{{ filteredCalendarItems.length === 1 ? '' : 's' }}
            </div>
          </div>

          <!-- 1. PHOTO 6 DYNAMIC MONTH GRID VIEW -->
          <div *ngIf="calViewMode === 'month'" class="cal-month-table-container shadow-sm border rounded-4 overflow-hidden bg-white mb-4">
            <!-- 7 Columns Header (Sun, Mon, Tue, Wed, Thu, Fri, Sat) -->
            <div class="cal-table-header-row">
              <div class="cal-table-th">Sun</div>
              <div class="cal-table-th">Mon</div>
              <div class="cal-table-th">Tue</div>
              <div class="cal-table-th">Wed</div>
              <div class="cal-table-th">Thu</div>
              <div class="cal-table-th">Fri</div>
              <div class="cal-table-th">Sat</div>
            </div>

            <!-- 7 Columns Calendar Cells Grid -->
            <div class="cal-table-grid">
              <div *ngFor="let cell of scheduleMonthGrid"
                   class="cal-table-day-cell"
                   [class.other-month]="!cell.isCurrentMonth"
                   [class.today-cell]="cell.isToday"
                   (click)="scheduleOnDate(cell.date)">
                
                <!-- Day Number & Quick Add Button -->
                <div class="cal-day-cell-top d-flex justify-content-between align-items-center mb-1">
                  <span class="cal-day-num" [class.today-num]="cell.isToday">
                    {{ cell.dayNumber }}
                  </span>
                  <button type="button" class="cal-day-add-btn" (click)="$event.stopPropagation(); scheduleOnDate(cell.date)" title="Schedule event on this day">
                    +
                  </button>
                </div>

                <!-- Event Cards inside this Day Cell (Matching Example Photo) -->
                <div class="cal-day-events-wrap">
                  <div *ngFor="let ev of cell.events; let idx = index"
                       class="cal-event-pill"
                       [style.background]="getEventBadgeBg(ev, idx)"
                       (click)="$event.stopPropagation(); openEventDetailModal(ev)"
                       [title]="ev.title + ' (' + formatEventTime(ev.start_at || ev.startAt, ev.end_at || ev.endAt) + ')'">
                    <div class="cal-event-pill-title text-truncate">
                      {{ ev.title }}
                    </div>
                    <div class="cal-event-pill-time text-truncate">
                      {{ formatEventTime(ev.start_at || ev.startAt, ev.end_at || ev.endAt) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. AGENDA / LIST VIEW (When toggled to agenda or search) -->
          <div *ngIf="calViewMode === 'agenda'">
            <div *ngIf="!filteredCalendarItems.length" class="cal-empty-hero mt-2">
              <div class="row align-items-center g-4">
                <div class="col-lg-6">
                  <h1 class="cal-hero-title">Prepare for your perfect first meeting here</h1>
                  <p class="cal-hero-desc">
                    Once you get your first meeting booked, this is where you'll be able to review invitee details, add private notes, reschedule, follow-up, or mark invitees as no-shows.
                  </p>
                  <div class="mt-4">
                    <button type="button" class="cal-btn-schedule" (click)="openScheduleModal()">
                      <span class="fs-5">📅⁺</span>
                      <span>Schedule your first meeting</span>
                    </button>
                  </div>
                </div>

                <div class="col-lg-6 position-relative text-center d-flex justify-content-center">
                  <div class="cal-art-wrap">
                    <div class="cal-art-hex"></div>
                    <svg class="cal-art-svg-path" viewBox="0 0 200 200">
                      <path d="M 20,120 C 10,180 80,180 120,150 S 180,80 160,30" fill="none" stroke="#635bff" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                    <div class="cal-confirmed-card shadow-sm">
                      <div class="cal-avatar-circle">👩🏽</div>
                      <div class="cal-confirmed-text">Confirmed</div>
                      <div class="cal-confirmed-icon">🗓️</div>
                    </div>
                    <div class="cal-browser-mockup shadow">
                      <div class="cal-browser-head d-flex gap-1.5 align-items-center">
                        <span class="dot red"></span>
                        <span class="dot yellow"></span>
                        <span class="dot green"></span>
                      </div>
                      <div class="cal-browser-body text-start p-3">
                        <div class="d-flex align-items-center gap-2 mb-2">
                          <span class="dot purple"></span>
                          <span class="fw-bold small text-dark">Scheduled with you</span>
                        </div>
                        <div class="d-flex align-items-center gap-1.5 small text-primary fw-semibold mb-3 cursor-pointer" (click)="openScheduleModal()">
                          <span>📝</span>
                          <span>Add meeting notes</span>
                        </div>
                        <div class="mock-line line-1 mb-2"></div>
                        <div class="mock-line line-2 mb-2"></div>
                        <div class="mock-line line-3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- MEETINGS LIST CARDS -->
            <div *ngIf="filteredCalendarItems.length" class="cal-meetings-list mt-2">
              <div class="cal-meeting-card" *ngFor="let x of filteredCalendarItems">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div class="d-flex gap-3 align-items-center">
                    <div class="cal-meeting-time-box">
                      <span class="cal-month">{{ x.start_at | date:'MMM' }}</span>
                      <span class="cal-day">{{ x.start_at | date:'dd' }}</span>
                    </div>
                    <div>
                      <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span *ngIf="x.isMeetSphereRoom" class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 small fw-bold">
                          ✦ MeetSphere Room
                        </span>
                        <span *ngIf="!x.isMeetSphereRoom" class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-2.5 py-1 small fw-bold">
                          🗓️ Calendar Event
                        </span>
                        <h5 class="cal-meeting-name mb-0">{{ x.title }}</h5>
                      </div>
                      <div class="cal-meeting-meta d-flex gap-3 text-muted small flex-wrap">
                        <span>🕒 {{ formatEventTime(x.start_at || x.startAt, x.end_at || x.endAt) }}</span>
                        <span>📍 {{ x.location || 'MeetSphere Video Room' }}</span>
                        <span *ngIf="x.meetingCode" class="fw-semibold text-primary">🔑 Code: <code>{{ x.meetingCode }}</code></span>
                        <span *ngIf="isAdmin && x.userName">👤 {{ x.userName }}</span>
                      </div>
                      <p *ngIf="x.notes" class="cal-meeting-notes mt-2 mb-0 small text-secondary">
                        📝 {{ x.notes }}
                      </p>
                    </div>
                  </div>

                  <div class="d-flex align-items-center gap-2">
                    <a *ngIf="x.meetingCode" [routerLink]="['/room', x.meetingCode]" class="btn btn-sm btn-primary rounded-pill px-3 fw-bold shadow-sm">
                      🚀 Join Room →
                    </a>
                    <button *ngIf="x.meetingCode" type="button" (click)="openZoom(x)" class="btn btn-sm btn-outline-primary rounded-pill px-2.5 fw-semibold" title="Launch official Zoom meeting">
                      📹 Zoom
                    </button>
                    <a *ngIf="!x.meetingCode && x.location && x.location.includes('http')" [href]="x.location" target="_blank" class="btn btn-sm btn-primary rounded-pill px-3 fw-bold">
                      Join Link →
                    </a>
                    <button *ngIf="!isAdmin || x.user_id===session.user?.id || x.isMeetSphereRoom" type="button" class="btn btn-sm btn-outline-danger rounded-pill px-3" (click)="promptDelete('calendar', x.id, x.isMeetSphereRoom, x.meetingId, x.title, x.meetingCode)">
                      Cancel / Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Professional Modal for Creating Calendar Event -->
          <div class="cal-modal-backdrop" *ngIf="calShowAddModal" (click)="calShowAddModal=false">
            <div class="cal-modal-card shadow-lg" (click)="$event.stopPropagation()">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center gap-2.5">
                  <div class="cal-modal-badge-icon">🗓️</div>
                  <div>
                    <h4 class="fw-bold mb-0 text-dark">Schedule New Meeting Event</h4>
                    <p class="text-muted small mb-0">Save personal or team events directly into your workspace calendar.</p>
                  </div>
                </div>
                <button type="button" class="btn-close" (click)="calShowAddModal=false"></button>
              </div>

              <!-- Quick Presets -->
              <div class="cal-presets-bar mb-3 p-2 rounded-3 bg-light d-flex align-items-center gap-2 flex-wrap">
                <span class="small fw-bold text-muted me-1">⚡ Quick Preset:</span>
                <button type="button" class="cal-preset-btn" (click)="applyPreset('standup')">⚡ 15m Standup</button>
                <button type="button" class="cal-preset-btn" (click)="applyPreset('teamsync')">👥 30m Team Sync</button>
                <button type="button" class="cal-preset-btn" (click)="applyPreset('demo')">💼 45m Client Demo</button>
                <button type="button" class="cal-preset-btn" (click)="applyPreset('strategy')">🎯 1h Strategy</button>
              </div>

              <form (ngSubmit)="saveCalendarEvent()">
                <div class="mb-3">
                  <label class="form-label text-secondary small fw-bold mb-1">Meeting Title *</label>
                  <input class="form-control cal-dark-input" [(ngModel)]="calendar.title" name="calTitle" placeholder="e.g. Product Demo & Discovery" required>
                </div>

                <div class="row g-2 mb-3">
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-bold mb-1">Start Date &amp; Time *</label>
                    <input class="form-control cal-dark-input" type="datetime-local" [(ngModel)]="calendar.startAt" name="calStart" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-secondary small fw-bold mb-1">End Date &amp; Time</label>
                    <input class="form-control cal-dark-input" type="datetime-local" [(ngModel)]="calendar.endAt" name="calEnd">
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label text-secondary small fw-bold mb-1">Location or Video Call Link</label>
                  <input class="form-control cal-dark-input" [(ngModel)]="calendar.location" name="calLoc" placeholder="e.g. MeetSphere Room, Zoom, or Google Meet">
                </div>

                <div class="mb-4">
                  <label class="form-label text-secondary small fw-bold mb-1">Private Meeting Notes / Agenda</label>
                  <textarea class="form-control cal-dark-input" rows="3" [(ngModel)]="calendar.notes" name="calNotes" placeholder="Add agenda points or notes..."></textarea>
                </div>

                <div class="d-flex gap-2 justify-content-end">
                  <button type="button" class="btn btn-outline-secondary rounded-pill px-4" (click)="calShowAddModal=false">Cancel</button>
                  <button type="submit" class="btn btn-primary rounded-pill px-4 fw-bold">Save Meeting Event</button>
                </div>
              </form>
            </div>
          </div>

          <!-- Interactive Event Detail Modal -->
          <div class="cal-modal-backdrop" *ngIf="calSelectedEvent" (click)="closeEventDetailModal()">
            <div class="cal-modal-card shadow-lg" (click)="$event.stopPropagation()">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center gap-2.5">
                  <div class="cal-modal-badge-icon" [style.background]="getEventBadgeBg(calSelectedEvent)">
                    <span>🗓️</span>
                  </div>
                  <div>
                    <span *ngIf="calSelectedEvent.isMeetSphereRoom" class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 small fw-bold">
                      ✦ MeetSphere Room
                    </span>
                    <span *ngIf="!calSelectedEvent.isMeetSphereRoom" class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-2.5 py-1 small fw-bold">
                      🗓️ Calendar Event
                    </span>
                    <h4 class="fw-bold mb-0 text-dark mt-1">{{ calSelectedEvent.title }}</h4>
                  </div>
                </div>
                <button type="button" class="btn-close" (click)="closeEventDetailModal()"></button>
              </div>

              <div class="p-3 bg-light rounded-3 mb-3">
                <div class="d-flex align-items-center gap-2 mb-2 text-dark fw-semibold">
                  <span>🕒</span>
                  <span>{{ calSelectedEvent.start_at | date:'fullDate' }} &bull; {{ formatEventTime(calSelectedEvent.start_at || calSelectedEvent.startAt, calSelectedEvent.end_at || calSelectedEvent.endAt) }}</span>
                </div>
                <div class="d-flex align-items-center gap-2 mb-2 text-secondary small" *ngIf="calSelectedEvent.location">
                  <span>📍</span>
                  <span>{{ calSelectedEvent.location }}</span>
                </div>
                <div class="d-flex align-items-center gap-2 mb-2 text-secondary small" *ngIf="calSelectedEvent.meetingCode">
                  <span>🔑</span>
                  <span>Room Code: <code class="fw-bold text-primary">{{ calSelectedEvent.meetingCode }}</code></span>
                </div>
                <div class="d-flex align-items-center gap-2 mb-2 text-secondary small" *ngIf="calSelectedEvent.userName">
                  <span>👤</span>
                  <span>Host: {{ calSelectedEvent.userName }}</span>
                </div>
                <div class="mt-3 pt-2 border-top border-light-subtle text-secondary small" *ngIf="calSelectedEvent.notes">
                  <div class="fw-bold text-dark mb-1">📝 Notes &amp; Agenda:</div>
                  <p class="mb-0 text-muted" style="white-space: pre-line;">{{ calSelectedEvent.notes }}</p>
                </div>
              </div>

              <div class="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                <a *ngIf="calSelectedEvent.meetingCode" [routerLink]="['/room', calSelectedEvent.meetingCode]" (click)="closeEventDetailModal()" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
                  🚀 Join Room →
                </a>
                <button type="button" class="btn btn-outline-primary rounded-pill px-3 fw-semibold" (click)="openZoom(calSelectedEvent)" title="Launch official Zoom meeting">
                  📹 Zoom Meeting
                </button>
                <button type="button" class="btn btn-danger rounded-pill px-3 fw-bold" (click)="deleteEventFromModal(calSelectedEvent)">
                  Delete Event
                </button>
                <button type="button" class="btn btn-secondary rounded-pill px-3" (click)="closeEventDetailModal()">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section *ngSwitchCase="'notes'" class="tool-grid">
        <div class="tool-card">
          <h4>◩ {{isAdmin?'Notetaker records':'Notetaker'}}</h4><p class="text-muted">Capture ideas, meeting minutes and follow-ups. Notes are stored in MySQL.</p>
          <form *ngIf="!isAdmin" (ngSubmit)="addNote()"><input class="form-control mb-2" [(ngModel)]="note.title" name="nt" placeholder="Note title" required><textarea class="form-control" rows="5" [(ngModel)]="note.content" name="nc" placeholder="Write your note..."></textarea><button class="btn btn-primary rounded-pill mt-3">Save note</button></form>
          <div class="row g-3 mt-2"><div class="col-md-6" *ngFor="let x of items"><div class="p-3 rounded-4 border bg-white h-100"><div class="d-flex justify-content-between"><b>{{x.title}}</b><button *ngIf="!isAdmin || x.user_id===session.user?.id" class="btn btn-sm btn-link text-danger" (click)="remove('notes',x.id)">Delete</button></div><p class="mt-2 mb-1" style="white-space:pre-wrap">{{x.content}}</p><small class="text-muted" *ngIf="isAdmin">By {{x.userName}}</small></div></div></div>
        </div>
      </section>

      <section *ngSwitchCase="'contacts'" class="tool-grid">
        <div class="tool-card"><h4>♧ {{isAdmin?'Contacts directory':'Contacts'}}</h4><p class="text-muted">Manage people you collaborate with and keep their details available for meetings.</p>
          <form *ngIf="!isAdmin" (ngSubmit)="addContact()"><div class="row g-2"><div class="col-md-6"><input class="form-control" [(ngModel)]="contact.name" name="pn" placeholder="Full name" required></div><div class="col-md-6"><input class="form-control" [(ngModel)]="contact.email" name="pe" placeholder="Email"></div><div class="col-md-6"><input class="form-control" [(ngModel)]="contact.phone" name="pp" placeholder="Phone"></div><div class="col-md-6"><input class="form-control" [(ngModel)]="contact.company" name="pc" placeholder="Company"></div></div><textarea class="form-control mt-2" [(ngModel)]="contact.notes" name="pno" placeholder="Notes"></textarea><button class="btn btn-primary rounded-pill mt-3">Add contact</button></form>
          <div class="table-responsive mt-4"><table class="table align-middle"><thead><tr><th>NAME</th><th>EMAIL</th><th>PHONE</th><th>COMPANY</th><th *ngIf="isAdmin">OWNER</th><th>ACTION</th></tr></thead><tbody><tr *ngFor="let x of items"><td><input *ngIf="!isAdmin" class="form-control form-control-sm" [(ngModel)]="x.name" [name]="'myContactName'+x.id" maxlength="120"><b *ngIf="isAdmin">{{x.name}}</b><input *ngIf="isAdmin" class="form-control form-control-sm" [(ngModel)]="x.name" [name]="'adminContactName'+x.id" maxlength="120"></td><td><input class="form-control form-control-sm" [(ngModel)]="x.email" [name]="'contactEmail'+x.id"></td><td><input class="form-control form-control-sm" [(ngModel)]="x.phone" [name]="'contactPhone'+x.id"></td><td><input class="form-control form-control-sm" [(ngModel)]="x.company" [name]="'contactCompany'+x.id"></td><td *ngIf="isAdmin">{{x.userName}}</td><td><div class="d-flex gap-1"><button *ngIf="!isAdmin || x.user_id===session.user?.id" class="btn btn-sm btn-outline-primary rounded-pill" (click)="saveContact(x)">Save</button><button *ngIf="!isAdmin || x.user_id===session.user?.id" class="btn btn-sm btn-outline-danger rounded-pill" (click)="remove('contacts',x.id)">Delete</button></div></td></tr></tbody></table><div *ngIf="!items.length" class="empty-state py-5"><h5>No contacts yet</h5><p>Add contacts to build your meeting directory.</p></div></div>
        </div>
      </section>

      <section *ngSwitchCase="'automations'" class="tool-grid">
        <div class="tool-card"><h4>✣ {{isAdmin?'Automation rules':'Automations'}}</h4><p class="text-muted">Create simple workflow rules. Enabled rules are stored and visible to Admin.</p>
          <form *ngIf="!isAdmin" (ngSubmit)="addAutomation()"><input class="form-control mb-2" [(ngModel)]="automation.name" name="an" placeholder="Automation name" required><div class="row g-2"><div class="col-md-6"><input class="form-control" [(ngModel)]="automation.triggerName" name="at" placeholder="Trigger e.g. Meeting created" required></div><div class="col-md-6"><input class="form-control" [(ngModel)]="automation.actionName" name="aa" placeholder="Action e.g. Send reminder" required></div></div><button class="btn btn-primary rounded-pill mt-3">Create automation</button></form>
          <div class="row g-3 mt-2"><div class="col-md-6" *ngFor="let x of items"><div class="p-3 rounded-4 border bg-white h-100"><div class="d-flex justify-content-between align-items-center"><b>{{x.name}}</b><span class="badge rounded-pill" [class.bg-success]="x.enabled" [class.bg-secondary]="!x.enabled">{{x.enabled?'Enabled':'Off'}}</span></div><div class="small text-muted mt-2">WHEN: {{x.trigger_name}}</div><div class="small text-muted">DO: {{x.action_name}}</div><div class="mt-3 d-flex gap-2"><button *ngIf="!isAdmin || x.user_id===session.user?.id" class="btn btn-sm btn-outline-primary rounded-pill" (click)="toggleAutomation(x.id)">{{x.enabled?'Disable':'Enable'}}</button><button *ngIf="!isAdmin || x.user_id===session.user?.id" class="btn btn-sm btn-outline-danger rounded-pill" (click)="remove('automations',x.id)">Delete</button></div><small *ngIf="isAdmin" class="text-muted d-block mt-2">Owner: {{x.userName}}</small></div></div></div>
          <div *ngIf="!items.length" class="empty-state py-5"><h5>No automation rules</h5><p>Create a rule to automate your workspace.</p></div>
        </div>
      </section>

      <section *ngSwitchCase="'brief'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>✧ Meeting Brief Studio</h4><p class="text-muted">Turn a few details into a shareable, structured meeting brief.</p></div><span class="badge rounded-pill text-bg-primary">User tool</span></div>
          <form (ngSubmit)="buildBrief()">
            <div class="row g-3"><div class="col-md-6"><label class="form-label">Meeting title</label><input class="form-control" [(ngModel)]="brief.title" name="briefTitle" required placeholder="e.g. Project launch"></div><div class="col-md-6"><label class="form-label">Duration (minutes)</label><input class="form-control" type="number" min="5" max="480" [(ngModel)]="brief.duration" name="briefDuration" required></div><div class="col-12"><label class="form-label">Goal / desired outcome</label><textarea class="form-control" rows="2" [(ngModel)]="brief.goal" name="briefGoal" required placeholder="What should be decided or completed?"></textarea></div><div class="col-md-6"><label class="form-label">Participants</label><input class="form-control" [(ngModel)]="brief.participants" name="briefPeople" placeholder="Names separated by commas"></div><div class="col-md-6"><label class="form-label">Meeting date / time</label><input class="form-control" type="datetime-local" [(ngModel)]="brief.when" name="briefWhen"></div><div class="col-12"><label class="form-label">Agenda (one topic per line)</label><textarea class="form-control" rows="4" [(ngModel)]="brief.agenda" name="briefAgenda" placeholder="Review status&#10;Discuss blockers&#10;Agree next steps"></textarea></div></div>
            <div class="d-flex flex-wrap gap-2 mt-3"><button class="btn btn-primary rounded-pill px-4">Generate brief</button><button type="button" class="btn btn-outline-secondary rounded-pill" (click)="clearBrief()">Clear</button></div>
          </form>
          <div *ngIf="generatedBrief" class="mt-4 p-4 rounded-4 border bg-light"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><h5 class="mb-0">Your meeting brief</h5><div class="d-flex gap-2"><button class="btn btn-sm btn-outline-primary rounded-pill" type="button" (click)="copyBrief()">Copy</button><button class="btn btn-sm btn-outline-success rounded-pill" type="button" (click)="downloadBrief()">Download TXT</button></div></div><pre class="mt-3 mb-0 text-wrap" style="white-space:pre-wrap;font-family:inherit">{{generatedBrief}}</pre></div>
        </div>
      </section>

      <section *ngSwitchCase="'governance'" class="tool-grid">
        <div class="tool-card"><div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>◈ Platform Governance Scorecard</h4><p class="text-muted">A quick review based on the current live user and meeting records.</p></div><button class="btn btn-outline-primary rounded-pill" type="button" (click)="loadGovernance()">↻ Refresh data</button></div>
          <div *ngIf="governanceError" class="alert alert-warning rounded-4 mt-3">{{governanceError}}</div>
          <div class="row g-3 mt-1"><div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Users loaded</small><h3 class="mb-0">{{governanceUsers.length}}</h3></div></div><div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Admin accounts</small><h3 class="mb-0">{{governanceAdminCount}}</h3></div></div><div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Rooms loaded</small><h3 class="mb-0">{{governanceMeetings.length}}</h3></div></div><div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Review flags</small><h3 class="mb-0">{{governanceFlags}}</h3></div></div></div>
          <h5 class="mt-4">Review checklist</h5><div class="list-group list-group-flush"><div class="list-group-item d-flex justify-content-between align-items-center"><span>Every loaded user has an email</span><span class="badge rounded-pill" [class.text-bg-success]="usersMissingEmail===0" [class.text-bg-warning]="usersMissingEmail>0">{{usersMissingEmail===0?'Clear':usersMissingEmail+' flagged'}}</span></div><div class="list-group-item d-flex justify-content-between align-items-center"><span>Every loaded room has a meeting code</span><span class="badge rounded-pill" [class.text-bg-success]="roomsMissingCode===0" [class.text-bg-warning]="roomsMissingCode>0">{{roomsMissingCode===0?'Clear':roomsMissingCode+' flagged'}}</span></div><div class="list-group-item d-flex justify-content-between align-items-center"><span>Admin accounts are present</span><span class="badge rounded-pill" [class.text-bg-success]="governanceAdminCount>0" [class.text-bg-warning]="governanceAdminCount===0">{{governanceAdminCount>0?'Present':'Review'}}</span></div></div>
          <p class="small text-muted mt-3 mb-0">This is a review aid, not a security certification. It uses records returned by the current API and does not modify user accounts or meetings.</p>
          <button class="btn btn-outline-success rounded-pill mt-3" type="button" (click)="exportGovernance()">Export scorecard CSV</button>
        </div>
      </section>

      <section *ngSwitchCase="'readiness'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>✓ Meeting Readiness Score</h4><p class="text-muted">A practical pre-flight check so meetings start on time and include everyone.</p></div><span class="badge rounded-pill text-bg-primary">{{readinessScore}}% ready</span></div>
          <div class="progress rounded-pill my-3" style="height:10px"><div class="progress-bar" role="progressbar" [style.width.%]="readinessScore" [attr.aria-valuenow]="readinessScore" aria-valuemin="0" aria-valuemax="100"></div></div>
          <div class="list-group list-group-flush"> <label *ngFor="let check of readinessChecks;let i=index" class="list-group-item d-flex align-items-center gap-3 py-3"><input class="form-check-input mt-0" type="checkbox" [(ngModel)]="check.done" [name]="'ready'+i" (ngModelChange)="saveLocalToolState()"><span class="flex-grow-1"><b>{{check.label}}</b><small class="d-block text-muted">{{check.help}}</small></span><span class="badge rounded-pill" [class.text-bg-success]="check.done" [class.text-bg-secondary]="!check.done">{{check.done?'Done':'Pending'}}</span></label></div>
          <div class="d-flex flex-wrap gap-2 mt-3"><button class="btn btn-primary rounded-pill" type="button" (click)="exportReadiness()">Download readiness report</button><button class="btn btn-outline-secondary rounded-pill" type="button" (click)="resetReadiness()">Reset checklist</button></div>
          <p class="small text-muted mt-3 mb-0">Saved locally for this signed-in account in this browser. This checklist does not join, schedule, or change a meeting.</p>
        </div>
      </section>

      <section *ngSwitchCase="'actions'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>☑ Personal Follow-up Action Tracker</h4><p class="text-muted">Turn meeting decisions into trackable next steps. Items are saved in MySQL, visible to Admin, and shared updates sync back to your panel.</p></div><span class="badge rounded-pill text-bg-primary">Personal workspace</span></div>
          <form (ngSubmit)="addAction()" class="border rounded-4 p-3 bg-light">
            <div class="row g-2"><div class="col-md-5"><label class="form-label small">Action item</label><input class="form-control" [(ngModel)]="actionDraft.title" name="actionTitle" required maxlength="140" placeholder="e.g. Send meeting summary"></div><div class="col-md-3"><label class="form-label small">Due date</label><input class="form-control" type="date" [(ngModel)]="actionDraft.dueDate" name="actionDue"></div><div class="col-md-2"><label class="form-label small">Priority</label><select class="form-select" [(ngModel)]="actionDraft.priority" name="actionPriority"><option>Normal</option><option>High</option><option>Urgent</option></select></div><div class="col-md-2 d-flex align-items-end"><button class="btn btn-primary rounded-pill w-100">Add action</button></div></div>
          </form>
          <div class="row g-3 mt-1"><div class="col-4"><div class="p-3 border rounded-4"><small class="text-muted">Open</small><h3>{{openActions}}</h3></div></div><div class="col-4"><div class="p-3 border rounded-4"><small class="text-muted">Overdue</small><h3 class="text-danger">{{overdueActions}}</h3></div></div><div class="col-4"><div class="p-3 border rounded-4"><small class="text-muted">Completed</small><h3 class="text-success">{{completedActions}}</h3></div></div></div>
          <div class="table-responsive mt-3"><table class="table align-middle"><thead><tr><th>DONE</th><th>ACTION</th><th>DUE</th><th>PRIORITY</th><th></th></tr></thead><tbody><tr *ngFor="let task of actionItems"><td><input class="form-check-input" type="checkbox" [checked]="task.done" (change)="toggleAction(task.id, $any($event.target).checked)" [attr.aria-label]="'Complete '+task.title"></td><td><span [class.text-decoration-line-through]="task.done"><b>{{task.title}}</b></span><small class="d-block text-muted">{{task.done?'Completed':'Open'}}</small></td><td>{{task.dueDate||'No due date'}}<small *ngIf="isActionOverdue(task)" class="d-block text-danger fw-semibold">Overdue</small></td><td><span class="badge rounded-pill" [class.text-bg-danger]="task.priority==='Urgent'" [class.text-bg-warning]="task.priority==='High'" [class.text-bg-secondary]="task.priority==='Normal'">{{task.priority}}</span></td><td><button type="button" class="btn btn-sm btn-outline-danger rounded-pill" (click)="deleteAction(task.id)">Delete</button></td></tr></tbody></table></div>
          <div *ngIf="!actionItems.length" class="empty-state py-4"><h5>No follow-up actions yet</h5><p>Add the first next step from your latest meeting.</p></div>
          <div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-primary rounded-pill" type="button" (click)="exportActions()">Export actions CSV</button><button class="btn btn-outline-secondary rounded-pill" type="button" (click)="clearCompletedActions()" [disabled]="completedActions===0">Clear completed</button></div>
          <p class="small text-muted mt-3 mb-0">These action items are shared server records. Admin can edit or delete them from User Workspace Control; this page refreshes automatically.</p>
        </div>
      </section>

      <section *ngSwitchCase="'conflicts'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>◷ Calendar Conflict Finder</h4><p class="text-muted">Find overlapping events in your saved calendar before they cause double-booking.</p></div><button class="btn btn-primary rounded-pill" type="button" (click)="load()">↻ Refresh calendar</button></div>
          <div class="row g-3 mt-1"><div class="col-md-4"><div class="p-3 border rounded-4"><small class="text-muted">Calendar events</small><h3>{{items.length}}</h3></div></div><div class="col-md-4"><div class="p-3 border rounded-4"><small class="text-muted">Overlapping pairs</small><h3 [class.text-danger]="conflictPairs.length>0">{{conflictPairs.length}}</h3></div></div><div class="col-md-4"><div class="p-3 border rounded-4"><small class="text-muted">Status</small><h5>{{conflictPairs.length?'Needs review':'No conflicts found'}}</h5></div></div></div>
          <div *ngIf="conflictPairs.length" class="table-responsive mt-3"><table class="table align-middle"><thead><tr><th>EVENT A</th><th>EVENT B</th><th>OVERLAP</th></tr></thead><tbody><tr *ngFor="let pair of conflictPairs"><td><b>{{pair.a.title}}</b><small class="d-block text-muted">{{eventStart(pair.a)|date:'medium'}}</small></td><td><b>{{pair.b.title}}</b><small class="d-block text-muted">{{eventStart(pair.b)|date:'medium'}}</small></td><td><span class="badge text-bg-danger">{{pair.minutes}} min</span></td></tr></tbody></table></div>
          <div *ngIf="!conflictPairs.length" class="empty-state py-4"><h5>{{items.length?'Your calendar looks clear':'No calendar events found'}}</h5><p>{{items.length?'No overlapping event times were detected.':'Create events from Calendar, then refresh this page.'}}</p></div>
          <button class="btn btn-outline-primary rounded-pill mt-2" type="button" (click)="exportConflicts()">Download conflict report CSV</button>
          <p class="small text-muted mt-3 mb-0">This checks saved calendar events only. Events without a valid start time are skipped; missing end times are treated as 60-minute events. It does not reschedule meetings automatically.</p>
        </div>
      </section>

      <section *ngSwitchCase="'followup-message'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>✉ Meeting Follow-up Writer</h4><p class="text-muted">Turn meeting outcomes into a polished follow-up message you can copy or download.</p></div><span class="badge rounded-pill text-bg-primary">Draft only</span></div>
          <div class="row g-3 mt-1">
            <div class="col-md-6"><label class="form-label">Meeting title</label><input class="form-control" [(ngModel)]="followupDraft.meeting" name="fuMeeting" maxlength="140" placeholder="Project planning meeting"></div>
            <div class="col-md-6"><label class="form-label">Recipient name</label><input class="form-control" [(ngModel)]="followupDraft.recipient" name="fuRecipient" maxlength="100" placeholder="Hi Priya"></div>
            <div class="col-md-6"><label class="form-label">Your name</label><input class="form-control" [(ngModel)]="followupDraft.sender" name="fuSender" maxlength="100" [placeholder]="session.user?.fullName || 'Your name'"></div>
            <div class="col-md-6"><label class="form-label">Next follow-up date (optional)</label><input class="form-control" type="date" [(ngModel)]="followupDraft.nextDate" name="fuDate"></div>
            <div class="col-12"><label class="form-label">Key decisions (one per line)</label><textarea class="form-control" rows="3" [(ngModel)]="followupDraft.decisions" name="fuDecisions" placeholder="Approved the new timeline&#10;Use the shared design draft"></textarea></div>
            <div class="col-12"><label class="form-label">Action items (one per line)</label><textarea class="form-control" rows="3" [(ngModel)]="followupDraft.actions" name="fuActions" placeholder="Harshil — share the updated plan&#10;Team — review the draft"></textarea></div>
            <div class="col-12"><label class="form-label">Extra note (optional)</label><textarea class="form-control" rows="2" [(ngModel)]="followupDraft.note" name="fuNote" placeholder="Add links, thanks, or context"></textarea></div>
          </div>
          <div class="d-flex flex-wrap gap-2 mt-3"><button class="btn btn-primary rounded-pill" type="button" (click)="buildFollowupMessage()">Generate message</button><button class="btn btn-outline-secondary rounded-pill" type="button" (click)="resetFollowupMessage()">Reset</button></div>
          <div *ngIf="generatedFollowup" class="mt-4"><label class="form-label fw-semibold">Generated follow-up</label><textarea class="form-control" rows="12" [(ngModel)]="generatedFollowup" name="generatedFollowup" aria-label="Generated follow-up message"></textarea><div class="d-flex flex-wrap gap-2 mt-2"><button class="btn btn-outline-primary rounded-pill" type="button" (click)="copyFollowupMessage()">Copy message</button><button class="btn btn-outline-primary rounded-pill" type="button" (click)="downloadFollowupMessage()">Download TXT</button></div></div>
          <p class="small text-muted mt-3 mb-0">This creates a draft only. It does not send email or contact recipients. The draft stays in this page unless you copy or download it.</p>
        </div>
      </section>

      <section *ngSwitchCase="'decision-ledger'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>◆ Meeting Decision Ledger</h4><p class="text-muted">Keep a clear record of decisions, owners, due dates and follow-up status for your meetings.</p></div><span class="badge rounded-pill text-bg-primary">Private to your account</span></div>
          <form (ngSubmit)="addDecision()" class="border rounded-4 p-3 bg-light mt-3">
            <div class="row g-2"><div class="col-md-6"><label class="form-label small">Meeting / topic</label><input class="form-control" [(ngModel)]="decisionDraft.meeting" name="decisionMeeting" required maxlength="140" placeholder="Weekly project review"></div><div class="col-md-6"><label class="form-label small">Decision</label><input class="form-control" [(ngModel)]="decisionDraft.decision" name="decisionText" required maxlength="240" placeholder="Approve the revised delivery plan"></div><div class="col-md-4"><label class="form-label small">Owner</label><input class="form-control" [(ngModel)]="decisionDraft.owner" name="decisionOwner" maxlength="100" placeholder="Responsible person"></div><div class="col-md-4"><label class="form-label small">Due date</label><input class="form-control" type="date" [(ngModel)]="decisionDraft.dueDate" name="decisionDue"></div><div class="col-md-4 d-flex align-items-end"><button class="btn btn-primary rounded-pill w-100">Save decision</button></div></div>
          </form>
          <div class="row g-3 mt-1"><div class="col-4"><div class="p-3 border rounded-4"><small class="text-muted">Total</small><h3>{{decisionRecords.length}}</h3></div></div><div class="col-4"><div class="p-3 border rounded-4"><small class="text-muted">Open</small><h3 class="text-warning">{{openDecisions}}</h3></div></div><div class="col-4"><div class="p-3 border rounded-4"><small class="text-muted">Done</small><h3 class="text-success">{{completedDecisions}}</h3></div></div></div>
          <div class="table-responsive mt-3"><table class="table align-middle"><thead><tr><th>MEETING / DECISION</th><th>OWNER</th><th>DUE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody><tr *ngFor="let d of decisionRecords"><td><b>{{d.meeting}}</b><small class="d-block text-muted">{{d.decision}}</small></td><td>{{d.owner||'Unassigned'}}</td><td>{{d.dueDate||'—'}}</td><td><select class="form-select form-select-sm" [ngModel]="d.status" [name]="'decisionStatus'+d.id" (ngModelChange)="setDecisionStatus(d.id,$event)" aria-label="Decision status"><option value="Open">Open</option><option value="In progress">In progress</option><option value="Done">Done</option></select></td><td><button class="btn btn-sm btn-outline-danger rounded-pill" type="button" (click)="deleteDecision(d.id)">Delete</button></td></tr></tbody></table></div>
          <div *ngIf="!decisionRecords.length" class="empty-state py-4"><h5>No decisions recorded yet</h5><p>Add the first decision from a meeting to start tracking accountability.</p></div>
          <div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-primary rounded-pill" type="button" (click)="exportDecisions()">Export decision CSV</button><button class="btn btn-outline-secondary rounded-pill" type="button" (click)="clearDoneDecisions()" [disabled]="completedDecisions===0">Clear completed</button></div>
          <p class="small text-muted mt-3 mb-0">Decision records are stored in this browser for the signed-in account only. They are not uploaded to MySQL or visible to Admin.</p>
        </div>
      </section>

      <section *ngSwitchCase="'change-log'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>◈ Admin Change & Risk Log</h4><p class="text-muted">Maintain a lightweight review log for planned changes, incidents and operational risks.</p></div><span class="badge rounded-pill text-bg-danger">Admin only</span></div>
          <div class="alert alert-warning rounded-4 mt-3">This is a private admin working log in this browser, not an immutable server audit trail.</div>
          <form (ngSubmit)="addChangeLogEntry()" class="border rounded-4 p-3 bg-light">
            <div class="row g-2"><div class="col-md-3"><label class="form-label small">Type</label><select class="form-select" [(ngModel)]="changeDraft.type" name="changeType"><option>Change</option><option>Incident</option><option>Risk</option><option>Maintenance</option></select></div><div class="col-md-5"><label class="form-label small">Summary</label><input class="form-control" [(ngModel)]="changeDraft.summary" name="changeSummary" required maxlength="180" placeholder="Short description"></div><div class="col-md-2"><label class="form-label small">Owner</label><input class="form-control" [(ngModel)]="changeDraft.owner" name="changeOwner" maxlength="100" placeholder="Owner"></div><div class="col-md-2 d-flex align-items-end"><button class="btn btn-danger rounded-pill w-100">Add entry</button></div><div class="col-12"><label class="form-label small">Mitigation / next step</label><textarea class="form-control" rows="2" [(ngModel)]="changeDraft.mitigation" name="changeMitigation" maxlength="600" placeholder="What should happen next?"></textarea></div></div>
          </form>
          <div class="row g-3 mt-1"><div class="col-4"><div class="p-3 border rounded-4"><small class="text-muted">All entries</small><h3>{{changeLog.length}}</h3></div></div><div class="col-4"><div class="p-3 border rounded-4"><small class="text-muted">Open</small><h3 class="text-warning">{{openChangeEntries}}</h3></div></div><div class="col-4"><div class="p-3 border rounded-4"><small class="text-muted">Resolved</small><h3 class="text-success">{{resolvedChangeEntries}}</h3></div></div></div>
          <div class="table-responsive mt-3"><table class="table align-middle"><thead><tr><th>DATE / TYPE</th><th>SUMMARY</th><th>OWNER / NEXT STEP</th><th>STATUS</th><th></th></tr></thead><tbody><tr *ngFor="let entry of changeLog"><td><b>{{entry.type}}</b><small class="d-block text-muted">{{entry.createdAt|date:'short'}}</small></td><td>{{entry.summary}}</td><td>{{entry.owner||'Unassigned'}}<small class="d-block text-muted">{{entry.mitigation||'No next step recorded'}}</small></td><td><select class="form-select form-select-sm" [ngModel]="entry.status" [name]="'changeStatus'+entry.id" (ngModelChange)="setChangeStatus(entry.id,$event)" aria-label="Change log status"><option value="Open">Open</option><option value="Monitoring">Monitoring</option><option value="Resolved">Resolved</option></select></td><td><button class="btn btn-sm btn-outline-danger rounded-pill" type="button" (click)="deleteChangeEntry(entry.id)">Delete</button></td></tr></tbody></table></div>
          <div *ngIf="!changeLog.length" class="empty-state py-4"><h5>No admin log entries yet</h5><p>Record a planned change, risk, or incident for later review.</p></div>
          <div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-danger rounded-pill" type="button" (click)="exportChangeLog()">Export log CSV</button><button class="btn btn-outline-secondary rounded-pill" type="button" (click)="clearResolvedChangeEntries()" [disabled]="resolvedChangeEntries===0">Clear resolved</button></div>
          <p class="small text-muted mt-3 mb-0">Entries are scoped to the signed-in admin account in browser storage and are not written to the server.</p>
        </div>
      </section>

      <section *ngSwitchCase="'cost'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>₹ Meeting Cost Planner</h4><p class="text-muted">Estimate the people-time cost of a meeting before you schedule it.</p></div><span class="badge rounded-pill text-bg-primary">Live estimate</span></div>
          <div class="row g-3 mt-1">
            <div class="col-md-6"><label class="form-label">Meeting duration (minutes)</label><input class="form-control" type="number" min="1" max="1440" [(ngModel)]="costPlan.duration" name="costDuration"></div>
            <div class="col-md-6"><label class="form-label">Participants</label><input class="form-control" type="number" min="1" max="10000" [(ngModel)]="costPlan.participants" name="costParticipants"></div>
            <div class="col-md-6"><label class="form-label">Average hourly cost per person (₹)</label><input class="form-control" type="number" min="0" step="50" [(ngModel)]="costPlan.hourlyRate" name="costRate"></div>
            <div class="col-md-6"><label class="form-label">Meeting title (optional)</label><input class="form-control" [(ngModel)]="costPlan.title" name="costTitle" placeholder="e.g. Weekly planning"></div>
          </div>
          <div class="row g-3 mt-3"><div class="col-md-4"><div class="p-3 border rounded-4 h-100"><small class="text-muted">People-hours</small><h3>{{costPeopleHours | number:'1.0-2'}}</h3></div></div><div class="col-md-4"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Estimated total cost</small><h3 class="text-primary">₹{{costEstimate | number:'1.0-2'}}</h3></div></div><div class="col-md-4"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Annual cost (weekly)</small><h3>₹{{costEstimate*52 | number:'1.0-0'}}</h3></div></div></div>
          <div class="d-flex flex-wrap gap-2 mt-3"><button class="btn btn-primary rounded-pill" type="button" (click)="exportCostEstimate()">Download estimate CSV</button><button class="btn btn-outline-secondary rounded-pill" type="button" (click)="resetCostPlan()">Reset calculator</button></div>
          <p class="small text-muted mt-3 mb-0">This is an estimate only. It does not charge anyone, create a meeting, or change payment records.</p>
        </div>
      </section>

      <section *ngSwitchCase="'exports'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>⇩ Admin Workspace Export Center</h4><p class="text-muted">Load current records from the existing admin APIs and export audit-friendly CSV files.</p></div><button class="btn btn-danger rounded-pill" type="button" (click)="loadExportCenter()">↻ Refresh data</button></div>
          <div class="alert alert-warning rounded-4 mt-3 mb-3">Exports may contain personal or operational data. Store downloaded files securely and share only with authorized people.</div>
          <div class="row g-3 mt-1">
            <div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Users</small><h3>{{exportUsers.length}}</h3><small>{{exportStatus.users}}</small></div></div>
            <div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Calendar events</small><h3>{{exportCalendar.length}}</h3><small>{{exportStatus.calendar}}</small></div></div>
            <div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Notes</small><h3>{{exportNotes.length}}</h3><small>{{exportStatus.notes}}</small></div></div>
            <div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Payments</small><h3>{{exportPayments.length}}</h3><small>{{exportStatus.payments}}</small></div></div>
          </div>
          <div class="row g-3 mt-2">
            <div class="col-md-6"><div class="border rounded-4 p-3 h-100"><h6>Account directory</h6><p class="text-muted small">User ID, name, email, and role as returned by the admin API.</p><button class="btn btn-outline-danger rounded-pill" type="button" (click)="exportCenterCsv('users')" [disabled]="!exportStatus.usersLoaded">Export users CSV</button></div></div>
            <div class="col-md-6"><div class="border rounded-4 p-3 h-100"><h6>Calendar activity</h6><p class="text-muted small">Event title, owner, start time, location and notes status.</p><button class="btn btn-outline-danger rounded-pill" type="button" (click)="exportCenterCsv('calendar')" [disabled]="!exportStatus.calendarLoaded">Export calendar CSV</button></div></div>
            <div class="col-md-6"><div class="border rounded-4 p-3 h-100"><h6>Workspace notes</h6><p class="text-muted small">Note title, owner and content. Treat this export as confidential.</p><button class="btn btn-outline-danger rounded-pill" type="button" (click)="exportCenterCsv('notes')" [disabled]="!exportStatus.notesLoaded">Export notes CSV</button></div></div>
            <div class="col-md-6"><div class="border rounded-4 p-3 h-100"><h6>Payment records</h6><p class="text-muted small">Payment metadata returned by the admin payment endpoint.</p><button class="btn btn-outline-danger rounded-pill" type="button" (click)="exportCenterCsv('payments')" [disabled]="!exportStatus.paymentsLoaded">Export payments CSV</button></div></div>
          </div>
          <p class="small text-muted mt-3 mb-0">This page is read-only: it does not edit or delete records. Each export is enabled only after its API request succeeds.</p>
        </div>
      </section>

      <section *ngSwitchCase="'workspace-control'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>⚙ Admin User Workspace Control</h4><p class="text-muted">View records users save in the shared database, edit them, or delete them. Changes are saved on the server and appear in the user's workspace on refresh.</p></div><button class="btn btn-danger rounded-pill" type="button" (click)="loadAdminWorkspace()">↻ Refresh all records</button></div>
          <div class="alert alert-warning rounded-4 mt-3"><b>Careful:</b> edits and deletions affect the actual user's shared records. Use this only for legitimate administration.</div>
          <div *ngIf="workspaceAdminError" class="alert alert-danger rounded-4">{{workspaceAdminError}}</div>
          <div *ngIf="workspaceAdminMessage" class="alert alert-success rounded-4">{{workspaceAdminMessage}}</div>
          <div class="d-flex flex-wrap gap-2 my-3"><button class="btn rounded-pill" [class.btn-danger]="workspaceTab==='calendar'" [class.btn-outline-danger]="workspaceTab!=='calendar'" type="button" (click)="workspaceTab='calendar'">Calendar ({{adminWorkspace.calendar.length}})</button><button class="btn rounded-pill" [class.btn-danger]="workspaceTab==='notes'" [class.btn-outline-danger]="workspaceTab!=='notes'" type="button" (click)="workspaceTab='notes'">Notes ({{adminWorkspace.notes.length}})</button><button class="btn rounded-pill" [class.btn-danger]="workspaceTab==='contacts'" [class.btn-outline-danger]="workspaceTab!=='contacts'" type="button" (click)="workspaceTab='contacts'">Contacts ({{adminWorkspace.contacts.length}})</button><button class="btn rounded-pill" [class.btn-danger]="workspaceTab==='automations'" [class.btn-outline-danger]="workspaceTab!=='automations'" type="button" (click)="workspaceTab='automations'">Automations ({{adminWorkspace.automations.length}})</button><button class="btn rounded-pill" [class.btn-danger]="workspaceTab==='actions'" [class.btn-outline-danger]="workspaceTab!=='actions'" type="button" (click)="workspaceTab='actions'">Action Items ({{adminWorkspace.actions.length}})</button></div>
          <div *ngIf="workspaceTab==='calendar'" class="table-responsive"><table class="table align-middle"><thead><tr><th>EVENT</th><th>OWNER</th><th>START</th><th>LOCATION / NOTES</th><th>ACTIONS</th></tr></thead><tbody><tr *ngFor="let x of adminWorkspace.calendar"><td><input class="form-control form-control-sm mb-1" [(ngModel)]="x.title" [name]="'calTitle'+x.id" aria-label="Event title"><small class="text-muted">ID {{x.id}}</small></td><td>{{x.userName}}<small class="d-block text-muted">{{x.userEmail}}</small></td><td><input class="form-control form-control-sm" type="datetime-local" [(ngModel)]="x._startEdit" [name]="'calStart'+x.id"></td><td><input class="form-control form-control-sm mb-1" [(ngModel)]="x.location" [name]="'calLoc'+x.id" placeholder="Location"><input class="form-control form-control-sm" [(ngModel)]="x.notes" [name]="'calNotes'+x.id" placeholder="Notes"></td><td><div class="d-flex gap-1"><button class="btn btn-sm btn-danger" type="button" (click)="saveAdminWorkspaceRecord('calendar',x)">Save</button><button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteAdminWorkspaceRecord('calendar',x)">Delete</button></div></td></tr></tbody></table><div *ngIf="!adminWorkspace.calendar.length" class="text-muted p-3">No user calendar events found.</div></div>
          <div *ngIf="workspaceTab==='notes'" class="table-responsive"><table class="table align-middle"><thead><tr><th>NOTE</th><th>OWNER</th><th>CONTENT</th><th>ACTIONS</th></tr></thead><tbody><tr *ngFor="let x of adminWorkspace.notes"><td><input class="form-control form-control-sm" [(ngModel)]="x.title" [name]="'noteTitle'+x.id"><small class="text-muted">ID {{x.id}}</small></td><td>{{x.userName}}<small class="d-block text-muted">{{x.userEmail}}</small></td><td><textarea class="form-control form-control-sm" rows="2" [(ngModel)]="x.content" [name]="'noteContent'+x.id"></textarea></td><td><div class="d-flex gap-1"><button class="btn btn-sm btn-danger" type="button" (click)="saveAdminWorkspaceRecord('notes',x)">Save</button><button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteAdminWorkspaceRecord('notes',x)">Delete</button></div></td></tr></tbody></table><div *ngIf="!adminWorkspace.notes.length" class="text-muted p-3">No user notes found.</div></div>
          <div *ngIf="workspaceTab==='contacts'" class="table-responsive"><table class="table align-middle"><thead><tr><th>CONTACT</th><th>OWNER</th><th>EMAIL / PHONE</th><th>COMPANY / NOTES</th><th>ACTIONS</th></tr></thead><tbody><tr *ngFor="let x of adminWorkspace.contacts"><td><input class="form-control form-control-sm" [(ngModel)]="x.name" [name]="'contactName'+x.id"></td><td>{{x.userName}}<small class="d-block text-muted">{{x.userEmail}}</small></td><td><input class="form-control form-control-sm mb-1" [(ngModel)]="x.email" [name]="'contactEmail'+x.id"><input class="form-control form-control-sm" [(ngModel)]="x.phone" [name]="'contactPhone'+x.id"></td><td><input class="form-control form-control-sm mb-1" [(ngModel)]="x.company" [name]="'contactCompany'+x.id"><input class="form-control form-control-sm" [(ngModel)]="x.notes" [name]="'contactNotes'+x.id"></td><td><div class="d-flex gap-1"><button class="btn btn-sm btn-danger" type="button" (click)="saveAdminWorkspaceRecord('contacts',x)">Save</button><button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteAdminWorkspaceRecord('contacts',x)">Delete</button></div></td></tr></tbody></table><div *ngIf="!adminWorkspace.contacts.length" class="text-muted p-3">No user contacts found.</div></div>
          <div *ngIf="workspaceTab==='automations'" class="table-responsive"><table class="table align-middle"><thead><tr><th>NAME</th><th>OWNER</th><th>TRIGGER</th><th>ACTION</th><th>ENABLED</th><th>ACTIONS</th></tr></thead><tbody><tr *ngFor="let x of adminWorkspace.automations"><td><input class="form-control form-control-sm" [(ngModel)]="x.name" [name]="'autoName'+x.id"></td><td>{{x.userName}}<small class="d-block text-muted">{{x.userEmail}}</small></td><td><input class="form-control form-control-sm" [(ngModel)]="x.trigger_name" [name]="'autoTrigger'+x.id"></td><td><input class="form-control form-control-sm" [(ngModel)]="x.action_name" [name]="'autoAction'+x.id"></td><td><input type="checkbox" class="form-check-input" [(ngModel)]="x.enabled" [name]="'autoEnabled'+x.id"></td><td><div class="d-flex gap-1"><button class="btn btn-sm btn-danger" type="button" (click)="saveAdminWorkspaceRecord('automations',x)">Save</button><button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteAdminWorkspaceRecord('automations',x)">Delete</button></div></td></tr></tbody></table><div *ngIf="!adminWorkspace.automations.length" class="text-muted p-3">No user automations found.</div></div>
          <div *ngIf="workspaceTab==='actions'" class="table-responsive"><table class="table align-middle"><thead><tr><th>ACTION ITEM</th><th>OWNER</th><th>DUE DATE</th><th>PRIORITY / STATUS</th><th>ACTIONS</th></tr></thead><tbody><tr *ngFor="let x of adminWorkspace.actions"><td><input class="form-control form-control-sm" [(ngModel)]="x.title" [name]="'actionTitle'+x.id" maxlength="180"><small class="text-muted">ID {{x.id}}</small></td><td>{{x.userName}}<small class="d-block text-muted">{{x.userEmail}}</small></td><td><input class="form-control form-control-sm" type="date" [(ngModel)]="x.dueDate" [name]="'actionDue'+x.id"></td><td><select class="form-select form-select-sm mb-2" [(ngModel)]="x.priority" [name]="'actionPriority'+x.id"><option>Normal</option><option>High</option><option>Urgent</option></select><label class="small"><input type="checkbox" class="form-check-input me-1" [(ngModel)]="x.done" [name]="'actionDone'+x.id"> Completed</label></td><td><div class="d-flex gap-1"><button class="btn btn-sm btn-danger" type="button" (click)="saveAdminWorkspaceRecord('actions',x)">Save</button><button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteAdminWorkspaceRecord('actions',x)">Delete</button></div></td></tr></tbody></table><div *ngIf="!adminWorkspace.actions.length" class="text-muted p-3">No user action items found.</div></div>
          <p class="small text-muted mt-3 mb-0">Data comes from MySQL through the authenticated admin API. User workspace pages poll for shared-record changes every 5 seconds while open.</p>
        </div>
      </section>

      <section *ngSwitchCase="'hygiene'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>✚ Admin Meeting Health Monitor</h4><p class="text-muted">Review calendar records that may need attention: missing location, missing notes, or events with a past start time.</p></div><button class="btn btn-danger rounded-pill" type="button" (click)="load()">↻ Refresh records</button></div>
          <div class="alert alert-warning rounded-4 mt-3">This is a data-quality helper, not a meeting attendance report. It flags missing fields only; it does not edit or delete records.</div>
          <div class="row g-3 mt-1"><div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Calendar events</small><h3>{{items.length}}</h3></div></div><div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Missing location</small><h3 class="text-warning">{{healthMissingLocation}}</h3></div></div><div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Missing notes</small><h3 class="text-warning">{{healthMissingNotes}}</h3></div></div><div class="col-md-3 col-6"><div class="p-3 border rounded-4 h-100"><small class="text-muted">Past start times</small><h3 class="text-danger">{{healthPastEvents}}</h3></div></div></div>
          <div class="table-responsive mt-3"><table class="table align-middle"><thead><tr><th>EVENT</th><th>OWNER</th><th>START</th><th>REVIEW FLAGS</th></tr></thead><tbody><tr *ngFor="let item of healthFlaggedEvents"><td><b>{{item.title||'Untitled event'}}</b></td><td>{{item.userName||'—'}}</td><td>{{item.start_at|date:'medium'}}</td><td><span *ngFor="let flag of healthFlags(item)" class="badge rounded-pill text-bg-warning me-1">{{flag}}</span><span *ngIf="isPastCalendarEvent(item)" class="badge rounded-pill text-bg-danger">Past start</span></td></tr></tbody></table><div *ngIf="!healthFlaggedEvents.length" class="empty-state py-4"><h5>No obvious data-quality flags</h5><p>Calendar records currently have the key details this monitor checks.</p></div></div>
          <button class="btn btn-outline-danger rounded-pill mt-2" type="button" (click)="exportMeetingHealth()">Export health review CSV</button>
        </div>
      </section>

      <section *ngSwitchCase="'capacity'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>▥ Admin Calendar Capacity</h4><p class="text-muted">See how scheduled workspace events are distributed by day across the platform.</p></div><button class="btn btn-danger rounded-pill" type="button" (click)="load()">↻ Refresh calendar</button></div>
          <div class="row g-3 mt-1"><div class="col-md-4"><div class="p-3 border rounded-4"><small class="text-muted">Total calendar events</small><h3>{{items.length}}</h3></div></div><div class="col-md-4"><div class="p-3 border rounded-4"><small class="text-muted">Days with events</small><h3>{{capacityDays.length}}</h3></div></div><div class="col-md-4"><div class="p-3 border rounded-4"><small class="text-muted">Busiest day</small><h5>{{capacityDays.length?capacityDays[0].day:'No data'}}</h5><small *ngIf="capacityDays.length" class="text-muted">{{capacityDays[0].count}} event(s)</small></div></div></div>
          <div class="table-responsive mt-3"><table class="table align-middle"><thead><tr><th>DATE</th><th>EVENT COUNT</th><th>LOAD</th></tr></thead><tbody><tr *ngFor="let day of capacityDays"><td><b>{{day.day}}</b></td><td>{{day.count}}</td><td style="min-width:160px"><div class="progress rounded-pill" style="height:9px"><div class="progress-bar bg-danger" [style.width.%]="capacityDays.length > 0 && capacityDays[0].count > 0 ? (day.count / capacityDays[0].count) * 100 : 0"></div></div></td></tr></tbody></table><div *ngIf="!capacityDays.length" class="empty-state py-4"><h5>No calendar activity yet</h5><p>Capacity will appear when users have saved calendar events.</p></div></div>
          <button class="btn btn-outline-danger rounded-pill mt-2" type="button" (click)="exportCapacity()">Export capacity CSV</button>
          <p class="small text-muted mt-3 mb-0">This report uses calendar records returned by the existing admin API. It is a scheduling overview, not a performance or attendance report.</p>
        </div>
      </section>

      <section *ngSwitchCase="'diagnostics'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>◉ Live Platform Diagnostics</h4><p class="text-muted">Check whether key admin API endpoints respond using your current admin session.</p></div><button class="btn btn-danger rounded-pill" type="button" (click)="runDiagnostics()" [disabled]="diagnosticsRunning">{{diagnosticsRunning?'Checking…':'↻ Run checks'}}</button></div>
          <div class="alert alert-warning rounded-4 mt-3">These checks confirm API reachability only. They are not a security audit, and no account or payment data is changed.</div>
          <div class="row g-3 mt-1"><div class="col-md-4" *ngFor="let check of diagnosticChecks"><div class="p-3 border rounded-4 h-100"><div class="d-flex justify-content-between align-items-center gap-2"><b>{{check.name}}</b><span class="badge rounded-pill" [class.text-bg-success]="check.status==='OK'" [class.text-bg-danger]="check.status==='Failed'" [class.text-bg-secondary]="check.status==='Not checked'">{{check.status}}</span></div><small class="d-block text-muted mt-2">{{check.detail}}</small></div></div></div>
          <p class="small text-muted mt-3 mb-0">Last checked: {{diagnosticsLastRun ? (diagnosticsLastRun | date:'medium') : 'Not run yet'}}. A failed check can indicate a stopped API, expired login, or database/API error.</p>
        </div>
      </section>

      <section *ngSwitchCase="'security'" class="tool-grid">
        <div class="tool-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4>⛨ Admin Policy Checklist</h4><p class="text-muted">Track routine operational checks without changing user or payment records.</p></div><span class="badge rounded-pill text-bg-danger">Admin only</span></div>
          <div class="alert alert-warning rounded-4">This is an internal checklist, not an automated security scan or compliance certification.</div>
          <div class="list-group list-group-flush"><label *ngFor="let check of policyChecks;let i=index" class="list-group-item d-flex align-items-center gap-3 py-3"><input class="form-check-input mt-0" type="checkbox" [(ngModel)]="check.done" [name]="'policy'+i" (ngModelChange)="saveLocalToolState()"><span class="flex-grow-1"><b>{{check.label}}</b><small class="d-block text-muted">{{check.help}}</small></span><span class="badge rounded-pill" [class.text-bg-success]="check.done" [class.text-bg-secondary]="!check.done">{{check.done?'Reviewed':'Needs review'}}</span></label></div>
          <label class="form-label mt-3">Admin review notes</label><textarea class="form-control" rows="3" [(ngModel)]="policyNotes" name="policyNotes" (ngModelChange)="saveLocalToolState()" placeholder="Record follow-up owner or next review date"></textarea>
          <div class="d-flex flex-wrap gap-2 mt-3"><button class="btn btn-danger rounded-pill" type="button" (click)="exportPolicyReport()">Export policy report</button><button class="btn btn-outline-secondary rounded-pill" type="button" (click)="resetPolicyChecklist()">Reset checklist</button></div>
          <p class="small text-muted mt-3 mb-0">Checklist state and notes are saved in this browser, scoped to the current admin account. They are not written to the server.</p>
        </div>
      </section>

      <section *ngSwitchCase="'upgrade'" class="tool-grid">
        <div class="tool-card border-0 shadow-sm rounded-4 p-4">
          <!-- Active Subscription Status Banner -->
          <div *ngIf="subscription && subscription.planName !== 'Free'" class="active-plan-banner mb-4 p-4 rounded-4 text-white shadow-sm" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div class="d-flex align-items-center gap-3">
                <div class="active-plan-icon-badge">★</div>
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="badge bg-success text-white rounded-pill px-3 py-1 fw-bold" style="font-size: 11px; letter-spacing: 0.05em;">
                      ● CURRENTLY ACTIVE
                    </span>
                    <span class="text-white-50 small">30-Day Workspace License</span>
                  </div>
                  <h3 class="mb-0 fw-bold text-white">MeetSphere {{ subscription.planName }} Plan</h3>
                  <p class="mb-0 text-white-50 small mt-1">
                    Activated: {{ subscription.startedAt | date:'mediumDate' }} &nbsp;·&nbsp;
                    <span *ngIf="subscription.expiresAt">Valid Until: <b class="text-white">{{ subscription.expiresAt | date:'mediumDate' }}</b></span>
                  </p>
                </div>
              </div>
              <div class="text-end d-flex flex-column align-items-md-end gap-2">
                <div>
                  <span class="fs-3 fw-bold text-white">₹{{ subscription.amount | number:'1.2-2' }}</span>
                  <small class="text-white-50 d-block">Billed / 30 days</small>
                </div>
                <button type="button" class="btn btn-sm btn-light rounded-pill px-3 fw-bold text-dark shadow-sm" (click)="openCurrentInvoice()">
                  🧾 View / Print Tax Invoice
                </button>
              </div>
            </div>
          </div>

          <!-- Section Heading -->
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
            <div>
              <span class="eyebrow text-primary">WORKSPACE LICENSING &amp; PLANS</span>
              <h3 class="fw-bold mb-1 text-dark">Upgrade Workspace Plan</h3>
              <p class="text-muted mb-0">Select the plan that matches your meeting scale. Instant activation via secure payments.</p>
            </div>
            <div class="d-flex align-items-center gap-2 bg-light px-3 py-2 rounded-pill border">
              <span class="status-dot-green"></span>
              <small class="fw-bold text-secondary">Instant Activation · Cancel Anytime</small>
            </div>
          </div>

          <!-- Pricing Cards Grid -->
          <div class="row g-4 mb-4">
            <!-- Free Card -->
            <div class="col-lg-4 col-md-6">
              <div class="plan-card-pro h-100 d-flex flex-column" [class.is-current]="isCurrentPlan('Free')">
                <div class="plan-card-top">
                  <div class="d-flex justify-content-between align-items-start">
                    <span class="plan-badge-icon">✦</span>
                    <span *ngIf="isCurrentPlan('Free')" class="badge bg-secondary-subtle text-secondary rounded-pill px-2.5 py-1 small fw-bold">Active</span>
                  </div>
                  <h4 class="plan-title mt-2">Free</h4>
                  <p class="plan-subtitle text-muted small">For individual attendees &amp; quick catch-ups</p>
                  <div class="plan-price-wrap my-3">
                    <span class="plan-currency">₹</span>
                    <span class="plan-amount">0</span>
                    <span class="plan-period">/ 30 days</span>
                  </div>
                </div>
                <ul class="plan-features-list flex-grow-1">
                  <li><span class="check-icon">✓</span> Up to 40 mins meeting duration</li>
                  <li><span class="check-icon">✓</span> Standard 480p video quality</li>
                  <li><span class="check-icon">✓</span> Basic calendar &amp; personal scheduling</li>
                  <li><span class="check-icon">✓</span> In-app notetaker &amp; meeting minutes</li>
                  <li><span class="check-icon">✓</span> Up to 100 contacts directory</li>
                  <li class="feature-disabled"><span class="cross-icon">✕</span> Custom room fee ticketing</li>
                  <li class="feature-disabled"><span class="cross-icon">✕</span> Automated workflow triggers</li>
                </ul>
                <div class="plan-action-footer mt-auto pt-3 border-top">
                  <button *ngIf="isCurrentPlan('Free')" type="button" class="btn btn-outline-secondary rounded-pill w-100 py-2.5 fw-bold" disabled>
                    ✓ Currently Active
                  </button>
                  <button *ngIf="!isCurrentPlan('Free')" type="button" class="btn btn-outline-dark rounded-pill w-100 py-2.5 fw-bold" (click)="downgradeToFree()">
                    Switch to Free
                  </button>
                </div>
              </div>
            </div>

            <!-- Pro Card (Popular) -->
            <div class="col-lg-4 col-md-6">
              <div class="plan-card-pro h-100 d-flex flex-column popular-card" [class.is-current]="isCurrentPlan('Pro')">
                <div class="popular-ribbon">
                  <span>★ MOST POPULAR</span>
                </div>
                <div class="plan-card-top">
                  <div class="d-flex justify-content-between align-items-start">
                    <span class="plan-badge-icon pro-icon">⚡</span>
                    <span *ngIf="isCurrentPlan('Pro')" class="badge bg-success text-white rounded-pill px-2.5 py-1 small fw-bold">Active</span>
                  </div>
                  <h4 class="plan-title mt-2">Pro</h4>
                  <p class="plan-subtitle text-muted small">For consultants, freelancers &amp; power hosts</p>
                  <div class="plan-price-wrap my-3">
                    <span class="plan-currency">₹</span>
                    <span class="plan-amount">499</span>
                    <span class="plan-period">/ 30 days</span>
                  </div>
                </div>
                <ul class="plan-features-list flex-grow-1">
                  <li><span class="check-icon text-primary">✓</span> <b>Unlimited</b> meeting duration</li>
                  <li><span class="check-icon text-primary">✓</span> High-Definition 1080p video streaming</li>
                  <li><span class="check-icon text-primary">✓</span> <b>Paid Meetings Hosting</b> (Charge attendees)</li>
                  <li><span class="check-icon text-primary">✓</span> Full Workflow Rules &amp; Automations</li>
                  <li><span class="check-icon text-primary">✓</span> Meeting Brief Studio &amp; Decision Ledger</li>
                  <li><span class="check-icon text-primary">✓</span> Calendar Overlap &amp; Conflict Finder</li>
                  <li><span class="check-icon text-primary">✓</span> Personal Follow-up Action Tracker</li>
                  <li><span class="check-icon text-primary">✓</span> Priority email &amp; in-app support</li>
                </ul>
                <div class="plan-action-footer mt-auto pt-3 border-top">
                  <button *ngIf="isCurrentPlan('Pro')" type="button" class="btn btn-success rounded-pill w-100 py-2.5 fw-bold text-white shadow-sm" disabled>
                    ✓ Currently Active
                  </button>
                  <button *ngIf="!isCurrentPlan('Pro')" type="button" class="btn btn-primary rounded-pill w-100 py-2.5 fw-bold shadow-sm" style="background: linear-gradient(135deg, #635bff 0%, #4f46e5 100%);" (click)="openCheckoutModal('Pro', 499)">
                    Upgrade to Pro →
                  </button>
                </div>
              </div>
            </div>

            <!-- Business Card -->
            <div class="col-lg-4 col-md-6">
              <div class="plan-card-pro h-100 d-flex flex-column business-card" [class.is-current]="isCurrentPlan('Business')">
                <div class="plan-card-top">
                  <div class="d-flex justify-content-between align-items-start">
                    <span class="plan-badge-icon business-icon">👑</span>
                    <span *ngIf="isCurrentPlan('Business')" class="badge bg-success text-white rounded-pill px-2.5 py-1 small fw-bold">Active</span>
                  </div>
                  <h4 class="plan-title mt-2">Business</h4>
                  <p class="plan-subtitle text-muted small">For enterprises, agencies &amp; team management</p>
                  <div class="plan-price-wrap my-3">
                    <span class="plan-currency">₹</span>
                    <span class="plan-amount">999</span>
                    <span class="plan-period">/ 30 days</span>
                  </div>
                </div>
                <ul class="plan-features-list flex-grow-1">
                  <li><span class="check-icon text-dark">✓</span> <b>Everything in Pro included</b></li>
                  <li><span class="check-icon text-dark">✓</span> Multi-user Workspace Collaboration</li>
                  <li><span class="check-icon text-dark">✓</span> Admin Governance &amp; Security Audits</li>
                  <li><span class="check-icon text-dark">✓</span> User Workspace Remote Control &amp; Overrides</li>
                  <li><span class="check-icon text-dark">✓</span> Export Center (CSV/Audit-ready data)</li>
                  <li><span class="check-icon text-dark">✓</span> Dedicated Account Manager &amp; 24/7 SLA</li>
                  <li><span class="check-icon text-dark">✓</span> Custom branding &amp; white-label rooms</li>
                </ul>
                <div class="plan-action-footer mt-auto pt-3 border-top">
                  <button *ngIf="isCurrentPlan('Business')" type="button" class="btn btn-success rounded-pill w-100 py-2.5 fw-bold text-white shadow-sm" disabled>
                    ✓ Currently Active
                  </button>
                  <button *ngIf="!isCurrentPlan('Business')" type="button" class="btn btn-dark rounded-pill w-100 py-2.5 fw-bold shadow-sm" (click)="openCheckoutModal('Business', 999)">
                    Upgrade to Business →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Trust Badges Strip -->
          <div class="row g-3 p-3 rounded-4 bg-light border mt-2">
            <div class="col-md-3 col-6 d-flex align-items-center gap-2">
              <span class="fs-4">🔒</span>
              <div><b class="d-block small text-dark">256-Bit SSL Secured</b><small class="text-muted" style="font-size: 11px;">Bank-grade encryption</small></div>
            </div>
            <div class="col-md-3 col-6 d-flex align-items-center gap-2">
              <span class="fs-4">⚡</span>
              <div><b class="d-block small text-dark">Instant Activation</b><small class="text-muted" style="font-size: 11px;">Zero waiting time</small></div>
            </div>
            <div class="col-md-3 col-6 d-flex align-items-center gap-2">
              <span class="fs-4">💯</span>
              <div><b class="d-block small text-dark">100% Tax Deductible</b><small class="text-muted" style="font-size: 11px;">GST invoice included</small></div>
            </div>
            <div class="col-md-3 col-6 d-flex align-items-center gap-2">
              <span class="fs-4">🇮🇳</span>
              <div><b class="d-block small text-dark">UPI &amp; RuPay Accepted</b><small class="text-muted" style="font-size: 11px;">GPay, PhonePe, Cards</small></div>
            </div>
          </div>
        </div>
      </section>
    </ng-container>

    <section *ngIf="isAdmin && tool==='upgrade'" class="tool-card mt-4">
      <h4>Admin subscription audit</h4>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>USER</th>
              <th>PLAN</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
              <th>TRANSACTION</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of subscriptions">
              <td>{{s.userName}}<small class="d-block text-muted">{{s.userEmail}}</small></td>
              <td>{{s.plan_name}}</td>
              <td>₹{{s.amount|number:'1.0-2'}}</td>
              <td>{{s.status}}</td>
              <td>{{s.transaction_id}}</td>
              <td>{{s.started_at|date:'medium'}}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</div>

<!-- ================= COMPLETE PROFESSIONAL CHECKOUT MODAL ================= -->
<div class="checkout-backdrop" *ngIf="checkoutModalVisible" (click)="closeOnBackdrop($event)">
  <div class="checkout-card shadow-lg" (click)="$event.stopPropagation()">
    <!-- Top Bar -->
    <div class="checkout-header d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <div class="checkout-brand-badge">M</div>
        <div>
          <h5 class="mb-0 fw-bold text-dark">MeetSphere Pay</h5>
          <small class="text-muted d-flex align-items-center gap-1" style="font-size: 11px;">
            <span>🔒</span> 256-Bit SSL Encrypted Checkout
          </small>
        </div>
      </div>
      <button type="button" class="btn-close-checkout" (click)="closeCheckoutModal()">✕</button>
    </div>

    <!-- STEP 1: CHECKOUT SELECTION & FORM -->
    <div *ngIf="checkoutStep === 'checkout'" class="checkout-body">
      <!-- Order Summary Card -->
      <div class="order-summary-card mb-3 p-3 rounded-4 border bg-light">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <span class="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-0.5 fw-bold small">
              30-DAY PLAN
            </span>
            <h5 class="fw-bold mb-0 mt-1 text-dark">MeetSphere {{ checkoutPlan }} Plan</h5>
            <small class="text-muted">Full access to {{ checkoutPlan === 'Business' ? 'enterprise team tools' : 'HD meetings & automations' }}</small>
          </div>
          <div class="text-end">
            <span class="summary-final-price">₹{{ finalPayableAmount | number:'1.2-2' }}</span>
            <small class="d-block text-muted" style="font-size: 11px;">Inclusive of all taxes</small>
          </div>
        </div>

        <!-- Breakdown Details Accordion/Toggle -->
        <div class="pt-2 mt-2 border-top small text-secondary">
          <div class="d-flex justify-content-between mb-1">
            <span>Base Subscription Fee:</span>
            <span>₹{{ basePrice | number:'1.2-2' }}</span>
          </div>
          <div class="d-flex justify-content-between mb-1">
            <span>GST (18% Included):</span>
            <span>₹{{ gstAmount | number:'1.2-2' }}</span>
          </div>
          <div *ngIf="appliedDiscount > 0" class="d-flex justify-content-between text-success fw-bold mb-1">
            <span>Promo Discount ({{ appliedCoupon }}):</span>
            <span>- ₹{{ appliedDiscount | number:'1.2-2' }}</span>
          </div>
        </div>

        <!-- Coupon Code Row -->
        <div class="mt-2 pt-2 border-top">
          <div *ngIf="!appliedCoupon" class="input-group input-group-sm">
            <input type="text" class="form-control text-uppercase fw-bold" [(ngModel)]="couponInput" placeholder="Promo code (e.g. SAVE20, MEET100)">
            <button class="btn btn-outline-primary fw-bold px-3" type="button" (click)="applyCoupon()">
              Apply
            </button>
          </div>
          <div *ngIf="appliedCoupon" class="d-flex justify-content-between align-items-center bg-success-subtle text-success p-2 rounded-3 small fw-bold">
            <span>✓ Coupon '{{ appliedCoupon }}' applied (₹{{ appliedDiscount }} OFF)</span>
            <button type="button" class="btn btn-sm btn-link text-danger p-0 fw-bold" (click)="removeCoupon()">Remove</button>
          </div>
          <div *ngIf="couponMessage" class="small text-danger mt-1">{{ couponMessage }}</div>
        </div>
      </div>

      <!-- Payment Method Navigation Tabs -->
      <label class="form-label small fw-bold text-uppercase text-secondary mb-2" style="letter-spacing: 0.05em;">
        SELECT PAYMENT METHOD
      </label>
      <div class="payment-tabs-grid mb-3">
        <button type="button" class="pay-tab-btn" [class.active]="paymentTab === 'UPI'" (click)="setPaymentTab('UPI')">
          <span class="pay-tab-icon">📱</span>
          <b>UPI / QR</b>
          <small>GPay, PhonePe</small>
        </button>

        <button type="button" class="pay-tab-btn" [class.active]="paymentTab === 'CARD'" (click)="setPaymentTab('CARD')">
          <span class="pay-tab-icon">💳</span>
          <b>Card</b>
          <small>Debit / Credit</small>
        </button>

        <button type="button" class="pay-tab-btn" [class.active]="paymentTab === 'NETBANKING'" (click)="setPaymentTab('NETBANKING')">
          <span class="pay-tab-icon">🏛️</span>
          <b>NetBanking</b>
          <small>All Indian Banks</small>
        </button>

        <button type="button" class="pay-tab-btn" [class.active]="paymentTab === 'WALLET'" (click)="setPaymentTab('WALLET')">
          <span class="pay-tab-icon">👛</span>
          <b>Wallets</b>
          <small>Paytm, Amazon</small>
        </button>
      </div>

      <!-- Tab Details Box -->
      <div class="payment-tab-content p-3 rounded-4 border bg-white mb-3">
        <!-- TAB 1: UPI / QR -->
        <div *ngIf="paymentTab === 'UPI'">
          <div class="row g-3 align-items-center">
            <!-- QR Code Card -->
            <div class="col-sm-5 text-center">
              <div class="upi-qr-wrapper p-3 rounded-3 border bg-light d-inline-block shadow-sm">
                <!-- Authentic SVG QR with finder modules and logo -->
                <svg width="140" height="140" viewBox="0 0 140 140" class="upi-qr-svg">
                  <!-- Background -->
                  <rect width="140" height="140" fill="#ffffff" rx="8"/>
                  <!-- Top-Left Finder -->
                  <rect x="10" y="10" width="35" height="35" rx="4" fill="#17172d"/>
                  <rect x="16" y="16" width="23" height="23" rx="2" fill="#ffffff"/>
                  <rect x="21" y="21" width="13" height="13" rx="1" fill="#635bff"/>
                  <!-- Top-Right Finder -->
                  <rect x="95" y="10" width="35" height="35" rx="4" fill="#17172d"/>
                  <rect x="101" y="16" width="23" height="23" rx="2" fill="#ffffff"/>
                  <rect x="106" y="21" width="13" height="13" rx="1" fill="#635bff"/>
                  <!-- Bottom-Left Finder -->
                  <rect x="10" y="95" width="35" height="35" rx="4" fill="#17172d"/>
                  <rect x="16" y="101" width="23" height="23" rx="2" fill="#ffffff"/>
                  <rect x="21" y="106" width="13" height="13" rx="1" fill="#635bff"/>
                  <!-- QR Data Patterns -->
                  <rect x="52" y="12" width="6" height="6" fill="#17172d"/>
                  <rect x="64" y="12" width="6" height="6" fill="#17172d"/>
                  <rect x="76" y="12" width="6" height="6" fill="#17172d"/>
                  <rect x="52" y="24" width="6" height="6" fill="#17172d"/>
                  <rect x="64" y="24" width="6" height="6" fill="#17172d"/>
                  <rect x="82" y="24" width="6" height="6" fill="#17172d"/>
                  <rect x="58" y="36" width="6" height="6" fill="#17172d"/>
                  <rect x="70" y="36" width="6" height="6" fill="#17172d"/>
                  <rect x="12" y="52" width="6" height="6" fill="#17172d"/>
                  <rect x="24" y="52" width="6" height="6" fill="#17172d"/>
                  <rect x="36" y="52" width="6" height="6" fill="#17172d"/>
                  <rect x="48" y="52" width="6" height="6" fill="#17172d"/>
                  <rect x="60" y="52" width="6" height="6" fill="#17172d"/>
                  <rect x="72" y="52" width="6" height="6" fill="#17172d"/>
                  <rect x="84" y="52" width="6" height="6" fill="#17172d"/>
                  <rect x="96" y="52" width="6" height="6" fill="#17172d"/>
                  <rect x="108" y="52" width="6" height="6" fill="#17172d"/>
                  <rect x="120" y="52" width="6" height="6" fill="#17172d"/>
                  <rect x="12" y="64" width="6" height="6" fill="#17172d"/>
                  <rect x="24" y="64" width="6" height="6" fill="#17172d"/>
                  <rect x="84" y="64" width="6" height="6" fill="#17172d"/>
                  <rect x="102" y="64" width="6" height="6" fill="#17172d"/>
                  <rect x="114" y="64" width="6" height="6" fill="#17172d"/>
                  <rect x="12" y="76" width="6" height="6" fill="#17172d"/>
                  <rect x="30" y="76" width="6" height="6" fill="#17172d"/>
                  <rect x="48" y="76" width="6" height="6" fill="#17172d"/>
                  <rect x="84" y="76" width="6" height="6" fill="#17172d"/>
                  <rect x="96" y="76" width="6" height="6" fill="#17172d"/>
                  <rect x="120" y="76" width="6" height="6" fill="#17172d"/>
                  <rect x="52" y="88" width="6" height="6" fill="#17172d"/>
                  <rect x="64" y="88" width="6" height="6" fill="#17172d"/>
                  <rect x="76" y="88" width="6" height="6" fill="#17172d"/>
                  <rect x="102" y="88" width="6" height="6" fill="#17172d"/>
                  <rect x="114" y="88" width="6" height="6" fill="#17172d"/>
                  <rect x="52" y="100" width="6" height="6" fill="#17172d"/>
                  <rect x="64" y="100" width="6" height="6" fill="#17172d"/>
                  <rect x="82" y="100" width="6" height="6" fill="#17172d"/>
                  <rect x="96" y="100" width="6" height="6" fill="#17172d"/>
                  <rect x="114" y="100" width="6" height="6" fill="#17172d"/>
                  <rect x="58" y="112" width="6" height="6" fill="#17172d"/>
                  <rect x="70" y="112" width="6" height="6" fill="#17172d"/>
                  <rect x="88" y="112" width="6" height="6" fill="#17172d"/>
                  <rect x="102" y="112" width="6" height="6" fill="#17172d"/>
                  <rect x="120" y="112" width="6" height="6" fill="#17172d"/>
                  <rect x="52" y="124" width="6" height="6" fill="#17172d"/>
                  <rect x="76" y="124" width="6" height="6" fill="#17172d"/>
                  <rect x="96" y="124" width="6" height="6" fill="#17172d"/>
                  <rect x="114" y="124" width="6" height="6" fill="#17172d"/>
                  <!-- Center MeetSphere Logo Badge -->
                  <circle cx="70" cy="70" r="16" fill="#ffffff" stroke="#635bff" stroke-width="2"/>
                  <text x="70" y="75" font-family="sans-serif" font-size="14" font-weight="900" fill="#635bff" text-anchor="middle">M</text>
                </svg>
                <div class="mt-1 small fw-bold text-dark" style="font-size: 11px;">Scan &amp; Pay ₹{{ finalPayableAmount }}</div>
              </div>
            </div>

            <!-- UPI Apps & VPA form -->
            <div class="col-sm-7">
              <div class="d-flex align-items-center gap-1.5 mb-2">
                <span class="badge bg-light text-dark border py-1 px-2 fw-semibold" style="font-size: 10px;">GPay</span>
                <span class="badge bg-light text-dark border py-1 px-2 fw-semibold" style="font-size: 10px;">PhonePe</span>
                <span class="badge bg-light text-dark border py-1 px-2 fw-semibold" style="font-size: 10px;">Paytm</span>
                <span class="badge bg-light text-dark border py-1 px-2 fw-semibold" style="font-size: 10px;">BHIM</span>
                <span class="badge bg-light text-dark border py-1 px-2 fw-semibold" style="font-size: 10px;">CRED</span>
              </div>
              <label class="form-label small fw-semibold text-secondary mb-1">Enter UPI ID / VPA</label>
              <div class="input-group input-group-sm mb-2">
                <input type="text" class="form-control" [(ngModel)]="upiVpa" placeholder="username@okaxis">
                <button class="btn btn-outline-secondary fw-semibold" type="button" (click)="verifyUpiVpa()">Verify</button>
              </div>
              <!-- Quick Suffix Pills -->
              <div class="d-flex gap-1 flex-wrap mb-2">
                <button type="button" class="btn btn-sm btn-light border py-0 px-1.5 text-secondary" style="font-size: 10.5px;" (click)="appendUpiSuffix('@okaxis')">&#64;okaxis</button>
                <button type="button" class="btn btn-sm btn-light border py-0 px-1.5 text-secondary" style="font-size: 10.5px;" (click)="appendUpiSuffix('@okhdfcbank')">&#64;okhdfcbank</button>
                <button type="button" class="btn btn-sm btn-light border py-0 px-1.5 text-secondary" style="font-size: 10.5px;" (click)="appendUpiSuffix('@paytm')">&#64;paytm</button>
                <button type="button" class="btn btn-sm btn-light border py-0 px-1.5 text-secondary" style="font-size: 10.5px;" (click)="appendUpiSuffix('@ybl')">&#64;ybl</button>
              </div>
              <small *ngIf="upiVerified" class="text-success fw-bold d-block" style="font-size: 11px;">
                ✓ Verified Account: {{ session.user?.fullName }}
              </small>
              <small class="text-muted d-block mt-1" style="font-size: 11px;">
                ⏱️ Session expires in {{ formatTimer(qrCountdown) }}
              </small>
            </div>
          </div>
        </div>

        <!-- TAB 2: CREDIT / DEBIT CARD -->
        <div *ngIf="paymentTab === 'CARD'">
          <!-- Live 3D Virtual Card Card -->
          <div class="virtual-credit-card mb-3 p-3 rounded-4 text-white shadow-sm" [ngClass]="cardBrandClass">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="card-chip-icon"></span>
              <span class="card-network-label fw-bold fs-6">{{ cardBrandLabel }}</span>
            </div>
            <div class="card-number-display mb-3 fs-5 fw-bold" style="letter-spacing: 0.12em;">
              {{ cardData.number || '•••• •••• •••• ••••' }}
            </div>
            <div class="d-flex justify-content-between align-items-end text-uppercase" style="font-size: 11px;">
              <div>
                <span class="text-white-50 d-block" style="font-size: 9px;">CARDHOLDER</span>
                <b>{{ cardData.name || 'YOUR NAME' }}</b>
              </div>
              <div>
                <span class="text-white-50 d-block" style="font-size: 9px;">EXPIRES</span>
                <b>{{ cardData.expiry || 'MM/YY' }}</b>
              </div>
            </div>
          </div>

          <!-- Card Form Inputs -->
          <div class="mb-2">
            <label class="form-label small fw-semibold text-secondary mb-1">Card Number</label>
            <input type="text" class="form-control form-control-sm" [(ngModel)]="cardData.number" (input)="formatCardNumber($event)" placeholder="4242 •••• •••• 4242" maxlength="19">
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="form-label small fw-semibold text-secondary mb-1">Cardholder Name</label>
              <input type="text" class="form-control form-control-sm text-uppercase" [(ngModel)]="cardData.name" placeholder="Full name on card">
            </div>
            <div class="col-3">
              <label class="form-label small fw-semibold text-secondary mb-1">Expiry</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="cardData.expiry" (input)="formatCardExpiry($event)" placeholder="MM/YY" maxlength="5">
            </div>
            <div class="col-3">
              <label class="form-label small fw-semibold text-secondary mb-1">CVV</label>
              <input type="password" class="form-control form-control-sm" [(ngModel)]="cardData.cvv" placeholder="123" maxlength="4">
            </div>
          </div>
          <div class="form-check small">
            <input class="form-check-input" type="checkbox" id="saveCardCheck" checked>
            <label class="form-check-label text-muted" for="saveCardCheck" style="font-size: 11px;">
              Save card securely as per RBI tokenization guidelines
            </label>
          </div>
        </div>

        <!-- TAB 3: NETBANKING -->
        <div *ngIf="paymentTab === 'NETBANKING'">
          <label class="form-label small fw-semibold text-secondary mb-2">Popular Indian Banks</label>
          <div class="popular-banks-grid mb-3">
            <button type="button" class="bank-pill-btn" [class.active]="selectedBank === 'State Bank of India'" (click)="selectedBank = 'State Bank of India'">
              <span class="bank-dot sbi"></span> SBI
            </button>
            <button type="button" class="bank-pill-btn" [class.active]="selectedBank === 'HDFC Bank'" (click)="selectedBank = 'HDFC Bank'">
              <span class="bank-dot hdfc"></span> HDFC
            </button>
            <button type="button" class="bank-pill-btn" [class.active]="selectedBank === 'ICICI Bank'" (click)="selectedBank = 'ICICI Bank'">
              <span class="bank-dot icici"></span> ICICI
            </button>
            <button type="button" class="bank-pill-btn" [class.active]="selectedBank === 'Axis Bank'" (click)="selectedBank = 'Axis Bank'">
              <span class="bank-dot axis"></span> Axis
            </button>
            <button type="button" class="bank-pill-btn" [class.active]="selectedBank === 'Kotak Mahindra Bank'" (click)="selectedBank = 'Kotak Mahindra Bank'">
              <span class="bank-dot kotak"></span> Kotak
            </button>
            <button type="button" class="bank-pill-btn" [class.active]="selectedBank === 'Punjab National Bank'" (click)="selectedBank = 'Punjab National Bank'">
              <span class="bank-dot pnb"></span> PNB
            </button>
          </div>
          <label class="form-label small fw-semibold text-secondary mb-1">Or choose all other banks</label>
          <select class="form-select form-select-sm" [(ngModel)]="selectedBank">
            <option>State Bank of India</option>
            <option>HDFC Bank</option>
            <option>ICICI Bank</option>
            <option>Axis Bank</option>
            <option>Kotak Mahindra Bank</option>
            <option>Punjab National Bank</option>
            <option>Bank of Baroda</option>
            <option>Canara Bank</option>
            <option>Union Bank of India</option>
            <option>IndusInd Bank</option>
            <option>IDFC FIRST Bank</option>
            <option>Yes Bank</option>
            <option>Federal Bank</option>
          </select>
        </div>

        <!-- TAB 4: WALLETS -->
        <div *ngIf="paymentTab === 'WALLET'">
          <label class="form-label small fw-semibold text-secondary mb-2">Select Digital Wallet</label>
          <div class="row g-2">
            <div class="col-6">
              <label class="wallet-radio-box p-2.5 rounded-3 border d-flex align-items-center gap-2" [class.active]="selectedWallet === 'Paytm'">
                <input type="radio" name="wsub" value="Paytm" [(ngModel)]="selectedWallet">
                <span class="fw-bold small">Paytm Wallet</span>
              </label>
            </div>
            <div class="col-6">
              <label class="wallet-radio-box p-2.5 rounded-3 border d-flex align-items-center gap-2" [class.active]="selectedWallet === 'PhonePe'">
                <input type="radio" name="wsub" value="PhonePe" [(ngModel)]="selectedWallet">
                <span class="fw-bold small">PhonePe Wallet</span>
              </label>
            </div>
            <div class="col-6">
              <label class="wallet-radio-box p-2.5 rounded-3 border d-flex align-items-center gap-2" [class.active]="selectedWallet === 'Amazon Pay'">
                <input type="radio" name="wsub" value="Amazon Pay" [(ngModel)]="selectedWallet">
                <span class="fw-bold small">Amazon Pay</span>
              </label>
            </div>
            <div class="col-6">
              <label class="wallet-radio-box p-2.5 rounded-3 border d-flex align-items-center gap-2" [class.active]="selectedWallet === 'MobiKwik'">
                <input type="radio" name="wsub" value="MobiKwik" [(ngModel)]="selectedWallet">
                <span class="fw-bold small">MobiKwik</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <button type="button" class="btn btn-primary rounded-pill w-100 py-3 fw-bold fs-6 text-white shadow-sm" style="background: linear-gradient(135deg, #635bff 0%, #4338ca 100%);" (click)="processPayment()">
        🔒 Pay ₹{{ finalPayableAmount | number:'1.2-2' }} &amp; Activate {{ checkoutPlan }}
      </button>

      <div class="d-flex justify-content-center align-items-center gap-3 mt-2 text-muted" style="font-size: 11px;">
        <span>✓ Instant Access</span>
        <span>·</span>
        <span>✓ Tax Invoice Provided</span>
        <span>·</span>
        <span>✓ Cancel Anytime</span>
      </div>
    </div>

    <!-- STEP 2: PROCESSING SCREEN -->
    <div *ngIf="checkoutStep === 'processing'" class="checkout-body text-center py-5">
      <div class="payment-processing-spinner mb-4">
        <div class="spinner-border text-primary" style="width: 3.5rem; height: 3.5rem;" role="status"></div>
      </div>
      <h5 class="fw-bold text-dark mb-1">Processing Secure Payment...</h5>
      <p class="text-muted small mb-4">Please do not refresh or close this browser window.</p>
      
      <div class="processing-steps-box p-3 rounded-4 bg-light text-start mx-auto" style="max-width: 380px;">
        <div class="d-flex align-items-center gap-2 mb-2 small" [class.text-success]="processingStage >= 1" [class.text-muted]="processingStage < 1">
          <span>{{ processingStage >= 1 ? '✓' : '○' }}</span>
          <b>Securing 256-bit payment channel</b>
        </div>
        <div class="d-flex align-items-center gap-2 mb-2 small" [class.text-success]="processingStage >= 2" [class.text-muted]="processingStage < 2">
          <span>{{ processingStage >= 2 ? '✓' : '○' }}</span>
          <b>Authorizing with {{ paymentTab }} gateway</b>
        </div>
        <div class="d-flex align-items-center gap-2 small" [class.text-success]="processingStage >= 3" [class.text-muted]="processingStage < 3">
          <span>{{ processingStage >= 3 ? '✓' : '○' }}</span>
          <b>Provisioning MeetSphere {{ checkoutPlan }} license</b>
        </div>
      </div>
    </div>

    <!-- STEP 3: SUCCESS & TAX INVOICE SCREEN -->
    <div *ngIf="checkoutStep === 'success'" class="checkout-body text-center py-4">
      <div class="success-icon-badge mb-3">✓</div>
      <h4 class="fw-bold text-dark mb-1">Payment Successful!</h4>
      <p class="text-muted small mb-3">
        Welcome to <b>MeetSphere {{ checkoutPlan }}</b>! Your subscription is now active for 30 days.
      </p>

      <!-- Digital Receipt Card -->
      <div class="tax-invoice-card p-3 rounded-4 border bg-light text-start mb-3">
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
          <div>
            <b class="text-dark small d-block">TAX INVOICE / RECEIPT</b>
            <code class="text-primary fw-bold" style="font-size: 11px;">{{ invoiceData?.invoiceNumber }}</code>
          </div>
          <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fw-bold">
            ✓ PAID
          </span>
        </div>

        <div class="row g-2 small text-secondary">
          <div class="col-6">
            <span class="text-muted d-block" style="font-size: 10.5px;">BILLED TO</span>
            <b class="text-dark">{{ session.user?.fullName }}</b>
            <small class="d-block text-muted" style="font-size: 10px;">{{ session.user?.email }}</small>
          </div>
          <div class="col-6 text-end">
            <span class="text-muted d-block" style="font-size: 10.5px;">TRANSACTION ID / UTR</span>
            <code class="text-dark fw-bold" style="font-size: 11px;">{{ invoiceData?.transactionId }}</code>
          </div>
          <div class="col-6 mt-2">
            <span class="text-muted d-block" style="font-size: 10.5px;">PLAN SUBSCRIBED</span>
            <b class="text-dark">MeetSphere {{ checkoutPlan }} (30 Days)</b>
          </div>
          <div class="col-6 text-end mt-2">
            <span class="text-muted d-block" style="font-size: 10.5px;">PAYMENT METHOD</span>
            <b class="text-dark">{{ invoiceData?.method }}</b>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
          <b class="text-dark">Total Amount Paid:</b>
          <span class="fs-5 fw-bold text-primary">₹{{ invoiceData?.amount | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex flex-wrap gap-2">
        <button type="button" class="btn btn-outline-primary rounded-pill flex-grow-1 py-2 fw-bold" (click)="printTaxInvoice()">
          🖨️ Download / Print Tax Invoice
        </button>
        <button type="button" class="btn btn-primary rounded-pill flex-grow-1 py-2 fw-bold text-white shadow-sm" (click)="finishCheckout()">
          🚀 Start Using {{ checkoutPlan }}
        </button>
      </div>
      <div class="text-center mt-2">
        <a routerLink="/payment-history" (click)="closeCheckoutModal()" class="small text-decoration-none fw-bold text-secondary">
          View in Payment History →
        </a>
      </div>
    </div>

  </div>
</div>

<!-- ================= PROFESSIONAL CENTERED CONFIRMATION MODAL ================= -->
<div class="delete-modal-backdrop" *ngIf="confirmDeleteModal" (click)="closeDeleteModal()">
  <div class="delete-modal-card text-center p-4 shadow-lg" (click)="$event.stopPropagation()">
    <!-- Warning Icon Pulse Badge -->
    <div class="delete-modal-icon-circle mx-auto mb-3">
      <span class="delete-modal-icon">🗑️</span>
    </div>

    <h4 class="fw-bold text-dark mb-1">Confirm Cancellation &amp; Deletion</h4>
    <p class="text-muted small mb-3">Are you sure you want to proceed? This action cannot be undone.</p>

    <!-- Target Item Preview -->
    <div class="delete-target-preview p-3 rounded-3 border text-start mb-4" *ngIf="deleteTarget">
      <div class="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
        <span *ngIf="deleteTarget.isMeetSphereRoom" class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fw-bold" style="font-size: 11px;">
          ✦ MeetSphere Video Room
        </span>
        <span *ngIf="!deleteTarget.isMeetSphereRoom" class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-2.5 py-1 fw-bold" style="font-size: 11px;">
          🗓️ {{ deleteTarget.kind | titlecase }} Item
        </span>
      </div>
      <div class="fw-bold text-dark fs-6 text-truncate mb-1">{{ deleteTarget.title }}</div>
      <div class="text-secondary small" style="font-size: 12px; line-height: 1.4;">{{ deleteTarget.subtitle }}</div>
    </div>

    <!-- Centered Action Buttons -->
    <div class="d-flex gap-2 justify-content-center">
      <button type="button" class="btn btn-light border rounded-pill px-4 py-2 fw-semibold text-secondary" (click)="closeDeleteModal()">
        Cancel
      </button>
      <button type="button" class="btn btn-danger rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-1.5" (click)="confirmDelete()">
        <span>🗑️</span>
        <span>Yes, Delete</span>
      </button>
    </div>
  </div>
</div>
`,
  styles: [`
  .cal-view-shell {
    background: #ffffff;
    color: #1e293b;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 28px 32px 50px;
    position: relative;
    min-height: 580px;
    box-shadow: 0 4px 24px rgba(15, 23, 42, 0.05);
    font-family: inherit;
  }
  .cal-title {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
  }
  .cal-icon-btn {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    text-decoration: none;
    font-size: 16px;
    transition: all 0.15s ease;
  }
  .cal-icon-btn:hover {
    color: #635bff;
    background: #eef2ff;
    border-color: #c7d2fe;
    transform: translateY(-1px);
  }
  .cal-pill-btn {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #334155;
    padding: 7px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    transition: all 0.15s ease;
  }
  .cal-pill-btn:hover {
    background: #f8fafc;
    border-color: #635bff;
    color: #635bff;
  }
  .cal-search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .cal-search-icon {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    font-size: 13px;
  }
  .cal-search-input {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #0f172a;
    padding: 7px 32px 7px 32px;
    border-radius: 10px;
    font-size: 13px;
    width: 220px;
    transition: width 0.2s, border-color 0.2s, box-shadow 0.2s;
  }
  .cal-search-input:focus {
    width: 280px;
    outline: none;
    border-color: #635bff;
    box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.15);
  }
  .cal-search-input::placeholder {
    color: #94a3b8;
  }
  .cal-search-clear {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 12px;
  }
  .cal-toggle-group {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 3px;
    gap: 3px;
  }
  .cal-toggle-btn {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .cal-toggle-btn:hover {
    color: #334155;
  }
  .cal-toggle-btn.active {
    background: #ffffff;
    color: #635bff;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  }
  .cal-date-indicator {
    background: transparent;
    border: none;
    color: #0f172a;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s ease;
  }
  .cal-date-indicator:hover {
    background: #f1f5f9;
  }
  /* Photo 2 Windows 11 / Modern Calendar Flyout */
  .cal-win-datepicker {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    z-index: 1050;
    width: 320px;
    background: #1f1f23;
    color: #f4f4f5;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 16px 18px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(20px);
    user-select: none;
    animation: calFadeInDown 0.15s ease-out;
  }
  @keyframes calFadeInDown {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .cal-wdp-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 10px;
  }
  .cal-wdp-header-date {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: -0.01em;
  }
  .cal-wdp-btn-icon {
    background: #2a2a2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #a1a1aa;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    display: grid;
    place-items: center;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.15s ease;
  }
  .cal-wdp-btn-icon:hover {
    color: #ffffff;
    background: #3f3f46;
  }
  .cal-wdp-month-title {
    font-size: 14px;
    font-weight: 700;
    color: #f4f4f5;
  }
  .cal-wdp-nav-arrow {
    background: transparent;
    border: none;
    color: #a1a1aa;
    font-size: 10px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.15s;
  }
  .cal-wdp-nav-arrow:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }
  .cal-wdp-weekdays-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
  }
  .cal-wdp-weekday {
    font-size: 12px;
    font-weight: 600;
    color: #a1a1aa;
  }
  .cal-wdp-days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    row-gap: 6px;
  }
  .cal-wdp-day-cell {
    background: transparent;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    margin: 0 auto;
    transition: all 0.15s ease;
  }
  .cal-wdp-day-cell.current-month {
    color: #f4f4f5;
  }
  .cal-wdp-day-cell.other-month {
    color: #52525b;
  }
  .cal-wdp-day-cell:hover:not(.selected-day) {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
  .cal-wdp-day-cell.selected-day {
    background: #38bdf8 !important;
    color: #09090b !important;
    font-weight: 800;
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.5);
  }
  .cal-wdp-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .cal-wdp-stepper-btn {
    background: #2a2a2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f4f4f5;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: grid;
    place-items: center;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.15s;
  }
  .cal-wdp-stepper-btn:hover {
    background: #3f3f46;
  }
  .cal-wdp-focus-mins {
    color: #ffffff;
    font-size: 13px;
    min-width: 58px;
    text-align: center;
  }
  .cal-wdp-focus-btn {
    background: #2a2a2e;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    font-size: 12.5px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
  }
  .cal-wdp-focus-btn:hover {
    background: #3f3f46;
  }
  .cal-wdp-focus-btn.active {
    background: #38bdf8;
    color: #09090b;
    border-color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
  }
  .cal-range-pill {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    transition: all 0.15s ease;
  }
  .cal-range-pill:hover {
    color: #635bff;
    border-color: #635bff;
    background: #f8fafc;
  }
  .cal-range-pill.active {
    background: #635bff;
    color: #ffffff;
    border-color: #635bff;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(99, 91, 255, 0.3);
  }
  .cal-empty-hero {
    padding: 40px 10px 30px;
  }
  .cal-hero-title {
    font-size: 34px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
    letter-spacing: -0.03em;
    margin-bottom: 16px;
  }
  .cal-hero-desc {
    color: #64748b;
    font-size: 15px;
    line-height: 1.6;
    max-width: 480px;
    margin-bottom: 18px;
  }
  .cal-learn-more {
    color: #635bff;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .cal-learn-more:hover {
    text-decoration: underline;
    color: #4f46e5;
  }
  .cal-btn-schedule {
    background: #eef2ff;
    color: #4338ca;
    border: 1px solid #c7d2fe;
    border-radius: 12px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(99, 91, 255, 0.1);
    transition: all 0.2s ease;
  }
  .cal-btn-schedule:hover {
    background: #e0e7ff;
    color: #3730a3;
    border-color: #a5b4fc;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 91, 255, 0.15);
  }
  .cal-art-wrap {
    position: relative;
    width: 380px;
    height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cal-art-hex {
    position: absolute;
    width: 210px;
    height: 230px;
    background: linear-gradient(135deg, #eef2ff 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 36px;
    transform: rotate(18deg);
    opacity: 0.9;
    right: 15px;
    top: 5px;
  }
  .cal-art-svg-path {
    position: absolute;
    width: 200px;
    height: 200px;
    left: -10px;
    bottom: -10px;
  }
  .cal-confirmed-card {
    position: absolute;
    left: 10px;
    top: 20px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px 18px;
    text-align: center;
    z-index: 2;
    min-width: 105px;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
  }
  .cal-avatar-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    margin: 0 auto 6px;
    display: grid;
    place-items: center;
    font-size: 20px;
  }
  .cal-confirmed-text {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
  }
  .cal-confirmed-icon {
    font-size: 14px;
  }
  .cal-browser-mockup {
    position: absolute;
    right: 15px;
    bottom: 10px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    width: 260px;
    z-index: 3;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  }
  .cal-browser-head {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 8px 12px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .dot.red { background: #ef4444; }
  .dot.yellow { background: #f59e0b; }
  .dot.green { background: #10b981; }
  .dot.purple { background: #635bff; }
  .mock-line {
    height: 6px;
    border-radius: 4px;
    background: #e2e8f0;
  }
  .mock-line.line-1 { width: 90%; }
  .mock-line.line-2 { width: 75%; }
  .mock-line.line-3 { width: 60%; }
  .cal-floating-footer {
    position: absolute;
    right: 24px;
    bottom: 18px;
    z-index: 10;
  }
  .cal-chat-fab {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #0f172a;
    display: grid;
    place-items: center;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    transition: all 0.2s ease;
  }
  .cal-chat-fab:hover {
    background: #f8fafc;
    color: #635bff;
    transform: translateY(-1px);
  }
  .cal-get-started-pill {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 20px;
    padding: 6px 14px;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
  }
  .cal-gs-progress {
    width: 40px;
    height: 4px;
    background: #334155;
    border-radius: 4px;
    overflow: hidden;
  }
  .cal-gs-bar {
    display: block;
    width: 50%;
    height: 100%;
    background: #635bff;
  }
  .cal-dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 6px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 6px;
    z-index: 20;
    min-width: 180px;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
  }
  .cal-dropdown-item {
    padding: 8px 12px;
    font-size: 13px;
    color: #334155;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.15s ease;
  }
  .cal-dropdown-item:hover {
    background: #f8fafc;
    color: #635bff;
  }
  .cal-dropdown-item.active {
    background: #eef2ff;
    color: #635bff;
    font-weight: 700;
  }
  .cal-meeting-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 18px 22px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
    transition: all 0.2s ease;
  }
  .cal-meeting-card:hover {
    border-color: #635bff;
    box-shadow: 0 8px 20px rgba(99, 91, 255, 0.08);
    transform: translateY(-1px);
  }
  .cal-meeting-time-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 8px 14px;
    text-align: center;
    min-width: 65px;
  }
  .cal-month {
    display: block;
    font-size: 11px;
    font-weight: 800;
    color: #635bff;
    text-transform: uppercase;
  }
  .cal-day {
    display: block;
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.1;
  }
  .cal-meeting-name {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }
  .cal-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(4px);
    display: grid;
    place-items: center;
    z-index: 9999;
    padding: 20px;
  }
  .cal-modal-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 28px;
    width: min(100%, 540px);
    color: #0f172a;
    box-shadow: 0 25px 50px rgba(15, 23, 42, 0.2);
  }
  .cal-dark-input {
    background: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
    font-size: 13.5px !important;
    border-radius: 10px !important;
  }
  .cal-dark-input:focus {
    border-color: #635bff !important;
    box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.15) !important;
  }
  .cal-preset-btn {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .cal-preset-btn:hover {
    background: #635bff;
    color: #ffffff;
    border-color: #635bff;
  }
  .cal-modal-badge-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #eef2ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }
  /* Photo 6 Calendar Grid Styling */
  .cal-hero-schedule-title {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
  }
  .cal-nav-bar-photo {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 14px 20px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  }
  .cal-arrow-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #e2e8f0;
    border: none;
    color: #334155;
    font-size: 22px;
    font-weight: bold;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .cal-arrow-btn:hover {
    background: #cbd5e1;
    color: #0f172a;
  }
  .cal-grid-month-heading {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    min-width: 170px;
  }
  .cal-month-table-container {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    overflow: hidden;
  }
  .cal-table-header-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: #f1f5f9;
    border-bottom: 1px solid #cbd5e1;
  }
  .cal-table-th {
    padding: 12px 14px;
    font-size: 13.5px;
    font-weight: 700;
    color: #334155;
    border-right: 1px solid #cbd5e1;
    text-align: left;
  }
  .cal-table-th:last-child {
    border-right: none;
  }
  .cal-table-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-auto-rows: 122px;
  }
  .cal-table-day-cell {
    height: 122px;
    min-height: 122px;
    max-height: 122px;
    box-sizing: border-box;
    padding: 6px 8px;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    cursor: pointer;
    position: relative;
    transition: background 0.15s ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .cal-table-day-cell:nth-child(7n) {
    border-right: none;
  }
  .cal-table-day-cell:hover {
    background: #fafbfc;
  }
  .cal-table-day-cell.other-month {
    background: #f8fafc;
  }
  .cal-table-day-cell.other-month .cal-day-num {
    color: #94a3b8;
  }
  .cal-table-day-cell.today-cell {
    background: #eff6ff;
    border: 2px solid #3b82f6 !important;
    z-index: 2;
  }
  .cal-day-num {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }
  .cal-day-num.today-num {
    color: #2563eb;
    font-weight: 800;
  }
  .cal-day-add-btn {
    opacity: 0;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #3b82f6;
    font-size: 13px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .cal-table-day-cell:hover .cal-day-add-btn {
    opacity: 1;
  }
  .cal-day-add-btn:hover {
    background: #3b82f6;
    color: #ffffff;
    border-color: #3b82f6;
  }
  .cal-day-events-wrap {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    margin-top: 2px;
  }
  .cal-day-events-wrap::-webkit-scrollbar {
    width: 3px;
  }
  .cal-day-events-wrap::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.4);
    border-radius: 3px;
  }
  .cal-event-pill {
    border-radius: 7px;
    padding: 3.5px 7px;
    color: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    flex-shrink: 0;
    overflow: hidden;
  }
  .cal-event-pill:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.18);
  }
  .cal-event-pill-title {
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cal-event-pill-time {
    font-size: 9.5px;
    opacity: 0.92;
    line-height: 1.15;
    margin-top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .delete-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(8px);
    display: grid;
    place-items: center;
    z-index: 10000;
    padding: 20px;
    animation: delFadeIn 0.2s ease-out;
  }
  @keyframes delFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .delete-modal-card {
    background: #ffffff;
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 24px;
    width: min(100%, 450px);
    box-shadow: 0 25px 60px rgba(15, 23, 42, 0.3);
    animation: delSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes delSlideUp {
    from { transform: translateY(16px) scale(0.96); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }
  .delete-modal-icon-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #fef2f2;
    border: 2px solid #fee2e2;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .delete-modal-icon {
    font-size: 26px;
  }
  .delete-target-preview {
    background: #f8fafc;
    border-color: #e2e8f0;
  }
  `]
})
export class WorkspaceToolsComponent implements OnInit, OnDestroy {
  private liveRefresh?: Subscription;
  api=inject(ApiService); session=inject(SessionService); route=inject(ActivatedRoute); router=inject(Router);
  tool='calendar'; isAdmin=false; items:any[]=[]; subscriptions:any[]=[]; subscription:any=null; message=''; error='';

  // Photo 6 / Calendly-Style Calendar View State
  calViewMode: 'month' | 'agenda' = 'month';
  calGridMonth: number = new Date().getMonth();
  calGridYear: number = new Date().getFullYear();
  calSelectedEvent: any = null;
  calSearchQuery = '';
  calSourceFilter: 'all' | 'meetsphere' = 'all';
  calRangeFilter: 'today' | 'upcoming' | 'this_week' | 'last_week' | 'specific_date' | 'all' = 'all';
  calShowFilterDropdown = false;
  calShowSourceDropdown = false;
  calShowAddModal = false;
  calDateDisplay = '';
  showGetStartedPill = false;

  // Photo 2 Date Picker & Focus Session State
  calShowDatePicker = false;
  selectedCalDate: Date = new Date();
  pickerViewMonth: number = new Date().getMonth();
  pickerViewYear: number = new Date().getFullYear();
  focusMinutes = 30;
  focusTimerActive = false;
  focusSecondsRemaining = 1800;
  private focusInterval?: any;

  toggleDatePicker() {
    this.calShowDatePicker = !this.calShowDatePicker;
  }

  prevPickerMonth() {
    if (this.pickerViewMonth === 0) {
      this.pickerViewMonth = 11;
      this.pickerViewYear--;
    } else {
      this.pickerViewMonth--;
    }
  }

  nextPickerMonth() {
    if (this.pickerViewMonth === 11) {
      this.pickerViewMonth = 0;
      this.pickerViewYear++;
    } else {
      this.pickerViewMonth++;
    }
  }

  get pickerHeaderDateText(): string {
    const d = this.selectedCalDate || new Date();
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  get pickerMonthYearText(): string {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[this.pickerViewMonth]}, ${this.pickerViewYear}`;
  }

  get pickerDaysGrid(): any[] {
    const days: any[] = [];
    const firstDayIndex = new Date(this.pickerViewYear, this.pickerViewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(this.pickerViewYear, this.pickerViewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.pickerViewYear, this.pickerViewMonth, 0).getDate();

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevMonth = this.pickerViewMonth === 0 ? 11 : this.pickerViewMonth - 1;
      const prevYear = this.pickerViewMonth === 0 ? this.pickerViewYear - 1 : this.pickerViewYear;
      days.push({
        dayNumber: dNum,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        isSelected: this.isSameDay(new Date(prevYear, prevMonth, dNum), this.selectedCalDate),
        isToday: this.isSameDay(new Date(prevYear, prevMonth, dNum), new Date())
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        dayNumber: i,
        month: this.pickerViewMonth,
        year: this.pickerViewYear,
        isCurrentMonth: true,
        isSelected: this.isSameDay(new Date(this.pickerViewYear, this.pickerViewMonth, i), this.selectedCalDate),
        isToday: this.isSameDay(new Date(this.pickerViewYear, this.pickerViewMonth, i), new Date())
      });
    }

    // Next month leading days to complete 35 or 42 cells
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = this.pickerViewMonth === 11 ? 0 : this.pickerViewMonth + 1;
      const nextYear = this.pickerViewMonth === 11 ? this.pickerViewYear + 1 : this.pickerViewYear;
      days.push({
        dayNumber: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        isSelected: this.isSameDay(new Date(nextYear, nextMonth, i), this.selectedCalDate),
        isToday: this.isSameDay(new Date(nextYear, nextMonth, i), new Date())
      });
    }

    return days;
  }

  isSameDay(d1: Date, d2: Date): boolean {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  selectPickerDay(day: any) {
    this.selectedCalDate = new Date(day.year, day.month, day.dayNumber);
    this.calDateDisplay = this.selectedCalDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    this.calRangeFilter = 'specific_date';
    this.calShowDatePicker = false;
  }

  changeFocusMinutes(delta: number) {
    this.focusMinutes = Math.max(5, Math.min(120, this.focusMinutes + delta));
    if (!this.focusTimerActive) {
      this.focusSecondsRemaining = this.focusMinutes * 60;
    }
  }

  toggleFocusTimer() {
    if (this.focusTimerActive) {
      if (this.focusInterval) clearInterval(this.focusInterval);
      this.focusTimerActive = false;
      this.focusSecondsRemaining = this.focusMinutes * 60;
    } else {
      this.focusTimerActive = true;
      this.focusSecondsRemaining = this.focusMinutes * 60;
      this.focusInterval = setInterval(() => {
        if (this.focusSecondsRemaining > 0) {
          this.focusSecondsRemaining--;
        } else {
          if (this.focusInterval) clearInterval(this.focusInterval);
          this.focusTimerActive = false;
          alert('Focus session completed! Great job dedicating focused meeting prep time.');
        }
      }, 1000);
    }
  }

  get formattedFocusTime(): string {
    const mins = Math.floor(this.focusSecondsRemaining / 60);
    const secs = this.focusSecondsRemaining % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  get filteredCalendarItems(): any[] {
    let list = this.items || [];
    if (this.calSourceFilter === 'meetsphere') {
      list = list.filter((x: any) =>
        x.source === 'meetsphere' ||
        x.isMeetSphereRoom ||
        (x.location && x.location.toLowerCase().includes('meetsphere'))
      );
    }
    if (this.calSearchQuery.trim()) {
      const q = this.calSearchQuery.toLowerCase();
      list = list.filter((x: any) =>
        (x.title || '').toLowerCase().includes(q) ||
        (x.location || '').toLowerCase().includes(q) ||
        (x.notes || '').toLowerCase().includes(q) ||
        (x.userName || '').toLowerCase().includes(q) ||
        (x.meetingCode || '').toLowerCase().includes(q)
      );
    }
    const now = new Date();
    if (this.calRangeFilter === 'today') {
      const yr = now.getFullYear();
      const mo = now.getMonth();
      const dt = now.getDate();
      list = list.filter((x: any) => {
        const raw = x.start_at || x.startAt;
        if (!raw) return false;
        const d = new Date(raw);
        return d.getFullYear() === yr && d.getMonth() === mo && d.getDate() === dt;
      });
    } else if (this.calRangeFilter === 'upcoming') {
      const nowMs = now.getTime();
      list = list.filter((x: any) => {
        const d = new Date(x.start_at || x.startAt).getTime();
        return !isNaN(d) && d >= nowMs;
      });
    } else if (this.calRangeFilter === 'this_week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      list = list.filter((x: any) => {
        const d = new Date(x.start_at || x.startAt).getTime();
        return !isNaN(d) && d >= startOfWeek.getTime() && d < endOfWeek.getTime();
      });
    } else if (this.calRangeFilter === 'last_week') {
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay());
      startOfThisWeek.setHours(0, 0, 0, 0);
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
      list = list.filter((x: any) => {
        const d = new Date(x.start_at || x.startAt).getTime();
        return !isNaN(d) && d >= startOfLastWeek.getTime() && d < startOfThisWeek.getTime();
      });
    } else if (this.calRangeFilter === 'specific_date' && this.selectedCalDate) {
      const yr = this.selectedCalDate.getFullYear();
      const mo = this.selectedCalDate.getMonth();
      const dt = this.selectedCalDate.getDate();
      list = list.filter((x: any) => {
        const raw = x.start_at || x.startAt;
        if (!raw) return false;
        const d = new Date(raw);
        return d.getFullYear() === yr && d.getMonth() === mo && d.getDate() === dt;
      });
    }
    return list;
  }

  clearCalFilter() {
    this.calSearchQuery = '';
    this.calSourceFilter = 'all';
    this.calRangeFilter = 'all';
  }

  prevGridMonth() {
    if (this.calGridMonth === 0) {
      this.calGridMonth = 11;
      this.calGridYear--;
    } else {
      this.calGridMonth--;
    }
  }

  nextGridMonth() {
    if (this.calGridMonth === 11) {
      this.calGridMonth = 0;
      this.calGridYear++;
    } else {
      this.calGridMonth++;
    }
  }

  goToTodayGrid() {
    const now = new Date();
    this.calGridMonth = now.getMonth();
    this.calGridYear = now.getFullYear();
    this.selectedCalDate = now;
  }

  get gridMonthTitle(): string {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[this.calGridMonth]} ${this.calGridYear}`;
  }

  get scheduleMonthGrid(): any[] {
    const days: any[] = [];
    const year = this.calGridYear;
    const month = this.calGridMonth;
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month trailing days (Sun-aligned, faded like in photo)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const d = new Date(prevYear, prevMonth, dNum);
      days.push({
        date: d,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: this.isSameDay(d, new Date()),
        isSelected: this.isSameDay(d, this.selectedCalDate),
        events: this.getEventsForDate(d)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: this.isSameDay(d, new Date()),
        isSelected: this.isSameDay(d, this.selectedCalDate),
        events: this.getEventsForDate(d)
      });
    }

    // Next month leading days to complete 35 or 42 cells (5 or 6 rows)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const d = new Date(nextYear, nextMonth, i);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: this.isSameDay(d, new Date()),
        isSelected: this.isSameDay(d, this.selectedCalDate),
        events: this.getEventsForDate(d)
      });
    }

    return days;
  }

  getEventsForDate(date: Date): any[] {
    const yr = date.getFullYear();
    const mo = date.getMonth();
    const dt = date.getDate();

    let list = this.items || [];
    if (this.calSourceFilter === 'meetsphere') {
      list = list.filter((x: any) =>
        x.source === 'meetsphere' ||
        x.isMeetSphereRoom ||
        (x.location && x.location.toLowerCase().includes('meetsphere'))
      );
    }
    if (this.calSearchQuery.trim()) {
      const q = this.calSearchQuery.toLowerCase();
      list = list.filter((x: any) =>
        (x.title || '').toLowerCase().includes(q) ||
        (x.location || '').toLowerCase().includes(q) ||
        (x.notes || '').toLowerCase().includes(q) ||
        (x.userName || '').toLowerCase().includes(q) ||
        (x.meetingCode || '').toLowerCase().includes(q)
      );
    }

    return list.filter((x: any) => {
      const raw = x.start_at || x.startAt;
      if (!raw) return false;
      const d = new Date(raw);
      return d.getFullYear() === yr && d.getMonth() === mo && d.getDate() === dt;
    });
  }

  getEventBadgeBg(item: any, index: number = 0): string {
    const colors = [
      'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', // Vibrant Orange (Tango in photo)
      'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', // Magenta / Pink (Ballet in photo)
      'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', // Sky Blue (Ballet in photo)
      'linear-gradient(135deg, #4338ca 0%, #312e81 100%)', // Royal Indigo (Night of Hip-Hop in photo)
      'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', // Vibrant Green (Tango in photo)
      'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', // Crimson Red (Ballet for Exp in photo)
      'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'  // Purple
    ];
    if (item.isMeetSphereRoom) {
      return 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)';
    }
    let hash = 0;
    const str = String(item.title || item.id || '');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash + index) % colors.length;
    return colors[idx];
  }

  formatEventTime(startAt: any, endAt?: any): string {
    if (!startAt) return '';
    const dStart = new Date(startAt);
    if (isNaN(dStart.getTime())) return '';
    const formatTime = (d: Date) => {
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minsStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minsStr} ${ampm}`;
    };
    const startTimeStr = formatTime(dStart);
    if (endAt) {
      const dEnd = new Date(endAt);
      if (!isNaN(dEnd.getTime())) {
        return `${startTimeStr} - ${formatTime(dEnd)}`;
      }
    }
    return startTimeStr;
  }

  scheduleOnDate(date: Date) {
    const d = new Date(date);
    d.setHours(10, 0, 0, 0);
    const startIso = this.toDateTimeLocal(d);
    const end = new Date(d.getTime() + 30 * 60000);
    const endIso = this.toDateTimeLocal(end);
    const randomRoomCode = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    this.calendar = {
      title: 'Workspace Meeting',
      startAt: startIso,
      endAt: endIso,
      location: `MeetSphere Room (${randomRoomCode})`,
      notes: '• Agenda & Objectives\n• Discussion points\n• Action items'
    };
    this.calShowAddModal = true;
  }

  openEventDetailModal(ev: any) {
    this.calSelectedEvent = ev;
  }

  closeEventDetailModal() {
    this.calSelectedEvent = null;
  }

  deleteEventFromModal(ev: any) {
    if (!ev) return;
    const isRoom = !!(ev.isMeetSphereRoom || ev.source === 'meetsphere' || String(ev.id).startsWith('m_') || ev.meetingCode);
    const mId = ev.meetingId || (String(ev.id).startsWith('m_') ? Number(String(ev.id).replace('m_', '')) : (isRoom ? Number(ev.id) : undefined));
    const mCode = ev.meetingCode || '';
    const title = ev.title || 'Event';
    this.closeEventDetailModal();
    this.promptDelete('calendar', ev.id, isRoom, mId, title, mCode);
  }

  joinEventMeeting(ev: any) {
    if (!ev) return;
    const code = String(ev.meetingCode || '').trim();
    if (code) {
      this.closeEventDetailModal();
      this.router.navigate(['/room', code]);
      return;
    }
    const loc = String(ev.location || '').trim();
    if (loc.startsWith('http://') || loc.startsWith('https://')) {
      window.open(loc, '_blank');
      return;
    }
  }

  openZoom(ev: any) {
    if (!ev) return;
    const loc = String(ev.location || '').trim();
    const code = String(ev.meetingCode || '').trim();

    // 1. Direct Zoom URL if specified in location
    if (loc.toLowerCase().includes('zoom.us')) {
      window.open(loc, '_blank');
      return;
    }

    // 2. If code is a valid numeric Zoom meeting ID (9 to 11 digits)
    const digitsOnly = code.replace(/[-\s]/g, '');
    if (/^\d{9,11}$/.test(digitsOnly)) {
      window.open(`https://zoom.us/j/${digitsOnly}`, '_blank');
      return;
    }

    // 3. Official Zoom instant video meeting launcher (never fails with 3000 invalid ID)
    window.open('https://zoom.us/start/videomeeting', '_blank');
  }

  openScheduleModal(preset?: string) {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
    const startIso = this.toDateTimeLocal(now);
    const end = new Date(now.getTime() + 30 * 60000);
    const endIso = this.toDateTimeLocal(end);
    const randomRoomCode = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    this.calendar = {
      title: 'Team Sync & Project Alignment',
      startAt: startIso,
      endAt: endIso,
      location: `MeetSphere Room (${randomRoomCode})`,
      notes: '• Agenda & Objectives\n• Key discussion points\n• Action items & follow-up'
    };

    if (preset) {
      this.applyPreset(preset);
    }
    this.calShowAddModal = true;
  }

  applyPreset(type: string) {
    const start = this.calendar.startAt ? new Date(this.calendar.startAt) : new Date();
    if (isNaN(start.getTime())) return;

    if (type === 'standup') {
      this.calendar.title = '⚡ Daily Engineering Standup';
      const end = new Date(start.getTime() + 15 * 60000);
      this.calendar.endAt = this.toDateTimeLocal(end);
      this.calendar.notes = '1. What did you accomplish yesterday?\n2. What will you work on today?\n3. Any blockers or dependencies?';
    } else if (type === 'teamsync') {
      this.calendar.title = '👥 Weekly Team Sync';
      const end = new Date(start.getTime() + 30 * 60000);
      this.calendar.endAt = this.toDateTimeLocal(end);
      this.calendar.notes = '• Team updates & roadmap review\n• Cross-functional alignment\n• Open Q&A and next sprints';
    } else if (type === 'demo') {
      this.calendar.title = '💼 Client Demo & Solution Walkthrough';
      const end = new Date(start.getTime() + 45 * 60000);
      this.calendar.endAt = this.toDateTimeLocal(end);
      this.calendar.notes = '• Problem discovery & requirements\n• Live product walkthrough\n• Pricing & implementation timeline';
    } else if (type === 'strategy') {
      this.calendar.title = '🎯 Quarterly Strategy & Planning';
      const end = new Date(start.getTime() + 60 * 60000);
      this.calendar.endAt = this.toDateTimeLocal(end);
      this.calendar.notes = '• OKR progress review\n• Resource allocation & hiring\n• Key milestones & deliverables';
    }
  }

  saveCalendarEvent() {
    if (!this.calendar.title || !this.calendar.startAt) {
      this.error = 'Please provide an event title and start date/time.';
      return;
    }
    const payload = {
      title: this.calendar.title.trim(),
      startAt: this.calendar.startAt,
      endAt: this.calendar.endAt ? this.calendar.endAt : null,
      location: this.calendar.location ? this.calendar.location.trim() : null,
      notes: this.calendar.notes ? this.calendar.notes.trim() : null
    };
    this.api.addCalendar(payload).subscribe({
      next: () => {
        this.message = 'Calendar event saved in MySQL.';
        this.calendar = { title: '', startAt: '', endAt: '', location: '', notes: '' };
        this.load();
      },
      error: (e) => this.fail(e)
    });
    this.calShowAddModal = false;
  }

  loadCalendar() {
    let calList: any[] = [];
    let meetList: any[] = [];
    let remaining = 2;
    const finish = () => {
      remaining--;
      if (remaining <= 0) {
        const mappedMeetings = meetList.map((m: any) => ({
          id: 'm_' + (m.id || m.meetingId || m.meeting_id),
          meetingId: m.id || m.meetingId || m.meeting_id,
          meetingCode: m.meeting_code || m.meetingCode,
          title: m.title || 'MeetSphere Video Room',
          start_at: m.scheduled_at || m.scheduledAt || m.created_at || m.createdAt || new Date().toISOString(),
          end_at: null,
          location: m.meeting_code ? `https://meetsphere.com/room/${m.meeting_code}` : (m.meetingCode ? `https://meetsphere.com/room/${m.meetingCode}` : 'MeetSphere Room'),
          notes: `MeetSphere Hosted Room · Host: ${m.host || 'You'} · Meeting Code: ${m.meeting_code || m.meetingCode || ''}${Number(m.price) > 0 ? ' · Fee: ₹' + m.price : ' · Free Access'}`,
          userName: m.host || 'Host',
          source: 'meetsphere',
          isMeetSphereRoom: true
        }));

        const mappedCal = calList.map((c: any) => ({
          ...c,
          source: 'calendar',
          isMeetSphereRoom: false
        }));

        this.items = [...mappedCal, ...mappedMeetings].sort((a: any, b: any) => {
          const ta = new Date(a.start_at || a.startAt).getTime();
          const tb = new Date(b.start_at || b.startAt).getTime();
          return ta - tb;
        });
      }
    };

    this.api.calendar(this.isAdmin).subscribe({
      next: (x: any[]) => { calList = x || []; finish(); },
      error: (e) => { this.fail(e); finish(); }
    });

    this.api.meetings().subscribe({
      next: (x: any[]) => { meetList = x || []; finish(); },
      error: () => { finish(); }
    });
  }
  workspaceTab:'calendar'|'notes'|'contacts'|'automations'|'actions'='calendar'; workspaceAdminError=''; workspaceAdminMessage=''; adminWorkspace:any={calendar:[],notes:[],contacts:[],automations:[],actions:[]};
  calendar:any={title:'',startAt:'',endAt:'',location:'',notes:''}; note:any={title:'',content:''}; contact:any={name:'',email:'',phone:'',company:'',notes:''}; automation:any={name:'',triggerName:'',actionName:'',enabled:true};
  brief:any={title:'',duration:30,goal:'',participants:'',when:'',agenda:''}; generatedBrief=''; governanceUsers:any[]=[]; governanceMeetings:any[]=[]; governanceError='';
  costPlan:any={title:'',duration:30,participants:6,hourlyRate:500};
  followupDraft:any={meeting:'',recipient:'',sender:'',nextDate:'',decisions:'',actions:'',note:''}; generatedFollowup='';
  exportUsers:any[]=[]; exportCalendar:any[]=[]; exportNotes:any[]=[]; exportPayments:any[]=[];
  exportStatus:any={users:'Not loaded',calendar:'Not loaded',notes:'Not loaded',payments:'Not loaded',usersLoaded:false,calendarLoaded:false,notesLoaded:false,paymentsLoaded:false};
  diagnosticsRunning=false; diagnosticsLastRun:Date|null=null; diagnosticChecks:any[]=[{name:'Users API',status:'Not checked',detail:'Admin user list endpoint'},{name:'Meetings API',status:'Not checked',detail:'Meeting list endpoint'},{name:'Payments API',status:'Not checked',detail:'Admin payments endpoint'}];
  actionDraft:any={title:'',dueDate:'',priority:'Normal'}; actionItems:any[]=[];
  decisionDraft:any={meeting:'',decision:'',owner:'',dueDate:''}; decisionRecords:any[]=[];
  changeDraft:any={type:'Change',summary:'',owner:'',mitigation:''}; changeLog:any[]=[];
  readinessChecks:any[]=[{label:'Confirm the meeting goal',help:'Know the outcome you want by the end.',done:false},{label:'Share the agenda in advance',help:'Give attendees a clear plan.',done:false},{label:'Check camera, microphone and network',help:'Test your setup before joining.',done:false},{label:'Verify invite link and time zone',help:'Avoid broken links or missed starts.',done:false},{label:'Prepare captions or accessibility support',help:'Make the meeting easier to follow for everyone.',done:false},{label:'Assign a note-taker and action owners',help:'Capture decisions and next steps.',done:false}];
  policyChecks:any[]=[{label:'Review admin account access',help:'Confirm admin accounts are still required.',done:false},{label:'Verify backup and recovery process',help:'Check that the team knows the recovery procedure.',done:false},{label:'Review payment exceptions',help:'Check pending or failed payment records in the payment panel.',done:false},{label:'Confirm secret/configuration handling',help:'Do not share API keys or mail app passwords.',done:false},{label:'Review account separation',help:'Test that user sessions cannot access another user workspace.',done:false},{label:'Record next review date',help:'Schedule a follow-up for outstanding checks.',done:false}];
  policyNotes='';
  plans=[{name:'Free',amount:0,features:['Basic calendar','Notetaker','Contacts']},{name:'Pro',amount:499,features:['Everything in Free','Automations','Priority workspace']},{name:'Business',amount:999,features:['Everything in Pro','Team workflows','Admin reporting']}];

  // Professional Checkout & Billing System State
  checkoutModalVisible = false;
  checkoutStep: 'checkout' | 'processing' | 'success' = 'checkout';
  checkoutPlan = 'Pro';
  checkoutBasePrice = 499;
  appliedCoupon = '';
  appliedDiscount = 0;
  couponInput = '';
  couponMessage = '';
  paymentTab: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' = 'UPI';

  upiVpa = '';
  upiVerified = true;
  qrCountdown = 600;
  private qrTimerInterval?: any;

  cardData = {
    number: '4532 8920 1284 3942',
    name: '',
    expiry: '12/28',
    cvv: '789'
  };

  selectedBank = 'HDFC Bank';
  selectedWallet = 'Paytm';

  processingStage = 1;
  invoiceData: any = null;

  get basePrice() {
    return this.checkoutBasePrice;
  }

  get gstAmount() {
    return Math.round((this.checkoutBasePrice - (this.checkoutBasePrice / 1.18)) * 100) / 100;
  }

  get finalPayableAmount() {
    return Math.max(0, this.checkoutBasePrice - this.appliedDiscount);
  }

  get cardBrandLabel() {
    const num = (this.cardData.number || '').replace(/\s+/g, '');
    if (num.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(num)) return 'MASTERCARD';
    if (/^(60|65|81|82)/.test(num)) return 'RUPAY';
    if (/^3[47]/.test(num)) return 'AMEX';
    return 'CARD';
  }

  get cardBrandClass() {
    const b = this.cardBrandLabel;
    if (b === 'VISA') return 'card-brand-visa';
    if (b === 'MASTERCARD') return 'card-brand-mc';
    if (b === 'RUPAY') return 'card-brand-rupay';
    return 'card-brand-default';
  }

  ngOnInit(){
    const d = new Date();
    this.calDateDisplay = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    this.isAdmin = !!this.route.snapshot.data['admin'] || this.session.user?.role === 'admin';
    this.route.url.subscribe(segments => {
      // User routes use readable URLs; admin tools use /admin-tools/:tool.
      // Keep the visible route mapped to the correct workspace feature.
      const routeTool = this.route.snapshot.data['tool'];
      const paramTool = this.route.snapshot.paramMap.get('tool');
      const path = segments.map(s => s.path).join('/');
      const userTool: Record<string, string> = {
        calendar: 'calendar',
        notetaker: 'notes',
        contacts: 'contacts',
        automations: 'automations',
        'workspace-automations': 'automations',
        upgrade: 'upgrade',
        'meeting-brief': 'brief',
        'meeting-readiness': 'readiness',
        'meeting-cost': 'cost',
        'calendar-conflicts': 'conflicts',
        'follow-up-actions': 'actions',
        'decision-ledger': 'decision-ledger'
      };
      this.tool = routeTool || paramTool || userTool[path] || 'calendar';
      this.loadLocalToolState();
      this.load();
    });
    this.route.paramMap.subscribe(p => {
      if (this.isAdmin) {
        // Explicit admin routes may define a tool in route data rather than :tool.
        this.tool = this.route.snapshot.paramMap.get('tool') || this.route.snapshot.data['tool'] || 'calendar';
        this.loadLocalToolState();
        this.load();
      }
    });
    this.liveRefresh = interval(5000).subscribe(() => {
      if (!this.isAdmin && ['calendar','notes','contacts','automations','actions'].includes(this.tool)) this.refreshSharedUserRecords();
      if (this.isAdmin && this.tool === 'workspace-control' && !document.querySelector('.tool-card input:focus, .tool-card textarea:focus')) this.loadAdminWorkspace();
    });
  }
  ngOnDestroy(){ this.liveRefresh?.unsubscribe(); this.stopQrTimer(); if (this.focusInterval) clearInterval(this.focusInterval); }
  get title(){return this.tool==='notes'?'Notetaker':this.tool==='brief'?'Meeting Brief Studio':this.tool==='governance'?'Governance Scorecard':this.tool==='readiness'?'Meeting Readiness':this.tool==='cost'?'Meeting Cost Planner':this.tool==='diagnostics'?'Live Diagnostics':this.tool==='security'?'Policy Checklist':this.tool==='conflicts'?'Conflict Finder':this.tool==='actions'?'Follow-up Action Tracker':this.tool==='hygiene'?'Meeting Health Monitor':this.tool==='capacity'?'Calendar Capacity':this.tool==='followup-message'?'Meeting Follow-up Writer':this.tool==='exports'?'Workspace Export Center':this.tool==='workspace-control'?'User Workspace Control':this.tool==='decision-ledger'?'Meeting Decision Ledger':this.tool==='change-log'?'Admin Change & Risk Log':this.tool.charAt(0).toUpperCase()+this.tool.slice(1)+(this.tool==='upgrade'?' plan':'');}
  get subtitle(){return this.isAdmin?'Review and manage workspace activity across users.':`Use ${this.title.toLowerCase()} to keep your meetings organized.`;}
  get icon(){return this.tool==='calendar'?'▣':this.tool==='notes'?'◩':this.tool==='contacts'?'♧':this.tool==='automations'?'✣':this.tool==='brief'?'✧':this.tool==='governance'?'◈':this.tool==='readiness'?'✓':this.tool==='cost'?'₹':this.tool==='diagnostics'?'◉':this.tool==='security'?'⛨':this.tool==='conflicts'?'◷':this.tool==='actions'?'☑':this.tool==='hygiene'?'✚':this.tool==='capacity'?'▥':this.tool==='followup-message'?'✉':this.tool==='exports'?'⇩':this.tool==='decision-ledger'?'◆':this.tool==='change-log'?'◈':'⇧';}
  get initials(){return (this.session.user?.fullName||'M').split(' ').map((x:string)=>x[0]).join('').slice(0,2).toUpperCase();}
  load(){this.message='';this.error='';if(this.tool==='governance')this.loadGovernance();if(this.tool==='exports'&&this.isAdmin)this.loadExportCenter();if(this.tool==='workspace-control'&&this.isAdmin)this.loadAdminWorkspace();if(this.tool==='diagnostics')this.runDiagnostics();if(this.tool==='calendar')this.loadCalendar();else if(this.tool==='conflicts'||this.tool==='capacity'||this.tool==='hygiene')this.api.calendar(this.isAdmin).subscribe({next:x=>this.items=x||[],error:e=>this.fail(e)});if(this.tool==='notes')this.api.notes(this.isAdmin).subscribe({next:x=>this.items=x||[],error:e=>this.fail(e)});if(this.tool==='contacts')this.api.contacts(this.isAdmin).subscribe({next:x=>this.items=x||[],error:e=>this.fail(e)});if(this.tool==='automations')this.api.automations(this.isAdmin).subscribe({next:x=>this.items=x||[],error:e=>this.fail(e)});if(this.tool==='actions')this.api.actions().subscribe({next:x=>this.actionItems=(x||[]).map((a:any)=>({...a,dueDate:a.dueDate?String(a.dueDate).slice(0,10):'',done:a.done===true||a.done===1||a.done==='1',priority:a.priority||'Normal'})),error:e=>this.fail(e)});if(this.tool==='upgrade'){this.api.subscription().subscribe({next:x=>this.subscription=x,error:e=>this.fail(e)});if(this.isAdmin)this.api.adminSubscriptions().subscribe({next:x=>this.subscriptions=x||[],error:e=>this.fail(e)});} }
  loadAdminWorkspace(){
    this.workspaceAdminError=''; this.workspaceAdminMessage='';
    let remaining=5; const fail=(e:any)=>{this.workspaceAdminError=e?.error?.message||'Could not load shared workspace records. Check API/database and admin login.';};
    const done=()=>{remaining--;};
    this.api.calendar(true).subscribe({next:x=>{this.adminWorkspace.calendar=(x||[]).map((r:any)=>({...r,_startEdit:this.toDateTimeLocal(r.start_at)}));done();},error:e=>{fail(e);done();}});
    this.api.notes(true).subscribe({next:x=>{this.adminWorkspace.notes=x||[];done();},error:e=>{fail(e);done();}});
    this.api.contacts(true).subscribe({next:x=>{this.adminWorkspace.contacts=x||[];done();},error:e=>{fail(e);done();}});
    this.api.automations(true).subscribe({next:x=>{this.adminWorkspace.automations=x||[];done();},error:e=>{fail(e);done();}});
    this.api.actions(true).subscribe({next:x=>{this.adminWorkspace.actions=(x||[]).map((a:any)=>({...a,dueDate:a.dueDate?String(a.dueDate).slice(0,10):'',done:a.done===true||a.done===1||a.done==='1',priority:a.priority||'Normal'}));done();},error:e=>{fail(e);done();}});
  }
  toDateTimeLocal(value: any): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 16);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  saveAdminWorkspaceRecord(kind:'calendar'|'notes'|'contacts'|'automations'|'actions',x:any){
    this.workspaceAdminError=''; this.workspaceAdminMessage=''; let request:any;
    if(kind==='calendar') request=this.api.updateCalendar(x.id,{title:x.title,startAt:x._startEdit,endAt:x.end_at||null,location:x.location||'',notes:x.notes||''});
    if(kind==='notes') request=this.api.updateNote(x.id,{title:x.title,content:x.content||''});
    if(kind==='contacts') request=this.api.updateContact(x.id,{name:x.name,email:x.email||'',phone:x.phone||'',company:x.company||'',notes:x.notes||''});
    if(kind==='automations') request=this.api.updateAutomation(x.id,{name:x.name,triggerName:x.trigger_name||x.triggerName,actionName:x.action_name||x.actionName,enabled:!!x.enabled});
    if(kind==='actions') request=this.api.updateAction(x.id,{title:x.title,dueDate:x.dueDate||null,priority:x.priority||'Normal',done:!!x.done});
    request.subscribe({next:()=>{this.workspaceAdminMessage="Record updated successfully. The user workspace will show the update automatically.";this.loadAdminWorkspace();},error:(e:any)=>this.workspaceAdminError=e?.error?.message||'Update failed. Check the backend and required fields.'});
  }
  deleteAdminWorkspaceRecord(kind:'calendar'|'notes'|'contacts'|'automations'|'actions',x:any){
    this.promptDelete(kind, x.id, false, undefined, x.title || x.name || `${kind} Record`);
  }
  private refreshSharedUserRecords(){ const update=(obs:any)=>obs.subscribe({next:(x:any)=>this.items=x||[],error:()=>{}}); if(this.tool==='calendar')this.loadCalendar();else if(this.tool==='notes')update(this.api.notes());else if(this.tool==='contacts')update(this.api.contacts());else if(this.tool==='automations')update(this.api.automations());else if(this.tool==='actions')this.api.actions().subscribe({next:(x:any[])=>this.actionItems=(x||[]).map((a:any)=>({...a,dueDate:a.dueDate?String(a.dueDate).slice(0,10):'',done:a.done===true||a.done===1||a.done==='1',priority:a.priority||'Normal'})),error:()=>{}}); }
  get costPeopleHours(){return Math.max(0,Number(this.costPlan.duration)||0)/60*Math.max(0,Number(this.costPlan.participants)||0);}
  get costEstimate(){return this.costPeopleHours*Math.max(0,Number(this.costPlan.hourlyRate)||0);}
  resetCostPlan(){this.costPlan={title:'',duration:30,participants:6,hourlyRate:500};this.message='Meeting cost calculator reset.';}
  exportCostEstimate(){
    const rows=[['MeetSphere Meeting Cost Estimate'],['Account',this.session.user?.email||this.session.user?.fullName||'Current user'],['Meeting title',this.costPlan.title||'Untitled meeting'],['Duration minutes',Math.max(0,Number(this.costPlan.duration)||0)],['Participants',Math.max(0,Number(this.costPlan.participants)||0)],['Average hourly cost per person (INR)',Math.max(0,Number(this.costPlan.hourlyRate)||0)],['People-hours',this.costPeopleHours.toFixed(2)],['Estimated cost (INR)',this.costEstimate.toFixed(2)],['Estimated annual cost if weekly (INR)',(this.costEstimate*52).toFixed(2)]];
    const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='meetsphere-meeting-cost-estimate.csv';a.click();URL.revokeObjectURL(url);this.message='Cost estimate CSV downloaded.';
  }
  eventStart(event:any):Date|null { const value=this.eventStartTimestamp(event); return Number.isFinite(value)?new Date(value):null; }
  private eventStartTimestamp(event:any):number { return Date.parse(event?.start_at || event?.startAt || event?.start || ''); }
  private eventEndTimestamp(event:any):number { const end=Date.parse(event?.end_at || event?.endAt || event?.end || ''); if(Number.isFinite(end))return end; const start=this.eventStartTimestamp(event); return Number.isFinite(start)?start+60*60*1000:NaN; }
  get conflictPairs(){
    const events=(this.items||[]).filter((x:any)=>Number.isFinite(this.eventStartTimestamp(x)));
    const pairs:any[]=[];
    for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++){
      const a=events[i],b=events[j],as=this.eventStartTimestamp(a),ae=this.eventEndTimestamp(a),bs=this.eventStartTimestamp(b),be=this.eventEndTimestamp(b);
      if(Number.isFinite(ae)&&Number.isFinite(be)&&as<be&&bs<ae){pairs.push({a,b,minutes:Math.max(1,Math.round((Math.min(ae,be)-Math.max(as,bs))/60000))});}
    }
    return pairs.sort((x:any,y:any)=>this.eventStartTimestamp(x.a)-this.eventStartTimestamp(y.a));
  }
  get capacityDays(){
    const groups:Record<string,number>={};
    for(const event of this.items||[]){const stamp=this.eventStartTimestamp(event);if(!Number.isFinite(stamp))continue;const d=new Date(stamp);const day=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');groups[day]=(groups[day]||0)+1;}
    return Object.entries(groups).map(([day,count])=>({day,count})).sort((a,b)=>b.count-a.count||a.day.localeCompare(b.day));
  }
  exportConflicts(){
    const rows=[['Event A','Start A','Event B','Start B','Overlap minutes'],...this.conflictPairs.map((p:any)=>[p.a.title||'Untitled',new Date(this.eventStartTimestamp(p.a)).toISOString(),p.b.title||'Untitled',new Date(this.eventStartTimestamp(p.b)).toISOString(),p.minutes])];
    this.exportCsv(rows,'meetsphere-calendar-conflicts.csv');this.message='Calendar conflict report exported.';
  }
  exportCapacity(){
    const rows=[['Date','Event count'],...this.capacityDays.map((x:any)=>[x.day,x.count])];
    this.exportCsv(rows,'meetsphere-calendar-capacity.csv');this.message='Calendar capacity report exported.';
  }
  private exportCsv(rows:any[][],filename:string){
    const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  }
  runDiagnostics(){
    if(!this.isAdmin)return;
    this.diagnosticsRunning=true;this.diagnosticChecks=this.diagnosticChecks.map((x:any)=>({...x,status:'Checking…',detail:'Request in progress'}));
    let remaining=3;const finish=()=>{remaining--;if(remaining===0){this.diagnosticsRunning=false;this.diagnosticsLastRun=new Date();}};
    this.api.users().subscribe({next:(x:any[])=>{this.setDiagnostic('Users API','OK',`${(x||[]).length} user record(s) returned`);finish();},error:(e:any)=>{this.setDiagnostic('Users API','Failed',this.diagnosticError(e));finish();}});
    this.api.meetings().subscribe({next:(x:any[])=>{this.setDiagnostic('Meetings API','OK',`${(x||[]).length} meeting record(s) returned`);finish();},error:(e:any)=>{this.setDiagnostic('Meetings API','Failed',this.diagnosticError(e));finish();}});
    this.api.adminPayments().subscribe({next:(x:any[])=>{this.setDiagnostic('Payments API','OK',`${(x||[]).length} payment record(s) returned`);finish();},error:(e:any)=>{this.setDiagnostic('Payments API','Failed',this.diagnosticError(e));finish();}});
  }
  private setDiagnostic(name:string,status:string,detail:string){this.diagnosticChecks=this.diagnosticChecks.map((x:any)=>x.name===name?{...x,status,detail}:x);}
  private diagnosticError(e:any){return e?.status===401||e?.status===403?'Admin session may be expired or not authorized':e?.status===0?'API not reachable at localhost:5001':`Request failed (HTTP ${e?.status||'unknown'})`;}
  get readinessScore(){return this.readinessChecks.length?Math.round(this.readinessChecks.filter(x=>x.done).length/this.readinessChecks.length*100):0;}
  private localToolStorageKey(){const id=this.session.user?.id ?? this.session.user?.email ?? 'unknown';return `ms_tool_state_${this.isAdmin?'admin':'user'}_${String(id).replace(/[^a-zA-Z0-9_.@-]/g,'_')}`;}
  loadLocalToolState(){try{const raw=localStorage.getItem(this.localToolStorageKey());if(!raw)return;const saved=JSON.parse(raw);if(Array.isArray(saved.readinessChecks)&&!this.isAdmin)this.readinessChecks=this.readinessChecks.map((x:any,i:number)=>({...x,done:!!saved.readinessChecks[i]?.done}));if(Array.isArray(saved.actionItems)&&!this.isAdmin)this.actionItems=saved.actionItems;if(Array.isArray(saved.decisionRecords)&&!this.isAdmin)this.decisionRecords=saved.decisionRecords;if(Array.isArray(saved.changeLog)&&this.isAdmin)this.changeLog=saved.changeLog;if(Array.isArray(saved.policyChecks)&&this.isAdmin)this.policyChecks=this.policyChecks.map((x:any,i:number)=>({...x,done:!!saved.policyChecks[i]?.done}));if(this.isAdmin&&typeof saved.policyNotes==='string')this.policyNotes=saved.policyNotes;}catch{/* Keep default checklist if browser storage is unavailable. */}}
  saveLocalToolState(){try{const saved={actionItems:this.actionItems,decisionRecords:this.decisionRecords,changeLog:this.changeLog,readinessChecks:this.readinessChecks.map((x:any)=>({done:!!x.done})),policyChecks:this.policyChecks.map((x:any)=>({done:!!x.done})),policyNotes:this.policyNotes};localStorage.setItem(this.localToolStorageKey(),JSON.stringify(saved));this.message='Checklist saved in this browser for the current account.';}catch{this.error='Browser storage is unavailable; checklist changes may not persist.';}}
  resetReadiness(){this.readinessChecks=this.readinessChecks.map((x:any)=>({...x,done:false}));this.saveLocalToolState();this.message='Meeting readiness checklist reset.';}
  exportReadiness(){const lines=['MEETSPHERE MEETING READINESS REPORT',`Account: ${this.session.user?.email||this.session.user?.fullName||'Current user'}`,`Readiness: ${this.readinessScore}%`,'',...this.readinessChecks.map((x:any)=>`${x.done?'[x]':'[ ]'} ${x.label} — ${x.help}`)];this.downloadText(lines.join('\n'),'meetsphere-readiness-report.txt');}
  resetPolicyChecklist(){this.policyChecks=this.policyChecks.map((x:any)=>({...x,done:false}));this.policyNotes='';this.saveLocalToolState();this.message='Admin policy checklist reset.';}
  exportPolicyReport(){const lines=['MEETSPHERE ADMIN POLICY REVIEW',`Admin: ${this.session.user?.email||this.session.user?.fullName||'Current admin'}`,`Completed: ${this.policyChecks.filter((x:any)=>x.done).length}/${this.policyChecks.length}`,'',...this.policyChecks.map((x:any)=>`${x.done?'[x]':'[ ]'} ${x.label} — ${x.help}`),'','ADMIN NOTES',this.policyNotes||'No notes recorded'];this.downloadText(lines.join('\n'),'meetsphere-admin-policy-review.txt');}
  private downloadText(content:string,filename:string){const blob=new Blob([content],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);this.message='Report downloaded.';}
  buildBrief(){
    const agenda=(this.brief.agenda||'').split(/\r?\n/).map((x:string)=>x.trim()).filter(Boolean);
    const duration=Math.max(5,Number(this.brief.duration)||30);
    const lines=['MEETSPHERE MEETING BRIEF','='.repeat(28),`Title: ${this.brief.title.trim()}`,`Date / time: ${this.brief.when ? new Date(this.brief.when).toLocaleString() : 'Not set'}`,`Duration: ${duration} minutes`,`Participants: ${this.brief.participants.trim() || 'Not specified'}`,'', 'GOAL',this.brief.goal.trim(),'','AGENDA'];
    lines.push(...(agenda.length ? agenda.map((x:string,i:number)=>`${i+1}. ${x}`) : ['1. Confirm desired outcome','2. Discuss key points','3. Agree next actions']));
    lines.push('', 'CLOSE-OUT','- Decisions made:','- Action owner(s):','- Follow-up date:');
    this.generatedBrief=lines.join('\n'); this.message='Meeting brief generated. Copy it or download the TXT file.';
  }
  clearBrief(){this.brief={title:'',duration:30,goal:'',participants:'',when:'',agenda:''};this.generatedBrief='';this.message='';}
  copyBrief(){if(!this.generatedBrief)return; if(navigator.clipboard?.writeText){navigator.clipboard.writeText(this.generatedBrief).then(()=>this.message='Meeting brief copied.').catch(()=>this.downloadBrief());}else this.downloadBrief();}
  downloadBrief(){if(!this.generatedBrief)return;const blob=new Blob([this.generatedBrief],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='meetsphere-meeting-brief.txt';a.click();URL.revokeObjectURL(url);}
  loadGovernance(){this.governanceError='';this.api.users().subscribe({next:x=>{this.governanceUsers=x||[];},error:e=>{this.governanceError='Unable to load users from the API. Check that the backend is running and this admin session is valid.';this.fail(e);}});this.api.meetings().subscribe({next:x=>{this.governanceMeetings=x||[];},error:e=>{this.governanceError='Unable to load rooms from the API. Check that the backend is running and this admin session is valid.';this.fail(e);}});}
  get governanceAdminCount(){return this.governanceUsers.filter(u=>String(u.role||'').toLowerCase()==='admin').length;}
  get usersMissingEmail(){return this.governanceUsers.filter(u=>!String(u.email||'').trim()).length;}
  get roomsMissingCode(){return this.governanceMeetings.filter(m=>!String(m.meetingCode||m.meeting_code||'').trim()).length;}
  get governanceFlags(){return this.usersMissingEmail+this.roomsMissingCode+(this.governanceAdminCount===0?1:0);}
  exportGovernance(){const rows=[['Check','Count'],['Users loaded',this.governanceUsers.length],['Admin accounts',this.governanceAdminCount],['Rooms loaded',this.governanceMeetings.length],['Users missing email',this.usersMissingEmail],['Rooms missing meeting code',this.roomsMissingCode],['Review flags',this.governanceFlags]];const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`meetsphere-governance-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);this.message='Governance scorecard exported.';}
  get openActions(){return this.actionItems.filter(x=>!x.done).length;}
  get completedActions(){return this.actionItems.filter(x=>x.done).length;}
  get overdueActions(){return this.actionItems.filter(x=>!x.done&&this.isActionOverdue(x)).length;}
  isActionOverdue(task:any){if(!task?.dueDate||task.done)return false;return task.dueDate < new Date().toISOString().slice(0,10);}
  addAction(){const title=String(this.actionDraft.title||'').trim();if(!title){this.error='Enter an action title first.';return;}this.api.addAction({title,dueDate:this.actionDraft.dueDate||null,priority:this.actionDraft.priority||'Normal',done:false}).subscribe({next:()=>{this.actionDraft={title:'',dueDate:'',priority:'Normal'};this.message='Action saved to the shared workspace.';this.load();},error:e=>this.fail(e)});}
  toggleAction(id:number,done:boolean){const task=this.actionItems.find(x=>x.id===id);if(!task)return;this.api.updateAction(id,{title:task.title,dueDate:task.dueDate||null,priority:task.priority||'Normal',done}).subscribe({next:()=>{task.done=done;this.message='Action status updated.';},error:e=>this.fail(e)});}
  deleteAction(id:number, title?: string){
    this.promptDelete('actions', id, false, undefined, title || 'Action Item');
  }
  clearCompletedActions(){const completed=this.actionItems.filter(x=>x.done);if(!completed.length)return;if(!confirm(`Delete ${completed.length} completed action item(s)?`))return;let remaining=completed.length;completed.forEach(x=>this.api.deleteAction(x.id).subscribe({next:()=>{remaining--;if(remaining===0){this.message='Completed actions cleared.';this.load();}},error:e=>{remaining--;this.fail(e);if(remaining===0)this.load();}}));}
  exportActions(){const rows=[['Action','Due date','Priority','Status'],...this.actionItems.map(x=>[x.title,x.dueDate,x.priority,x.done?'Completed':'Open'])];this.exportCsv(rows,'meetsphere-follow-up-actions.csv');this.message='Action list exported.';}
  isPastCalendarEvent(item:any){const stamp=this.eventStartTimestamp(item);return Number.isFinite(stamp)&&stamp<Date.now();}
  get healthMissingLocation(){return this.items.filter(x=>!String(x.location||'').trim()).length;}
  get healthMissingNotes(){return this.items.filter(x=>!String(x.notes||'').trim()).length;}
  get healthPastEvents(){return this.items.filter(x=>this.isPastCalendarEvent(x)).length;}
  healthFlags(item:any){const flags:string[]=[];if(!String(item.location||'').trim())flags.push('Missing location');if(!String(item.notes||'').trim())flags.push('Missing notes');return flags;}
  get healthFlaggedEvents(){return this.items.filter(x=>this.healthFlags(x).length>0||this.isPastCalendarEvent(x)).sort((a,b)=>this.eventStartTimestamp(b)-this.eventStartTimestamp(a));}
  exportMeetingHealth(){const rows=[['Event','Owner','Start','Location','Notes','Past start'],...this.healthFlaggedEvents.map(x=>[x.title||'Untitled event',x.userName||'',x.start_at||'',String(x.location||'').trim()?'Present':'Missing',String(x.notes||'').trim()?'Present':'Missing',this.isPastCalendarEvent(x)?'Yes':'No'])];this.exportCsv(rows,'meetsphere-meeting-health-review.csv');this.message='Meeting health review exported.';}
  buildFollowupMessage(){
    const meeting=String(this.followupDraft.meeting||'').trim()||'our meeting';
    const recipient=String(this.followupDraft.recipient||'').trim();
    const sender=String(this.followupDraft.sender||'').trim()||String(this.session.user?.fullName||'');
    const decisions=String(this.followupDraft.decisions||'').split(/\r?\n/).map((x:string)=>x.trim()).filter(Boolean);
    const actions=String(this.followupDraft.actions||'').split(/\r?\n/).map((x:string)=>x.trim()).filter(Boolean);
    const lines=[recipient?`Hi ${recipient},`:'Hello,','',`Thank you for your time during ${meeting}. Here is a quick summary of what we discussed.`,'','KEY DECISIONS',...(decisions.length?decisions.map((x:string)=>`• ${x}`):['• No decisions added.']),'','NEXT ACTIONS',...(actions.length?actions.map((x:string)=>`• ${x}`):['• No action items added.'])];
    if(this.followupDraft.nextDate)lines.push('','NEXT FOLLOW-UP',new Date(`${this.followupDraft.nextDate}T12:00:00`).toLocaleDateString());
    if(String(this.followupDraft.note||'').trim())lines.push('','ADDITIONAL NOTE',String(this.followupDraft.note).trim());
    lines.push('','Please let me know if I missed anything. Thanks again,',sender||'MeetSphere member');
    this.generatedFollowup=lines.join('\n');this.message='Follow-up message generated. Review it before sharing.';
  }
  resetFollowupMessage(){this.followupDraft={meeting:'',recipient:'',sender:'',nextDate:'',decisions:'',actions:'',note:''};this.generatedFollowup='';this.message='Follow-up writer reset.';}
  copyFollowupMessage(){if(!this.generatedFollowup)return;if(navigator.clipboard?.writeText){navigator.clipboard.writeText(this.generatedFollowup).then(()=>this.message='Follow-up copied to clipboard.').catch(()=>this.downloadFollowupMessage());}else this.downloadFollowupMessage();}
  downloadFollowupMessage(){if(!this.generatedFollowup)return;this.downloadText(this.generatedFollowup,'meetsphere-meeting-follow-up.txt');}
  loadExportCenter(){
    this.exportStatus={users:'Loading…',calendar:'Loading…',notes:'Loading…',payments:'Loading…',usersLoaded:false,calendarLoaded:false,notesLoaded:false,paymentsLoaded:false};
    this.api.users().subscribe({next:x=>{this.exportUsers=x||[];this.exportStatus={...this.exportStatus,users:'Loaded',usersLoaded:true};},error:()=>this.exportStatus={...this.exportStatus,users:'Failed — check API',usersLoaded:false}});
    this.api.calendar(true).subscribe({next:x=>{this.exportCalendar=x||[];this.exportStatus={...this.exportStatus,calendar:'Loaded',calendarLoaded:true};},error:()=>this.exportStatus={...this.exportStatus,calendar:'Failed — check API',calendarLoaded:false}});
    this.api.notes(true).subscribe({next:x=>{this.exportNotes=x||[];this.exportStatus={...this.exportStatus,notes:'Loaded',notesLoaded:true};},error:()=>this.exportStatus={...this.exportStatus,notes:'Failed — check API',notesLoaded:false}});
    this.api.adminPayments().subscribe({next:x=>{this.exportPayments=x||[];this.exportStatus={...this.exportStatus,payments:'Loaded',paymentsLoaded:true};},error:()=>this.exportStatus={...this.exportStatus,payments:'Failed — check API',paymentsLoaded:false}});
    this.message='Refreshing export data from the admin APIs.';
  }
  exportCenterCsv(kind:'users'|'calendar'|'notes'|'payments'){
    let rows:any[][]=[];let filename='';
    if(kind==='users'){rows=[['ID','Name','Email','Role','Status'],...this.exportUsers.map(x=>[x.id??x.userId??'',x.fullName??x.name??'',x.email??'',x.role??'',x.status??''])];filename='meetsphere-admin-users.csv';}
    if(kind==='calendar'){rows=[['Event ID','Title','Owner','Start','End','Location','Has Notes'],...this.exportCalendar.map(x=>[x.id??'',x.title??'',x.userName??x.user_name??'',x.start_at??x.startAt??x.start??'',x.end_at??x.endAt??x.end??'',x.location??'',String(x.notes??'').trim()?'Yes':'No'])];filename='meetsphere-admin-calendar.csv';}
    if(kind==='notes'){rows=[['Note ID','Title','Owner','Content'],...this.exportNotes.map(x=>[x.id??'',x.title??'',x.userName??x.user_name??'',x.content??''])];filename='meetsphere-admin-notes.csv';}
    if(kind==='payments'){rows=[['Payment ID','User','Amount','Currency','Status','Created'],...this.exportPayments.map(x=>[x.id??x.paymentId??'',x.userName??x.user_name??x.email??'',x.amount??x.amountInr??'',x.currency??'INR',x.status??'',x.createdAt??x.created_at??''])];filename='meetsphere-admin-payments.csv';}
    this.exportCsv(rows,filename);this.message=`${kind[0].toUpperCase()+kind.slice(1)} export downloaded.`;
  }
  get openDecisions(){return this.decisionRecords.filter(x=>x.status!=='Done').length;}
  get completedDecisions(){return this.decisionRecords.filter(x=>x.status==='Done').length;}
  addDecision(){const meeting=String(this.decisionDraft.meeting||'').trim(),decision=String(this.decisionDraft.decision||'').trim();if(!meeting||!decision){this.error='Enter a meeting/topic and decision first.';return;}this.decisionRecords=[{id:Date.now(),meeting,decision,owner:String(this.decisionDraft.owner||'').trim(),dueDate:this.decisionDraft.dueDate||'',status:'Open',createdAt:new Date().toISOString()},...this.decisionRecords];this.decisionDraft={meeting:'',decision:'',owner:'',dueDate:''};this.saveLocalToolState();this.message='Meeting decision saved for this account.';}
  setDecisionStatus(id:number,status:string){this.decisionRecords=this.decisionRecords.map(x=>x.id===id?{...x,status}:x);this.saveLocalToolState();}
  deleteDecision(id:number){this.decisionRecords=this.decisionRecords.filter(x=>x.id!==id);this.saveLocalToolState();this.message='Decision record deleted.';}
  clearDoneDecisions(){this.decisionRecords=this.decisionRecords.filter(x=>x.status!=='Done');this.saveLocalToolState();this.message='Completed decision records cleared.';}
  exportDecisions(){const rows=[['Meeting','Decision','Owner','Due date','Status','Created'],...this.decisionRecords.map(x=>[x.meeting,x.decision,x.owner,x.dueDate,x.status,x.createdAt])];this.exportCsv(rows,'meetsphere-decision-ledger.csv');this.message='Decision ledger exported.';}
  get openChangeEntries(){return this.changeLog.filter(x=>x.status!=='Resolved').length;}
  get resolvedChangeEntries(){return this.changeLog.filter(x=>x.status==='Resolved').length;}
  addChangeLogEntry(){const summary=String(this.changeDraft.summary||'').trim();if(!summary){this.error='Enter a short summary first.';return;}this.changeLog=[{id:Date.now(),type:this.changeDraft.type||'Change',summary,owner:String(this.changeDraft.owner||'').trim(),mitigation:String(this.changeDraft.mitigation||'').trim(),status:'Open',createdAt:new Date().toISOString()},...this.changeLog];this.changeDraft={type:'Change',summary:'',owner:'',mitigation:''};this.saveLocalToolState();this.message='Admin change/risk entry saved in this browser.';}
  setChangeStatus(id:number,status:string){this.changeLog=this.changeLog.map(x=>x.id===id?{...x,status}:x);this.saveLocalToolState();}
  deleteChangeEntry(id:number){this.changeLog=this.changeLog.filter(x=>x.id!==id);this.saveLocalToolState();this.message='Admin log entry deleted.';}
  clearResolvedChangeEntries(){this.changeLog=this.changeLog.filter(x=>x.status!=='Resolved');this.saveLocalToolState();this.message='Resolved admin log entries cleared.';}
  exportChangeLog(){const rows=[['Type','Summary','Owner','Mitigation / next step','Status','Created'],...this.changeLog.map(x=>[x.type,x.summary,x.owner,x.mitigation,x.status,x.createdAt])];this.exportCsv(rows,'meetsphere-admin-change-risk-log.csv');this.message='Admin change and risk log exported.';}
  addCalendar(){this.api.addCalendar(this.calendar).subscribe({next:()=>{this.message='Calendar event saved in MySQL.';this.calendar={title:'',startAt:'',endAt:'',location:'',notes:''};this.load()},error:e=>this.fail(e)});}
  addNote(){this.api.addNote(this.note).subscribe({next:()=>{this.message='Note saved in MySQL.';this.note={title:'',content:''};this.load()},error:e=>this.fail(e)});}
  addContact(){this.api.addContact(this.contact).subscribe({next:()=>{this.message='Contact saved in MySQL.';this.contact={name:'',email:'',phone:'',company:'',notes:''};this.load()},error:e=>this.fail(e)});}
  saveContact(x:any){if(!String(x.name||'').trim()){this.error='Contact name is required.';return;}this.api.updateContact(x.id,{name:String(x.name).trim(),email:x.email||'',phone:x.phone||'',company:x.company||'',notes:x.notes||''}).subscribe({next:()=>{this.message='Contact updated. Admin and User workspaces share this database record.';this.load()},error:e=>this.fail(e)});}
  addAutomation(){
    const name = String(this.automation?.name ?? '').trim();
    const trigger = String(this.automation?.triggerName ?? this.automation?.trigger_name ?? this.automation?.trigger ?? '').trim();
    const action = String(this.automation?.actionName ?? this.automation?.action_name ?? this.automation?.action ?? '').trim();

    if (!name || !trigger || !action) {
      this.error = 'Please enter an automation name, trigger, and action.';
      this.message = '';
      return;
    }

    const payload = {
      name,
      trigger,
      action,
      triggerName: trigger,
      actionName: action,
      trigger_name: trigger,
      action_name: action,
      enabled: this.automation?.enabled !== false
    };

    this.error = '';
    this.message = '';
    this.api.addAutomation(payload).subscribe({
      next: () => {
        this.message = 'Automation saved successfully.';
        this.automation = { name: '', triggerName: '', actionName: '', enabled: true };
        this.load();
      },
      error: e => this.fail(e)
    });
  }
  toggleAutomation(id:number){this.api.toggleAutomation(id).subscribe({next:()=>this.load(),error:e=>this.fail(e)});}
  // Professional Centered Confirmation Modal State
  confirmDeleteModal = false;
  deleteTarget: {
    kind: string;
    id: any;
    isMeetSphereRoom: boolean;
    meetingId?: number;
    meetingCode?: string;
    title: string;
    subtitle: string;
  } | null = null;

  promptDelete(kind: string, id: any, isMeetSphereRoom = false, meetingId?: number, title?: string, meetingCode?: string) {
    const isRoom = !!(isMeetSphereRoom || (id && String(id).startsWith('m_')));
    const mId = meetingId || (id && String(id).startsWith('m_') ? Number(String(id).replace('m_', '')) : (isRoom ? Number(id) : undefined));
    this.deleteTarget = {
      kind,
      id,
      isMeetSphereRoom: isRoom,
      meetingId: mId,
      meetingCode,
      title: title || (isRoom ? 'MeetSphere Meeting Room' : (kind.charAt(0).toUpperCase() + kind.slice(1) + ' Item')),
      subtitle: isRoom
        ? 'This will cancel the scheduled video conference and remove the room code.'
        : 'This record will be permanently deleted from your workspace.'
    };
    this.confirmDeleteModal = true;
  }

  closeDeleteModal() {
    this.confirmDeleteModal = false;
    this.deleteTarget = null;
  }

  confirmDelete() {
    if (!this.deleteTarget) return;
    const target = { ...this.deleteTarget };
    this.closeDeleteModal();
    this.executeRemove(target.kind, target.id, target.isMeetSphereRoom, target.meetingId, target.meetingCode);
  }

  remove(kind: string, id: any, isMeetSphereRoom = false, meetingId?: number, title?: string) {
    this.promptDelete(kind, id, isMeetSphereRoom, meetingId, title);
  }

  private executeRemove(kind: string, id: any, isMeetSphereRoom = false, meetingId?: number, meetingCode?: string) {
    if (kind === 'calendar' && (isMeetSphereRoom || (id && String(id).startsWith('m_')))) {
      const realMeetingId = meetingId || (id && String(id).startsWith('m_') ? Number(String(id).replace('m_', '')) : Number(id));
      if (realMeetingId && !isNaN(realMeetingId) && realMeetingId > 0) {
        this.api.deleteMeeting(realMeetingId).subscribe({
          next: () => {
            this.message = 'Meeting room deleted successfully.';
            this.load();
          },
          error: (e: any) => {
            if (meetingCode) {
              this.api.deleteMeetingByCode(meetingCode).subscribe({
                next: () => {
                  this.message = 'Meeting room deleted successfully.';
                  this.load();
                },
                error: (err: any) => this.fail(err)
              });
            } else {
              this.fail(e);
            }
          }
        });
        return;
      } else if (meetingCode) {
        this.api.deleteMeetingByCode(meetingCode).subscribe({
          next: () => {
            this.message = 'Meeting room deleted successfully.';
            this.load();
          },
          error: (err: any) => this.fail(err)
        });
        return;
      }
    }
    const numId = Number(id);
    const fn: any = {
      calendar: this.api.deleteCalendar(numId),
      notes: this.api.deleteNote(numId),
      contacts: this.api.deleteContact(numId),
      automations: this.api.deleteAutomation(numId),
      actions: this.api.deleteAction(numId)
    }[kind];
    if (fn) {
      fn.subscribe({
        next: () => {
          this.message = 'Deleted successfully.';
          if (this.isAdmin && this.tool === 'workspace-control') {
            this.loadAdminWorkspace();
          } else {
            this.load();
          }
        },
        error: (e: any) => this.fail(e)
      });
    }
  }
  isCurrentPlan(planName: string): boolean {
    if (!this.subscription || !this.subscription.planName) {
      return planName === 'Free';
    }
    return this.subscription.planName.toLowerCase() === planName.toLowerCase();
  }

  openCheckoutModal(plan: string, amount: number) {
    this.checkoutPlan = plan;
    this.checkoutBasePrice = amount;
    this.appliedCoupon = '';
    this.appliedDiscount = 0;
    this.couponInput = '';
    this.couponMessage = '';
    this.paymentTab = 'UPI';
    this.checkoutStep = 'checkout';
    this.processingStage = 1;
    this.upiVpa = this.session.user?.email ? this.session.user.email.split('@')[0] + '@okaxis' : 'user@okaxis';
    this.upiVerified = true;
    this.cardData = {
      number: '4532 8920 1284 3942',
      name: (this.session.user?.fullName || 'HARSHIL SAVALIYA').toUpperCase(),
      expiry: '12/28',
      cvv: '789'
    };
    this.startQrTimer();
    this.checkoutModalVisible = true;
  }

  closeCheckoutModal() {
    this.checkoutModalVisible = false;
    this.stopQrTimer();
  }

  closeOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('checkout-backdrop')) {
      this.closeCheckoutModal();
    }
  }

  setPaymentTab(tab: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET') {
    this.paymentTab = tab;
  }

  applyCoupon() {
    const code = (this.couponInput || '').trim().toUpperCase();
    if (!code) return;
    if (code === 'SAVE20' || code === 'WELCOME20') {
      this.appliedCoupon = code;
      this.appliedDiscount = Math.round(this.checkoutBasePrice * 0.20);
      this.couponMessage = '';
    } else if (code === 'SAVE50' || code === 'PROMO50') {
      this.appliedCoupon = code;
      this.appliedDiscount = Math.round(this.checkoutBasePrice * 0.50);
      this.couponMessage = '';
    } else if (code === 'MEET100' || code === 'SAVE100') {
      this.appliedCoupon = code;
      this.appliedDiscount = Math.min(100, this.checkoutBasePrice);
      this.couponMessage = '';
    } else {
      this.couponMessage = 'Invalid coupon code. Try SAVE20 or MEET100.';
    }
  }

  removeCoupon() {
    this.appliedCoupon = '';
    this.appliedDiscount = 0;
    this.couponInput = '';
    this.couponMessage = '';
  }

  appendUpiSuffix(suffix: string) {
    const prefix = (this.upiVpa || 'user').split('@')[0];
    this.upiVpa = prefix + suffix;
    this.upiVerified = true;
  }

  verifyUpiVpa() {
    if (this.upiVpa && this.upiVpa.includes('@')) {
      this.upiVerified = true;
    }
  }

  formatCardNumber(event: any) {
    let val = (event.target.value || '').replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.cardData.number = val;
  }

  formatCardExpiry(event: any) {
    let val = (event.target.value || '').replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    this.cardData.expiry = val;
  }

  startQrTimer() {
    this.stopQrTimer();
    this.qrCountdown = 600;
    this.qrTimerInterval = setInterval(() => {
      if (this.qrCountdown > 0) {
        this.qrCountdown--;
      } else {
        this.stopQrTimer();
      }
    }, 1000);
  }

  stopQrTimer() {
    if (this.qrTimerInterval) {
      clearInterval(this.qrTimerInterval);
      this.qrTimerInterval = undefined;
    }
  }

  formatTimer(sec: number): string {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  downgradeToFree() {
    if (confirm('Are you sure you want to switch to the Free plan? Premium features will be deactivated.')) {
      this.api.upgrade('Free').subscribe({
        next: r => {
          this.message = r.message || 'Switched to Free plan.';
          this.load();
        },
        error: e => this.fail(e)
      });
    }
  }

  processPayment() {
    this.checkoutStep = 'processing';
    this.processingStage = 1;

    setTimeout(() => {
      this.processingStage = 2;
    }, 450);

    setTimeout(() => {
      this.processingStage = 3;
    }, 900);

    setTimeout(() => {
      const txnRef = 'TXN_MS_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const methodDisplay = this.paymentTab === 'UPI' ? `UPI (${(this.upiVpa || 'GPay').split('@')[1] ? (this.upiVpa || 'GPay').split('@')[0] : 'GPay'})`
                          : this.paymentTab === 'CARD' ? `${this.cardBrandLabel} Card (ending ${(this.cardData.number || '4242').slice(-4)})`
                          : this.paymentTab === 'NETBANKING' ? `NetBanking (${this.selectedBank})`
                          : `Wallet (${this.selectedWallet})`;

      const payload = {
        paymentMethod: methodDisplay,
        transactionId: txnRef,
        customAmount: this.finalPayableAmount
      };

      this.api.upgrade(this.checkoutPlan, payload).subscribe({
        next: res => {
          const invNum = 'INV-2026-MS-' + Math.floor(100000 + Math.random() * 900000);
          this.invoiceData = {
            invoiceNumber: invNum,
            transactionId: txnRef,
            amount: this.finalPayableAmount,
            plan: this.checkoutPlan,
            method: methodDisplay,
            date: new Date(),
            userName: this.session.user?.fullName || 'Workspace User',
            userEmail: this.session.user?.email || 'user@meetsphere.com'
          };
          this.checkoutStep = 'success';
          this.load();
        },
        error: err => {
          this.checkoutStep = 'checkout';
          this.fail(err);
        }
      });
    }, 1400);
  }

  finishCheckout() {
    this.closeCheckoutModal();
    this.message = `Congratulations! You are now subscribed to the MeetSphere ${this.checkoutPlan} plan.`;
    this.load();
  }

  openCurrentInvoice() {
    if (!this.subscription) return;
    this.invoiceData = {
      invoiceNumber: 'INV-2026-MS-' + (this.subscription.id ? (this.subscription.id + 100000) : '849201'),
      transactionId: this.subscription.transactionId || 'MSPLAN_ACTIVE',
      amount: this.subscription.amount,
      plan: this.subscription.planName,
      method: 'Online Payment (Verified)',
      date: this.subscription.startedAt ? new Date(this.subscription.startedAt) : new Date(),
      userName: this.session.user?.fullName || 'Workspace User',
      userEmail: this.session.user?.email || 'user@meetsphere.com'
    };
    this.checkoutPlan = this.subscription.planName;
    this.checkoutStep = 'success';
    this.checkoutModalVisible = true;
  }

  printTaxInvoice() {
    if (!this.invoiceData) return;
    const inv = this.invoiceData;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const base = Math.round((inv.amount / 1.18) * 100) / 100;
    const gstHalf = Math.round(((inv.amount - base) / 2) * 100) / 100;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${inv.invoiceNumber} - MeetSphere</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #17172d; margin: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #635bff; padding-bottom: 20px; }
          .brand { font-size: 26px; font-weight: 900; color: #635bff; }
          .badge { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .meta { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .meta-box { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th { text-align: left; background: #f1f5f9; padding: 12px; font-size: 13px; border-bottom: 2px solid #cbd5e1; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .total-box { margin-top: 30px; margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
          .grand-total { border-top: 2px solid #17172d; font-size: 18px; font-weight: bold; color: #635bff; padding-top: 10px; }
          .footer { margin-top: 60px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print { .no-print { display: none; } body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #635bff; color: white; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; cursor: pointer;">🖨️ Print / Save as PDF</button>
        </div>
        <div class="header">
          <div>
            <div class="brand">✦ MeetSphere</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">MeetSphere Technologies India Pvt. Ltd.</div>
            <div style="font-size: 12px; color: #64748b;">GSTIN: 24AABCM8291Q1Z8 &nbsp;|&nbsp; SAC: 998313</div>
          </div>
          <div style="text-align: right;">
            <span class="badge">ORIGINAL TAX INVOICE</span>
            <div style="font-size: 18px; font-weight: bold; margin-top: 8px;">${inv.invoiceNumber}</div>
            <div style="font-size: 13px; color: #64748b;">Date: ${new Date(inv.date).toLocaleDateString()}</div>
          </div>
        </div>

        <div class="meta">
          <div class="meta-box">
            <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">BILLED TO:</div>
            <div style="font-size: 16px; font-weight: bold; margin-top: 4px;">${inv.userName}</div>
            <div style="font-size: 13px; color: #64748b;">${inv.userEmail}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">India · Registered Customer</div>
          </div>
          <div class="meta-box">
            <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">PAYMENT INFORMATION:</div>
            <div style="font-size: 14px; margin-top: 4px;"><b>Method:</b> ${inv.method}</div>
            <div style="font-size: 13px; color: #64748b;"><b>Transaction ID:</b> ${inv.transactionId}</div>
            <div style="font-size: 13px; color: #16a34a; font-weight: bold; margin-top: 4px;">✓ Status: Paid &amp; Confirmed</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>DESCRIPTION</th>
              <th>SAC CODE</th>
              <th>PERIOD</th>
              <th style="text-align: right;">AMOUNT (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>MeetSphere ${inv.plan} Subscription License</b>
                <div style="font-size: 12px; color: #64748b;">Unlimited meetings, HD video streaming, workflow automations</div>
              </td>
              <td>998313</td>
              <td>30 Days</td>
              <td style="text-align: right;">₹${base.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Taxable Amount:</span><span>₹${base.toFixed(2)}</span></div>
          <div class="total-row"><span>CGST (9.0%):</span><span>₹${gstHalf.toFixed(2)}</span></div>
          <div class="total-row"><span>SGST (9.0%):</span><span>₹${gstHalf.toFixed(2)}</span></div>
          <div class="total-row grand-total"><span>Total Paid:</span><span>₹${inv.amount.toFixed(2)}</span></div>
        </div>

        <div class="footer">
          <p>Thank you for choosing MeetSphere! This is a computer-generated tax invoice and requires no physical signature.</p>
          <p>Support: support@meetsphere.com &nbsp;·&nbsp; https://meetsphere.com</p>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  upgrade(plan: string) {
    if (plan === 'Free') {
      this.downgradeToFree();
    } else {
      const p = this.plans.find(x => x.name.toLowerCase() === plan.toLowerCase());
      this.openCheckoutModal(plan, p ? p.amount : (plan === 'Business' ? 999 : 499));
    }
  }

  fail(e:any){ const detail=e?.error?.message || e?.message || (e?.status ? `HTTP ${e.status}` : 'Unknown error'); this.error=`Could not complete this action: ${detail}`; }
}
