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
  <aside class="sidebar">
    <a class="brand side-brand" routerLink="/dashboard"><span class="brand-icon">M</span> MeetSphere</a>
    <div class="side-label">WORKSPACE</div>
    <nav class="sidebar-nav">
      <a class="side-link" routerLink="/dashboard">
        <span class="side-link-icon">▦</span> Overview
      </a>
      <a class="side-link active" routerLink="/discover">
        <span class="side-link-icon">◈</span> Discover meetings
      </a>
      <a class="side-link" routerLink="/payment-history">
        <span class="side-link-icon">₹</span> Payment history
      </a>
      <a class="side-link" routerLink="/calendar">
        <span class="side-link-icon">▣</span> Calendar
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
      <a class="side-link" routerLink="/settings">
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
        <span class="eyebrow">MEETSPHERE DISCOVERY</span>
        <h2>Discover meetings <span>✦</span></h2>
        <p>Explore public sessions. Join free meetings or unlock paid masterclasses.</p>
      </div>
      <a routerLink="/dashboard" class="btn btn-outline-dark rounded-pill px-4">My workspace</a>
    </header>

    <section *ngIf="announcement?.message" class="alert alert-info border-0 rounded-4 shadow-sm d-flex align-items-start gap-3 mb-4" role="status">
      <span class="fs-4">📢</span>
      <div class="flex-grow-1"><strong>Platform announcement</strong><div>{{ announcement.message }}</div><small class="text-muted" *ngIf="announcement.createdAt">{{ announcement.createdAt | date:'medium' }}</small></div>
    </section>

    <div class="meetings-section">
      <div class="section-heading mb-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <h4 class="mb-0">Available sessions</h4>
            <span class="live-pulse-indicator py-0.5 px-2">
              <span class="live-pulse-dot"></span>
              <span>Live Catalog</span>
            </span>
          </div>
          <p class="mb-0 text-muted">Find and join sessions hosted by community members.</p>
        </div>
        <span class="count-pill">{{ filteredMeetings.length }} of {{ meetings.length }} sessions</span>
      </div>

      <!-- DYNAMIC SEARCH & FILTER BAR -->
      <div class="row g-2 align-items-center mb-4" *ngIf="meetings.length">
        <div class="col-md-6 col-lg-5">
          <div class="dynamic-search-wrapper">
            <span class="me-2 text-muted">🔍</span>
            <input type="text" class="dynamic-search-input" [(ngModel)]="searchQuery" placeholder="Search by topic, host name, or code..." />
            <button *ngIf="searchQuery" type="button" class="btn btn-sm p-0 text-muted border-0 bg-transparent ms-1" (click)="searchQuery = ''">✕</button>
          </div>
        </div>
        <div class="col-md-6 col-lg-7 d-flex gap-1.5 flex-wrap justify-content-md-end">
          <button type="button" class="quick-pill-btn" [class.active]="filterCategory === 'all'" (click)="filterCategory = 'all'">
            All Sessions ({{ meetings.length }})
          </button>
          <button type="button" class="quick-pill-btn" [class.active]="filterCategory === 'paid'" (click)="filterCategory = 'paid'">
            Premium Masterclasses
          </button>
          <button type="button" class="quick-pill-btn" [class.active]="filterCategory === 'free'" (click)="filterCategory = 'free'">
            Free Sessions
          </button>
        </div>
      </div>

      <!-- Empty Filtered Results -->
      <div class="p-4 text-center border rounded-4 bg-light my-3" *ngIf="!filteredMeetings.length && meetings.length">
        <div class="fs-2 mb-2">🔎</div>
        <h6 class="fw-bold mb-1">No sessions match your search</h6>
        <p class="text-muted small mb-2">Try searching with a different term or clear the filter.</p>
        <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" (click)="searchQuery = ''; filterCategory = 'all'">Reset filters</button>
      </div>

      <div class="row g-3" *ngIf="filteredMeetings.length">
        <div class="col-md-6 col-xl-4" *ngFor="let m of filteredMeetings">
          <div class="feature-card h-100 d-flex flex-column position-relative">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div class="feature-icon purple mb-0">◷</div>
              <div class="d-flex gap-1 align-items-center">
                <span *ngIf="m.hasPaid" class="badge bg-success text-white rounded-pill px-2 py-1 small">
                  ✓ Paid
                </span>
                <span *ngIf="m.price > 0" class="badge rounded-pill px-2 py-1"
                  [style.background]="m.hasPaid ? '#e9ecef' : 'linear-gradient(135deg, #635bff, #927fff)'"
                  [style.color]="m.hasPaid ? '#495057' : '#fff'">
                  ₹{{ m.price | number:'1.2-2' }}
                </span>
                <span *ngIf="!m.price || m.price <= 0" class="badge bg-secondary-subtle text-muted rounded-pill px-2 py-1">
                  Free
                </span>
              </div>
            </div>

            <h5 class="mb-1">{{ m.title }}</h5>
            <p class="mb-2 text-muted small">Hosted by <b>{{ m.host }}</b></p>
            <p *ngIf="m.scheduledAt" class="small text-secondary mb-3">
              📅 {{ m.scheduledAt | date:'medium' }}
            </p>

            <div class="mt-auto pt-3 border-top">
              <!-- If already paid or free, user can directly join -->
              <a *ngIf="m.hasPaid || !m.price || m.price <= 0"
                class="btn btn-primary rounded-pill px-4 w-100"
                [routerLink]="['/room', m.meetingCode]">
                Join meeting →
              </a>

              <!-- If paid and not yet purchased, trigger checkout -->
              <button *ngIf="m.price > 0 && !m.hasPaid"
                type="button"
                class="btn rounded-pill px-4 w-100 fw-bold text-white shadow-sm"
                style="background: linear-gradient(135deg, #635bff, #7a68ff);"
                (click)="openCheckout(m)">
                💳 Pay &amp; Join (₹{{ m.price | number:'1.0-0' }})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!meetings.length && !loading" class="empty-state">
        <div class="empty-icon">◈</div>
        <h5>No meetings available yet</h5>
        <p>When community members create meetings, they will appear here.</p>
        <a routerLink="/dashboard" class="btn btn-primary rounded-pill px-4 mt-2">Create a meeting</a>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2 small">Loading sessions...</p>
      </div>
    </div>
  </main>
</div>

<!-- ================= CHECKOUT MODAL ================= -->
<div class="checkout-backdrop" *ngIf="showModal" (click)="closeOnBackdrop($event)">
  <div class="checkout-card" (click)="$event.stopPropagation()">
    <!-- Header -->
    <div class="checkout-header">
      <div class="d-flex align-items-center gap-3">
        <div class="brand-badge-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        </div>
        <div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge-secure">SECURE MEETING ACCESS</span>
          </div>
          <h4 class="mb-0 mt-1 modal-title-styled">Checkout &amp; Unlock</h4>
        </div>
      </div>
      <button type="button" class="btn-close-checkout" (click)="closeCheckout()" aria-label="Close">✕</button>
    </div>

    <!-- Step 1: Payment Checkout Selection -->
    <div *ngIf="modalStep === 'checkout'" class="checkout-body">
      <!-- Meeting summary ticket pass -->
      <div class="meeting-pass-card mb-3">
        <div class="pass-ribbon">
          <span>MEETING PASS</span>
          <span class="code-pill">#{{ activeMeeting?.meetingCode }}</span>
        </div>
        <div class="pass-body d-flex justify-content-between align-items-center">
          <div class="pe-3 overflow-hidden">
            <h5 class="meeting-title-pass text-truncate mb-1">{{ activeMeeting?.title }}</h5>
            <div class="host-badge">
              <span class="host-avatar">{{ (activeMeeting?.host || 'H')[0] | uppercase }}</span>
              <span class="host-name">Host: <b>{{ activeMeeting?.host }}</b></span>
            </div>
          </div>
          <div class="text-end ps-3 border-start flex-shrink-0">
            <div class="pass-price">₹{{ activeMeeting?.price | number:'1.2-2' }}</div>
            <span class="pass-type-label">One-time Access</span>
          </div>
        </div>
      </div>

      <!-- Mode indicator pill -->
      <div class="gateway-status-pill mb-3" [class.live]="isRazorpayConfigured">
        <span class="pulse-dot"></span>
        <span *ngIf="isRazorpayConfigured">
          <b>Razorpay Gateway Connected</b> · Key: {{ razorpayKeyId | slice:0:8 }}...
        </span>
        <span *ngIf="!isRazorpayConfigured">
          <b>Interactive Test &amp; Demo Mode</b> · Instant Simulated Checkout
        </span>
      </div>

      <!-- Payment Method Selection Tabs -->
      <div class="methods-section-header mb-2">
        <span class="section-title-label">CHOOSE PAYMENT METHOD</span>
        <span class="secure-label">🔒 PCI-DSS Encrypted</span>
      </div>

      <div class="payment-tabs-grid mb-3">
        <button type="button" class="pay-tab-btn" [class.active]="selectedMethod === 'UPI'" (click)="selectedMethod = 'UPI'">
          <span class="pay-tab-icon">📱</span>
          <b>UPI / QR</b>
          <small>GPay, PhonePe</small>
        </button>

        <button type="button" class="pay-tab-btn" [class.active]="selectedMethod === 'CARD'" (click)="selectedMethod = 'CARD'">
          <span class="pay-tab-icon">💳</span>
          <b>Card</b>
          <small>Visa, MC, RuPay</small>
        </button>

        <button type="button" class="pay-tab-btn" [class.active]="selectedMethod === 'NETBANKING'" (click)="selectedMethod = 'NETBANKING'">
          <span class="pay-tab-icon">🏛️</span>
          <b>NetBanking</b>
          <small>Top Banks</small>
        </button>

        <button type="button" class="pay-tab-btn" [class.active]="selectedMethod === 'WALLET'" (click)="selectedMethod = 'WALLET'">
          <span class="pay-tab-icon">👛</span>
          <b>Wallet</b>
          <small>Paytm, PhonePe</small>
        </button>
      </div>

      <!-- Method Details Box -->
      <div class="method-panel-card p-3 rounded-4 mb-3">
        <!-- UPI TAB -->
        <div *ngIf="selectedMethod === 'UPI'">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <label class="form-label-custom mb-0">Virtual Payment Address (VPA)</label>
            <div class="upi-mode-switch">
              <button type="button" class="switch-chip" [class.active]="upiMode === 'id'" (click)="upiMode = 'id'">UPI ID</button>
              <button type="button" class="switch-chip" [class.active]="upiMode === 'qr'" (click)="upiMode = 'qr'">QR Code</button>
            </div>
          </div>

          <div *ngIf="upiMode === 'id'">
            <div class="input-icon-group mb-2">
              <span class="input-prefix-icon">&#64;</span>
              <input type="text" class="form-control-custom" [(ngModel)]="upiId" placeholder="username&#64;bank">
            </div>
            <div class="d-flex gap-1 flex-wrap">
              <button *ngFor="let p of upiPresets" type="button" class="upi-preset-chip" (click)="upiId = p.value">
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- UPI QR Mode -->
          <div *ngIf="upiMode === 'qr'" class="text-center py-2">
            <div class="upi-qr-box p-3 d-inline-block bg-white rounded-3 shadow-xs border mb-2">
              <svg width="120" height="120" viewBox="0 0 100 100" class="upi-qr-svg">
                <!-- QR Finder patterns -->
                <rect x="5" y="5" width="26" height="26" rx="4" fill="#1e1b4b" />
                <rect x="9" y="9" width="18" height="18" rx="2" fill="#fff" />
                <rect x="13" y="13" width="10" height="10" fill="#635bff" />

                <rect x="69" y="5" width="26" height="26" rx="4" fill="#1e1b4b" />
                <rect x="73" y="9" width="18" height="18" rx="2" fill="#fff" />
                <rect x="77" y="13" width="10" height="10" fill="#635bff" />

                <rect x="5" y="69" width="26" height="26" rx="4" fill="#1e1b4b" />
                <rect x="9" y="73" width="18" height="18" rx="2" fill="#fff" />
                <rect x="13" y="77" width="10" height="10" fill="#635bff" />

                <!-- Mock QR dots -->
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
              <div class="mt-1 small fw-bold text-dark">₹{{ activeMeeting?.price | number:'1.2-2' }}</div>
            </div>
            <div class="small text-muted" style="font-size: 11px;">
              Scan using <b>Google Pay</b>, <b>PhonePe</b>, <b>Paytm</b>, or <b>BHIM</b>
            </div>
          </div>
        </div>

        <!-- CARD TAB -->
        <div *ngIf="selectedMethod === 'CARD'">
          <!-- Mini virtual card display -->
          <div class="mini-card-preview mb-3" [class.visa]="cardBrand === 'visa'" [class.mc]="cardBrand === 'mastercard'" [class.rupay]="cardBrand === 'rupay'">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="mini-card-chip"></span>
              <span class="mini-card-brand fw-bold text-white text-uppercase">{{ cardBrand }}</span>
            </div>
            <div class="mini-card-number mb-2">
              {{ cardNumber || '•••• •••• •••• ••••' }}
            </div>
            <div class="d-flex justify-content-between text-white-50 small" style="font-size: 10px;">
              <span>CARDHOLDER</span>
              <span>EXPIRES: {{ cardExpiry || 'MM/YY' }}</span>
            </div>
          </div>

          <label class="form-label-custom">Card Number</label>
          <div class="input-icon-group mb-2">
            <span class="input-prefix-icon">💳</span>
            <input type="text" class="form-control-custom" [(ngModel)]="cardNumber" (input)="onCardInput($event)" placeholder="4242 4242 4242 4242" maxlength="19">
          </div>
          <div class="row g-2">
            <div class="col-7">
              <label class="form-label-custom">Expiry Date</label>
              <input type="text" class="form-control-custom" [(ngModel)]="cardExpiry" placeholder="MM/YY" maxlength="5">
            </div>
            <div class="col-5">
              <label class="form-label-custom">CVV / CVC</label>
              <input type="password" class="form-control-custom" [(ngModel)]="cardCvv" placeholder="123" maxlength="4">
            </div>
          </div>
        </div>

        <!-- NETBANKING TAB -->
        <div *ngIf="selectedMethod === 'NETBANKING'">
          <label class="form-label-custom mb-2">Popular Indian Banks</label>
          <div class="popular-banks-grid mb-2">
            <button *ngFor="let b of popularBanks" type="button" class="bank-pill-btn" [class.active]="selectedBank === b.name" (click)="selectedBank = b.name">
              <span class="bank-dot" [ngClass]="b.code"></span>
              <span>{{ b.name }}</span>
            </button>
          </div>
          <label class="form-label-custom mt-2">Or Choose from All Banks</label>
          <select class="form-select-custom" [(ngModel)]="selectedBank">
            <option>HDFC Bank</option>
            <option>State Bank of India</option>
            <option>ICICI Bank</option>
            <option>Axis Bank</option>
            <option>Kotak Mahindra Bank</option>
            <option>Punjab National Bank</option>
            <option>Bank of Baroda</option>
            <option>IndusInd Bank</option>
          </select>
        </div>

        <!-- WALLET TAB -->
        <div *ngIf="selectedMethod === 'WALLET'">
          <label class="form-label-custom mb-2">Select Digital Wallet</label>
          <div class="wallet-grid">
            <div *ngFor="let w of popularWallets" class="wallet-tile" [class.active]="selectedWallet === w.name" (click)="selectedWallet = w.name">
              <span class="wallet-icon">{{ w.icon }}</span>
              <span class="wallet-name">{{ w.name }}</span>
              <span class="wallet-radio"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error message banner -->
      <div *ngIf="modalError" class="alert-error-banner mb-3">
        <span>⚠️</span>
        <div class="small">{{ modalError }}</div>
      </div>

      <!-- Action buttons -->
      <div class="checkout-footer">
        <button *ngIf="isRazorpayConfigured"
          type="button"
          class="btn-pay-gradient w-100"
          [disabled]="processing"
          (click)="payWithRazorpay()">
          <span *ngIf="processing" class="spinner-border spinner-border-sm me-2"></span>
          <span *ngIf="!processing">🔒 Pay ₹{{ activeMeeting?.price | number:'1.2-2' }} &amp; Join Session</span>
          <span *ngIf="processing">Contacting Razorpay Gateway...</span>
        </button>

        <button *ngIf="!isRazorpayConfigured"
          type="button"
          class="btn-pay-gradient w-100"
          [disabled]="processing"
          (click)="payWithDemo()">
          <span *ngIf="processing" class="spinner-border spinner-border-sm me-2"></span>
          <span *ngIf="!processing">🔒 Pay ₹{{ activeMeeting?.price | number:'1.2-2' }} &amp; Unlock Room</span>
          <span *ngIf="processing">Simulating Instant Payment...</span>
        </button>

        <div class="security-guarantee-row mt-2">
          <span>⚡ Instant Room Admission</span>
          <span>•</span>
          <span>🔒 256-bit SSL</span>
          <span>•</span>
          <span>🛡️ Verified Access</span>
        </div>
      </div>
    </div>

    <!-- Step 2: Success Confirmation -->
    <div *ngIf="modalStep === 'success'" class="checkout-body text-center py-4">
      <div class="success-icon-badge mb-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h3 class="fw-bold mb-1" style="color: #0f172a; font-size: 22px;">Payment Successful!</h3>
      <p class="text-muted small mb-3">
        Meeting room access for <b>{{ activeMeeting?.title }}</b> is unlocked.
      </p>

      <div class="receipt-box-card p-3 rounded-4 mb-4 text-start">
        <div class="d-flex justify-content-between mb-2">
          <span class="receipt-key">Transaction Ref</span>
          <code class="receipt-code">{{ completedTxnId }}</code>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="receipt-key">Room Title</span>
          <span class="receipt-val text-truncate fw-semibold" style="max-width: 240px;">{{ activeMeeting?.title }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="receipt-key">Amount Paid</span>
          <span class="receipt-price">₹{{ activeMeeting?.price | number:'1.2-2' }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="receipt-key">Method</span>
          <span class="receipt-val">{{ completedMethod }}</span>
        </div>
        <div class="d-flex justify-content-between pt-2 border-top">
          <span class="receipt-key">Room Pass Status</span>
          <span class="badge-status-active">● Active &amp; Verified</span>
        </div>
      </div>

      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary rounded-pill w-50 py-2 fw-semibold" (click)="closeCheckout()">
          Close
        </button>
        <button type="button" class="btn btn-primary rounded-pill w-50 py-2 fw-bold text-white shadow-sm" style="background: linear-gradient(135deg, #635bff, #7a6bff); border: 0;"
          (click)="enterRoom()">
          Enter Room Now →
        </button>
      </div>
    </div>
  </div>
</div>
`,
  styles: [`
    .checkout-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2500;
      background: rgba(15, 23, 42, 0.68);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .checkout-card {
      background: #ffffff;
      width: min(510px, 100%);
      border-radius: 24px;
      box-shadow: 0 25px 70px rgba(15, 23, 42, 0.28);
      overflow: hidden;
      border: 1px solid rgba(226, 232, 240, 0.8);
      animation: modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(18px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .checkout-header {
      padding: 18px 24px 16px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }
    .brand-badge-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #635bff, #8374ff);
      color: #ffffff;
      display: grid;
      place-items: center;
      box-shadow: 0 6px 16px rgba(99, 91, 255, 0.25);
    }
    .badge-secure {
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #635bff;
      background: #eef2ff;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
    }
    .modal-title-styled {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .btn-close-checkout {
      border: 0;
      background: #f1f5f9;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 14px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-close-checkout:hover {
      background: #e2e8f0;
      color: #0f172a;
      transform: scale(1.05);
    }
    .checkout-body {
      padding: 20px 24px;
    }

    /* Meeting Pass Card */
    .meeting-pass-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }
    .pass-ribbon {
      background: #1e1b4b;
      color: #c7d2fe;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 6px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .code-pill {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      padding: 2px 7px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 10.5px;
    }
    .pass-body {
      padding: 14px 16px;
    }
    .meeting-title-pass {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .host-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 3px 8px 3px 4px;
      font-size: 11px;
      color: #475569;
    }
    .host-avatar {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #635bff;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      display: grid;
      place-items: center;
    }
    .pass-price {
      font-size: 22px;
      font-weight: 900;
      color: #635bff;
      line-height: 1.1;
    }
    .pass-type-label {
      font-size: 10px;
      color: #64748b;
      display: block;
      margin-top: 2px;
      font-weight: 600;
    }

    /* Gateway status pill */
    .gateway-status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 10px;
      font-size: 11.5px;
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .gateway-status-pill.live {
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
    }
    .gateway-status-pill.live .pulse-dot {
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
    }

    /* Section header */
    .methods-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #64748b;
    }
    .secure-label {
      font-size: 10.5px;
      font-weight: 600;
      color: #10b981;
    }

    /* Payment Tabs Grid */
    .payment-tabs-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .pay-tab-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 4px;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.18s ease;
      text-align: center;
    }
    .pay-tab-btn:hover {
      border-color: #cbd5e1;
      background: #ffffff;
      transform: translateY(-1px);
    }
    .pay-tab-btn.active {
      border-color: #635bff;
      background: #eef2ff;
      color: #635bff;
      box-shadow: 0 0 0 1px #635bff, 0 4px 12px rgba(99, 91, 255, 0.12);
    }
    .pay-tab-icon {
      font-size: 19px;
      line-height: 1;
      margin-bottom: 3px;
    }
    .pay-tab-btn b {
      font-size: 11.5px;
      font-weight: 700;
      display: block;
      color: inherit;
    }
    .pay-tab-btn small {
      font-size: 9px;
      color: #64748b;
      display: block;
      margin-top: 1px;
    }
    .pay-tab-btn.active small {
      color: #635bff;
    }

    /* Method Panel Card */
    .method-panel-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
    }
    .form-label-custom {
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      display: block;
      margin-bottom: 5px;
    }
    .form-control-custom, .form-select-custom {
      width: 100%;
      height: 38px;
      border-radius: 10px;
      border: 1.5px solid #cbd5e1;
      background: #ffffff;
      padding: 6px 12px;
      font-size: 12.5px;
      font-weight: 500;
      color: #0f172a;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-control-custom:focus, .form-select-custom:focus {
      outline: none;
      border-color: #635bff;
      box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.15);
    }
    .input-icon-group {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-prefix-icon {
      position: absolute;
      left: 12px;
      font-size: 13px;
      color: #64748b;
      pointer-events: none;
    }
    .input-icon-group .form-control-custom {
      padding-left: 32px;
    }

    /* UPI Mode Switch */
    .upi-mode-switch {
      display: inline-flex;
      background: #e2e8f0;
      padding: 2px;
      border-radius: 8px;
      gap: 2px;
    }
    .switch-chip {
      border: 0;
      background: transparent;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
    }
    .switch-chip.active {
      background: #ffffff;
      color: #635bff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .upi-preset-chip {
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      font-size: 10.5px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.12s;
    }
    .upi-preset-chip:hover {
      border-color: #635bff;
      color: #635bff;
      background: #f5f3ff;
    }

    /* Mini Card Preview */
    .mini-card-preview {
      background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%);
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 8px 20px rgba(30, 27, 75, 0.2);
      transition: background 0.3s ease;
    }
    .mini-card-preview.visa {
      background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%);
    }
    .mini-card-preview.mc {
      background: linear-gradient(135deg, #451a03 0%, #c2410c 100%);
    }
    .mini-card-preview.rupay {
      background: linear-gradient(135deg, #064e3b 0%, #059669 100%);
    }
    .mini-card-chip {
      width: 26px;
      height: 20px;
      border-radius: 4px;
      background: linear-gradient(135deg, #fde047, #f59e0b);
      display: inline-block;
    }
    .mini-card-brand {
      font-size: 12px;
      letter-spacing: 0.05em;
    }
    .mini-card-number {
      font-family: monospace;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #ffffff;
    }

    /* Popular Banks Grid */
    .popular-banks-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .bank-pill-btn {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      border-radius: 8px;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bank-pill-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .bank-pill-btn.active {
      border-color: #635bff;
      background: #eef2ff;
      color: #4338ca;
    }
    .bank-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .bank-dot.hdfc { background: #004c8f; }
    .bank-dot.sbi { background: #0084c6; }
    .bank-dot.icici { background: #a81c20; }
    .bank-dot.axis { background: #97144d; }
    .bank-dot.kotak { background: #ed1c24; }
    .bank-dot.pnb { background: #a20a10; }

    /* Wallet Grid */
    .wallet-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .wallet-tile {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.15s;
    }
    .wallet-tile:hover {
      border-color: #cbd5e1;
    }
    .wallet-tile.active {
      border-color: #635bff;
      background: #eef2ff;
    }
    .wallet-icon {
      font-size: 18px;
    }
    .wallet-name {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      flex: 1;
    }
    .wallet-radio {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1.5px solid #cbd5e1;
      display: grid;
      place-items: center;
    }
    .wallet-tile.active .wallet-radio {
      border-color: #635bff;
      background: #635bff;
      box-shadow: inset 0 0 0 2.5px #ffffff;
    }

    /* Error alert */
    .alert-error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #991b1b;
    }

    /* Pay gradient button */
    .btn-pay-gradient {
      border: 0;
      border-radius: 12px;
      background: linear-gradient(135deg, #635bff 0%, #7c6cf0 100%);
      color: #ffffff;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 800;
      box-shadow: 0 10px 24px rgba(99, 91, 255, 0.3);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-pay-gradient:hover:not(:disabled) {
      transform: translateY(-1.5px);
      box-shadow: 0 14px 30px rgba(99, 91, 255, 0.4);
      background: linear-gradient(135deg, #5347ee 0%, #6f5ee8 100%);
    }
    .btn-pay-gradient:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .security-guarantee-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      font-size: 10.5px;
      color: #64748b;
      font-weight: 500;
    }

    /* Success Card */
    .success-icon-badge {
      width: 60px;
      height: 60px;
      margin: 0 auto;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: #fff;
      display: grid;
      place-items: center;
      box-shadow: 0 10px 25px rgba(34, 197, 94, 0.35);
    }
    .receipt-box-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .receipt-key {
      color: #64748b;
    }
    .receipt-code {
      font-family: monospace;
      font-weight: 700;
      color: #0f172a;
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .receipt-val {
      color: #0f172a;
      font-weight: 600;
    }
    .receipt-price {
      font-weight: 800;
      color: #635bff;
    }
    .badge-status-active {
      color: #059669;
      font-weight: 700;
      background: #ecfdf5;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
    }
  `]
})
export class DiscoverComponent implements OnInit, OnDestroy {
  api = inject(ApiService);
  session = inject(SessionService);
  router = inject(Router);



  meetings: any[] = [];
  searchQuery = '';
  filterCategory: 'all' | 'free' | 'paid' = 'all';

  get filteredMeetings(): any[] {
    let list = this.meetings || [];
    const q = (this.searchQuery || '').toLowerCase().trim();
    if (q) {
      list = list.filter(m =>
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.host && m.host.toLowerCase().includes(q)) ||
        (m.meetingCode && m.meetingCode.toLowerCase().includes(q))
      );
    }
    if (this.filterCategory === 'free') {
      list = list.filter(m => !m.price || Number(m.price) <= 0);
    } else if (this.filterCategory === 'paid') {
      list = list.filter(m => Number(m.price) > 0);
    }
    return list;
  }

  announcement: any = null;
  loading = true;

  // Checkout modal state
  showModal = false;
  modalStep: 'checkout' | 'success' = 'checkout';
  activeMeeting: any = null;
  selectedMethod = 'UPI';
  upiMode: 'id' | 'qr' = 'id';
  upiId = 'demo' + String.fromCharCode(64) + 'okaxis';
  cardNumber = '4242 4242 4242 4242';
  cardExpiry = '12/28';
  cardCvv = '123';
  cardHolder = '';
  selectedBank = 'HDFC Bank';
  selectedWallet = 'Paytm';

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

  onCardInput(event: any) {
    const val = (event.target?.value || '').replace(/\D/g, '').substring(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    this.cardNumber = formatted;
  }

  isRazorpayConfigured = false;
  razorpayKeyId = '';
  processing = false;
  modalError = '';
  completedTxnId = '';
  completedMethod = '';

  get selectedMethodLabel(): string {
    const labels: Record<string, string> = { UPI: 'UPI / QR (GPay, PhonePe, Paytm)', CARD: 'Debit / Credit Card', NETBANKING: 'Net Banking', WALLET: 'Digital Wallet' };
    return labels[this.selectedMethod] || 'Online Payment';
  }

  get initials() {
    return (this.session.user?.fullName || 'M')
      .split(' ')
      .map((x: string) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private liveRefreshTimer: any;

  ngOnInit() {
    if (!this.session.loggedIn) {
      this.session.redirectToLogin();
      return;
    }

    this.loadMeetings();
    this.loadAnnouncement();
    this.checkGatewayConfig();
    // Sync meeting changes and platform announcements from the shared database.
    this.liveRefreshTimer = setInterval(() => { this.loadMeetings(); this.loadAnnouncement(); }, 15000);
  }

  ngOnDestroy() {
    if (this.liveRefreshTimer) clearInterval(this.liveRefreshTimer);
  }

  loadAnnouncement() {
    this.api.latestAnnouncement().subscribe({ next: (item: any) => this.announcement = item || null, error: () => this.announcement = null });
  }

  loadMeetings() {
    this.loading = true;
    this.api.discoverMeetings().subscribe({
      next: (x) => {
        this.meetings = x || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  checkGatewayConfig() {
    this.api.paymentConfig().subscribe({
      next: (cfg) => {
        this.isRazorpayConfigured = !!cfg.razorpayConfigured;
        this.razorpayKeyId = cfg.keyId || '';
      },
      error: () => {
        this.isRazorpayConfigured = false;
      }
    });
  }

  openCheckout(meeting: any) {
    this.activeMeeting = meeting;
    this.modalStep = 'checkout';
    this.modalError = '';
    this.processing = false;
    this.completedTxnId = '';
    this.completedMethod = '';
    this.showModal = true;
  }

  closeCheckout() {
    this.showModal = false;
    this.activeMeeting = null;
    this.modalError = '';
    this.processing = false;
  }

  closeOnBackdrop(e: MouseEvent) {
    this.closeCheckout();
  }

  setUpi(id: string) {
    this.upiId = id;
  }

  readonly upiPresets = [
    { label: '@okaxis', value: 'user@okaxis' },
    { label: '@okhdfcbank', value: 'user@okhdfcbank' },
    { label: '@ybl', value: 'user@ybl' },
    { label: '@paytm', value: 'user@paytm' },
  ];

  setUpiPreset(index: number) {
    this.upiId = this.upiPresets[index].value;
  }

  payWithDemo() {
    if (!this.activeMeeting) return;
    if (!['UPI', 'CARD', 'NETBANKING', 'WALLET'].includes(this.selectedMethod)) {
      this.modalError = 'Please select a valid payment method.';
      return;
    }
    this.processing = true;
    this.modalError = '';

    // Step 1: Create Order
    this.api.createPaymentOrder(this.activeMeeting.id).subscribe({
      next: (orderResp) => {
        const orderId = orderResp.orderId;

        // Step 2: Complete Demo Payment
        this.api.demoPayment(orderId, this.selectedMethod, true).subscribe({
          next: (payResp) => {
            this.processing = false;
            this.completedTxnId = payResp.paymentId || 'MSPAY_' + Date.now();
            this.completedMethod = this.selectedMethodLabel + ' (Demo)';
            this.activeMeeting.hasPaid = true;
            this.modalStep = 'success';

            // Refresh list in background
            this.loadMeetings();
          },
          error: (err) => {
            this.processing = false;
            this.modalError = err.error?.message || 'Payment simulation failed. Please try again.';
          }
        });
      },
      error: (err) => {
        this.processing = false;
        this.modalError = err.error?.message || 'Could not initiate payment order.';
      }
    });
  }

  payWithRazorpay() {
    if (!this.activeMeeting) return;
    if (!['UPI', 'CARD', 'NETBANKING', 'WALLET'].includes(this.selectedMethod)) {
      this.modalError = 'Please select a valid payment method.';
      return;
    }
    this.processing = true;
    this.modalError = '';

    this.api.createPaymentOrder(this.activeMeeting.id).subscribe({
      next: (orderResp) => {
        const options = {
          key: orderResp.keyId || this.razorpayKeyId,
          amount: orderResp.amount,
          currency: 'INR',
          name: 'MeetSphere',
          description: `Access to: ${this.activeMeeting.title}`,
          order_id: orderResp.orderId,
          prefill: {
            name: this.session.user?.fullName,
            email: this.session.user?.email
          },
          theme: {
            color: '#635bff'
          },
          handler: (response: any) => {
            // Verify signature on backend
            this.api.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            }).subscribe({
              next: () => {
                this.processing = false;
                this.completedTxnId = response.razorpay_payment_id;
                this.completedMethod = 'Razorpay (method confirmed by gateway)';
                this.activeMeeting.hasPaid = true;
                this.modalStep = 'success';
                this.loadMeetings();
              },
              error: (vErr) => {
                this.processing = false;
                this.modalError = vErr.error?.message || 'Server verification failed. Please contact support.';
              }
            });
          },
          modal: {
            ondismiss: () => {
              this.processing = false;
            }
          }
        };

        try {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } catch (e) {
          this.processing = false;
          this.modalError = 'Razorpay checkout script failed to open. Falling back to demo mode.';
          this.isRazorpayConfigured = false;
        }
      },
      error: (err) => {
        this.processing = false;
        this.modalError = err.error?.message || 'Could not create gateway order.';
      }
    });
  }

  enterRoom() {
    if (this.activeMeeting?.meetingCode) {
      this.closeCheckout();
      this.router.navigate(['/room', this.activeMeeting.meetingCode]);
    }
  }
}
