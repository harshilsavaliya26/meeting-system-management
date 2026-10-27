import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../services';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<main class="home-page">
  <!-- ================= HERO SECTION ================= -->
  <section class="hero" id="home">
    <div class="container">
      <div class="row align-items-center g-5">
        <div class="col-lg-6 hero-text-col">
          <div class="eyebrow-pill">
            <span class="pulse"></span>
            <span>NEXT-GEN VIDEO WORKSPACES</span>
          </div>

          <h1>
            Bring your people closer, <br>
            <span class="gradient-text">effortlessly.</span>
          </h1>

          <p class="hero-copy">
            A smarter, calmer platform for team meetings, live classrooms, and collaborative workspaces. Fast WebRTC audio/video, real-time screen sharing, and automated notes.
          </p>

          <!-- Primary Actions -->
          <div class="d-flex flex-wrap gap-3 mt-4 align-items-center">
            @if (session.loggedIn) {
              <a class="btn btn-primary btn-lg rounded-pill px-4 hero-cta-btn" [routerLink]="session.isAdmin ? '/admin' : '/dashboard'">
                <span>Go to Workspace</span>
                <span class="ms-2">→</span>
              </a>
              <a class="btn btn-outline-dark btn-lg rounded-pill px-4" routerLink="/discover">
                <span>Discover Meetings</span>
              </a>
            } @else {
              <a class="btn btn-primary btn-lg rounded-pill px-4 hero-cta-btn" routerLink="/register">
                <span>Start Free Workspace</span>
                <span class="ms-2">↗</span>
              </a>
              <a class="btn btn-outline-dark btn-lg rounded-pill px-4" routerLink="/login">
                <span>Sign In</span>
              </a>
            }
          </div>

          <!-- Instant Join with Meeting Code -->
          <div class="quick-join-box mt-4">
            <div class="quick-join-input-wrap">
              <span class="join-icon">🔑</span>
              <input
                type="text"
                inputmode="numeric"
                class="form-control quick-join-input"
                placeholder="Enter 10-digit meeting code..."
                [(ngModel)]="joinMeetingCode"
                (input)="onJoinCodeInput($event)"
                (keyup.enter)="joinRoom()"
                maxlength="12"
              />
              <button
                class="btn btn-primary rounded-pill px-4 join-btn"
                [disabled]="!joinMeetingCode.trim()"
                (click)="joinRoom()"
              >
                Join Call
              </button>
            </div>
            <small class="text-muted d-block mt-2 join-hint">
              Enter your numeric meeting code to join directly — also works as a Zoom Meeting ID.
            </small>
          </div>

          <!-- Trust Badges -->
          <div class="trust-row mt-4">
            <span class="trust-item"><span class="check-icon">✓</span> Zero Software Install</span>
            <span class="trust-item"><span class="check-icon">✓</span> 256-Bit Encrypted</span>
            <span class="trust-item"><span class="check-icon">✓</span> Ultra Low-Latency</span>
          </div>
        </div>

        <!-- Hero Art / Live Call Mockup -->
        <div class="col-lg-6 hero-visual-col">
          <div class="meeting-art">
            <div class="art-orb orb-one"></div>
            <div class="art-orb orb-two"></div>

            <div class="meeting-window">
              <div class="window-head">
                <div class="window-dots"><i></i><i></i><i></i></div>
                <span class="window-title">Product Design Sync · Room #4829173056</span>
                <span class="live-pill">● LIVE</span>
              </div>

              <div class="people-grid">
                <div class="person p1 active-speaker">
                  <div class="avatar a1">AM</div>
                  <div class="speaker-wave">
                    <span></span><span></span><span></span>
                  </div>
                  <b>Alex Morgan</b>
                  <small>Speaking...</small>
                </div>

                <div class="person p2">
                  <div class="avatar a2">SK</div>
                  <b>Sam Kim</b>
                  <small>Design Lead</small>
                </div>

                <div class="person p3">
                  <div class="avatar a3">JR</div>
                  <b>Jordan Reed</b>
                  <small>Engineering</small>
                </div>

                <div class="person p4">
                  <div class="avatar a4">YOU</div>
                  <b>You</b>
                  <small>Listening</small>
                </div>
              </div>

              <div class="call-controls">
                <span class="control-btn" title="Mic On">🎙️</span>
                <span class="control-btn" title="Camera On">📹</span>
                <span class="control-btn" title="Screen Share">🖥️</span>
                <span class="control-btn hangup" title="Leave">☎</span>
                <span class="control-btn" title="Live Chat">💬</span>
                <span class="control-btn" title="Settings">⚙️</span>
              </div>
            </div>

            <!-- Floating Notes and Live Counter -->
            <div class="floating-note">
              <span class="note-icon">✦</span>
              <div>
                <b>Instant Room Setup</b>
                <small>Audio, HD Video & Screen Sharing</small>
              </div>
            </div>

            <div class="floating-people">
              <span>AM</span>
              <span>SK</span>
              <span>JR</span>
              <span class="count-pill-tag">+8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= METRICS STRIP ================= -->
  <section class="metrics-strip">
    <div class="container">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">99.98%</div>
          <div class="metric-label">Uptime Reliability</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">100K+</div>
          <div class="metric-label">Meetings Hosted</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">&lt; 85ms</div>
          <div class="metric-label">WebRTC Low Latency</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">256-Bit</div>
          <div class="metric-label">End-to-End Encryption</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= FEATURES SECTION ================= -->
  <section class="features-section" id="features">
    <div class="container">
      <div class="section-intro text-center">
        <span class="eyebrow">LESS FRICTION, MORE FLOW</span>
        <h2>Everything your modern meetings need.</h2>
        <p>Purpose-built tools to bring distributed teams together and keep work moving forward.</p>
      </div>

      <div class="row g-4 mt-3">
        <!-- Feature 1 -->
        <div class="col-md-4">
          <div class="feature-card">
            <div class="feature-icon purple">✦</div>
            <h5>Instant Rooms & Meeting Codes</h5>
            <p>Create a room and invite team members with a unique 10-digit meeting code. No complicated downloads or onboarding friction.</p>
            <div class="feature-badge-pill">Zero Setup</div>
          </div>
        </div>

        <!-- Feature 2 -->
        <div class="col-md-4">
          <div class="feature-card">
            <div class="feature-icon blue">⌘</div>
            <h5>Interactive Workspace Dashboard</h5>
            <p>Organize meetings, manage calendars, view payment history, and coordinate team agendas in one unified dashboard.</p>
            <div class="feature-badge-pill">All-in-One</div>
          </div>
        </div>

        <!-- Feature 3 -->
        <div class="col-md-4">
          <div class="feature-card">
            <div class="feature-icon peach">♧</div>
            <h5>Enterprise Admin & Governance</h5>
            <p>Comprehensive admin control panel with user roles, system capacity diagnostics, real-time audit logs, and security controls.</p>
            <div class="feature-badge-pill">Role Security</div>
          </div>
        </div>

        <!-- Feature 4 -->
        <div class="col-md-4">
          <div class="feature-card">
            <div class="feature-icon green">📹</div>
            <h5>HD Video & Screen Sharing</h5>
            <p>Peer-to-peer WebRTC video stream with intelligent bandwidth adjustment, screen sharing, and integrated live chat.</p>
            <div class="feature-badge-pill">Ultra HD</div>
          </div>
        </div>

        <!-- Feature 5 -->
        <div class="col-md-4">
          <div class="feature-card">
            <div class="feature-icon violet">✧</div>
            <h5>Meeting Briefs & AI Notetaker</h5>
            <p>Built-in meeting brief studio, conflict detectors, follow-up automations, and decision ledgers to capture every action item.</p>
            <div class="feature-badge-pill">Productivity</div>
          </div>
        </div>

        <!-- Feature 6 -->
        <div class="col-md-4">
          <div class="feature-card">
            <div class="feature-icon cyan">⚡</div>
            <h5>Zoom App & Webhook Integration</h5>
            <p>One-click direct bridge to Zoom meetings, calendar scheduling automations, and webhook activation for enterprise workflows.</p>
            <div class="feature-badge-pill">Connected</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= HOW IT WORKS ================= -->
  <section class="how-section" id="how-it-works">
    <div class="container">
      <div class="section-intro text-center">
        <span class="eyebrow">GET STARTED IN THREE STEPS</span>
        <h2>Meet, collaborate, and get things done.</h2>
        <p>A seamless path from opening your browser to hosting high-impact team conversations.</p>
      </div>

      <div class="row g-4 mt-3">
        <div class="col-md-4">
          <article class="how-card">
            <span class="step-number">01</span>
            <h5>Launch or Discover a Room</h5>
            <p>Sign up in seconds and open your MeetSphere workspace or discover active public sessions right away.</p>
          </article>
        </div>

        <div class="col-md-4">
          <article class="how-card">
            <span class="step-number">02</span>
            <h5>Share Your Meeting Code</h5>
            <p>Share your simple 10-digit meeting code or link with participants. Guests join with a single click.</p>
          </article>
        </div>

        <div class="col-md-4">
          <article class="how-card">
            <span class="step-number">03</span>
            <h5>Collaborate in Real-Time</h5>
            <p>Enjoy HD audio, crystal-clear video, screen sharing, live chat, and automated action summaries.</p>
          </article>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= FAQ SECTION ================= -->
  <section class="help-section" id="help">
    <div class="container">
      <div class="section-intro text-center">
        <span class="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
        <h2>Everything you need to know.</h2>
        <p>Quick answers to common questions about MeetSphere features and security.</p>
      </div>

      <div class="faq-list">
        <details class="faq-item">
          <summary>How do I create or join a meeting?</summary>
          <p>
            You can start a meeting instantly from your Workspace Dashboard. To join an existing room, enter the meeting code in the homepage join box or click any invite link shared with you.
          </p>
        </details>

        <details class="faq-item">
          <summary>Do participants need to install software or apps?</summary>
          <p>
            No! MeetSphere runs directly in modern web browsers (Chrome, Edge, Safari, Firefox) on both desktop and mobile without requiring any plugins or installations.
          </p>
        </details>

        <details class="faq-item">
          <summary>Are audio and video calls secure and encrypted?</summary>
          <p>
            Yes. MeetSphere uses end-to-end WebRTC peer encryption (DTLS/SRTP) for media streams and SSL/TLS for all communication, ensuring your private calls remain confidential.
          </p>
        </details>

        <details class="faq-item">
          <summary>Can I integrate MeetSphere with Zoom or my Calendar?</summary>
          <p>
            Yes! MeetSphere includes built-in Zoom integration allowing you to launch Zoom rooms directly, sync calendar appointments, and trigger workspace automations.
          </p>
        </details>

        <details class="faq-item">
          <summary>What administrative controls are available?</summary>
          <p>
            The dedicated Admin Portal includes system capacity diagnostics, real-time audit logs, user role management, payment oversight, and meeting hygiene analytics.
          </p>
        </details>
      </div>
    </div>
  </section>

  <!-- ================= CONTACT SECTION ================= -->
  <section class="contact-section" id="contact">
    <div class="container">
      <div class="section-intro text-center">
        <span class="eyebrow">WE'RE HERE TO HELP</span>
        <h2>Contact MeetSphere Support</h2>
        <p>Have a question, need technical guidance, or want to explore enterprise setups? We'd love to help.</p>
      </div>

      <div class="contact-card">
        <div class="contact-icon">✉</div>
        <div class="contact-details">
          <h5>General Enquiries & Support</h5>
          <p>Send our dedicated support team a message. We typically respond in less than two hours.</p>
          <div class="d-flex align-items-center gap-2 flex-wrap mt-2">
            <a class="contact-email fw-bold" href="mailto:support&#64;meetsphere.app?subject=MeetSphere%20Inquiry">
              support&#64;meetsphere.app
            </a>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 copy-email-btn"
              (click)="copyEmail()"
              title="Copy email address"
            >
              {{ emailCopied ? '✓ Copied!' : '📋 Copy Email' }}
            </button>
          </div>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <a class="btn btn-primary rounded-pill px-4 contact-button" href="mailto:support&#64;meetsphere.app?subject=MeetSphere%20Inquiry">
            Email Support ↗
          </a>
          <button
            type="button"
            class="btn btn-outline-primary rounded-pill px-4"
            (click)="showContactForm = !showContactForm"
          >
            {{ showContactForm ? 'Hide Form ✕' : 'Quick Message 💬' }}
          </button>
        </div>
      </div>

      <!-- Quick In-Page Message Form -->
      @if (showContactForm) {
        <div class="contact-form-card mt-3">
          @if (contactSent) {
            <div class="alert alert-success d-flex align-items-center gap-3 p-3 rounded-4 mb-0">
              <span class="fs-4">✓</span>
              <div>
                <h6 class="mb-1 fw-bold">Message Sent Successfully!</h6>
                <p class="mb-0 small">
                  Thank you, <b>{{ contactName }}</b>! Your inquiry has been logged. Our support team will respond to <b>{{ contactEmail }}</b> within 2 hours.
                </p>
              </div>
              <button class="btn btn-sm btn-outline-success ms-auto rounded-pill px-3" (click)="resetContactForm()">
                Send Another
              </button>
            </div>
          } @else {
            <h5 class="fw-bold mb-3">Send a Quick Message to Support</h5>
            <form (ngSubmit)="sendContactMessage()">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Your Name</label>
                  <input
                    type="text"
                    class="form-control rounded-3"
                    placeholder="e.g. Harshil Savaliya"
                    name="contactName"
                    [(ngModel)]="contactName"
                    required
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Your Email Address</label>
                  <input
                    type="email"
                    class="form-control rounded-3"
                    placeholder="you@example.com"
                    name="contactEmail"
                    [(ngModel)]="contactEmail"
                    required
                  />
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold">How can we help?</label>
                  <textarea
                    class="form-control rounded-3"
                    rows="3"
                    placeholder="Write your question, feedback, or enterprise request here..."
                    name="contactMessage"
                    [(ngModel)]="contactMessage"
                    required
                  ></textarea>
                </div>
                <div class="col-12 d-flex justify-content-end">
                  <button
                    type="submit"
                    class="btn btn-primary rounded-pill px-4 fw-bold"
                    [disabled]="!contactName.trim() || !contactEmail.trim() || !contactMessage.trim() || sendingMessage"
                  >
                    {{ sendingMessage ? 'Sending...' : 'Send Message ✉' }}
                  </button>
                </div>
              </div>
            </form>
          }
        </div>
      }

      <p class="contact-note text-center">
        For account inquiries, please email us from the address associated with your MeetSphere account.
      </p>
    </div>
  </section>

  <!-- ================= BOTTOM HIGH-IMPACT CTA ================= -->
  <section class="bottom-cta">
    <div class="container">
      <div class="bottom-cta-box">
        <div class="bottom-cta-content text-center">
          <span class="eyebrow-light">ELEVATE YOUR CONVERSATIONS</span>
          <h2>Make room for great ideas.</h2>
          <p class="bottom-cta-subtext">
            Join thousands of teams, educators, and creators who rely on MeetSphere for effortless collaboration.
          </p>

          <div class="d-flex justify-content-center gap-3 flex-wrap mt-4">
            @if (session.loggedIn) {
              <a [routerLink]="session.isAdmin ? '/admin' : '/dashboard'" class="btn btn-light btn-lg rounded-pill px-5 fw-bold cta-main-btn">
                Open My Workspace →
              </a>
            } @else {
              <a routerLink="/register" class="btn btn-light btn-lg rounded-pill px-5 fw-bold cta-main-btn">
                Create Free Account
              </a>
              <a routerLink="/login" class="btn btn-outline-light btn-lg rounded-pill px-4">
                User Sign In
              </a>
            }
          </div>

          <div class="bottom-cta-perks mt-4">
            <span>✓ Free tier included</span>
            <span>•</span>
            <span>✓ No credit card required</span>
            <span>•</span>
            <span>✓ Instant 60-second start</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>
`,
})
export class HomeComponent {
  session = inject(SessionService);
  router = inject(Router);

  joinMeetingCode = '';

  // Contact section interactive state
  showContactForm = false;
  emailCopied = false;
  contactName = '';
  contactEmail = '';
  contactMessage = '';
  sendingMessage = false;
  contactSent = false;

  onJoinCodeInput(event: any): void {
    // Strip non-digits to enforce numeric-only meeting codes
    this.joinMeetingCode = (event.target?.value || '').replace(/\D/g, '');
  }

  joinRoom(): void {
    const code = this.joinMeetingCode.trim().replace(/\D/g, '');
    if (code) {
      this.router.navigate(['/room', code]);
    }
  }

  copyEmail(): void {
    navigator.clipboard.writeText('support@meetsphere.app').then(() => {
      this.emailCopied = true;
      setTimeout(() => {
        this.emailCopied = false;
      }, 2000);
    }).catch(() => {
      this.emailCopied = true;
      setTimeout(() => {
        this.emailCopied = false;
      }, 2000);
    });
  }

  sendContactMessage(): void {
    if (!this.contactName.trim() || !this.contactEmail.trim() || !this.contactMessage.trim()) return;
    this.sendingMessage = true;
    setTimeout(() => {
      this.sendingMessage = false;
      this.contactSent = true;
    }, 700);
  }

  resetContactForm(): void {
    this.contactSent = false;
    this.contactMessage = '';
  }
}
