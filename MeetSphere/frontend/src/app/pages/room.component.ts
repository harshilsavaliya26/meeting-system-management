import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, SessionService } from '../services';

interface ChatMessage {
  id: string;
  sender: string;
  initials: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface Participant {
  id: string;
  name: string;
  role: string;
  initials: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  color: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="ms-meeting-container">

  <!-- ================= TOP HEADER ================= -->
  <header class="ms-meeting-header">
    <div class="d-flex align-items-center gap-3">
      <a class="brand text-white" routerLink="/dashboard" (click)="confirmLeave($event)">
        <span class="brand-icon">M</span>
        <span class="d-none d-sm-inline">MeetSphere</span>
      </a>
      <div class="room-title-badge">
        <span class="live-dot"></span>
        <span class="room-title text-truncate" [title]="accessInfo?.title || 'Live Meeting'">
          {{ accessInfo?.title || 'MeetSphere Meeting' }}
        </span>
      </div>
    </div>

    <!-- Center Info: Code & Timer -->
    <div class="d-none d-md-flex align-items-center gap-2">
      <button class="code-pill-btn" (click)="copyCode()" title="Click to copy meeting code">
        <span class="text-white-50">CODE:</span>
        <span class="code-val">{{ code }}</span>
        <span class="copy-icon">📋</span>
      </button>

      <div class="timer-pill">
        <span class="timer-icon">⏱</span>
        <span>{{ meetingDuration }}</span>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="d-flex align-items-center gap-2">
      <button class="header-tool-btn d-none d-sm-inline-flex align-items-center gap-1.5" (click)="openInZoom()" title="Join this meeting in Zoom using the meeting code">
        <span>📹</span>
        <span class="d-none d-md-inline">Join in Zoom</span>
      </button>
      <button class="header-tool-btn d-none d-sm-inline-flex align-items-center gap-1.5" (click)="openInGoogleMeet()" title="Open this call in Google Meet">
        <span>🟢</span>
        <span class="d-none d-md-inline">Google Meet</span>
      </button>
      <button class="header-tool-btn d-none d-lg-inline-flex" (click)="toggleViewMode()" [title]="isGridView ? 'Switch to Speaker View' : 'Switch to Grid View'">
        {{ isGridView ? '⊞ Grid' : '▣ Speaker' }}
      </button>
      <button class="header-tool-btn d-none d-lg-inline-flex" (click)="toggleFullscreen()" title="Toggle Fullscreen">
        ⛶
      </button>
      <button class="btn btn-danger btn-sm rounded-pill px-3 fw-bold" (click)="leaveRoom()">
        Leave Call ✕
      </button>
    </div>
  </header>

  <!-- ================= NOTIFICATION TOAST ================= -->
  <div *ngIf="toastMessage" class="meeting-toast">
    {{ toastMessage }}
  </div>

  <!-- ================= FLOATING REACTIONS ================= -->
  <div class="reactions-overlay">
    <div *ngFor="let r of activeReactions" class="floating-emoji" [style.left.%]="r.x">
      {{ r.emoji }}
    </div>
  </div>

  <!-- ================= LOADING STATE ================= -->
  <div *ngIf="checking" class="meeting-loading">
    <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
    <h5>Connecting to MeetSphere Room...</h5>
    <p class="text-white-50 small">Verifying room security &amp; attendee credentials</p>
  </div>

  <!-- ================= LOCKED STATE (PAYWALL) ================= -->
  <div *ngIf="!checking && accessInfo && !accessInfo.hasAccess" class="meeting-locked">
    <div class="locked-card">
      <div class="lock-icon-wrap">🔒</div>
      <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 mb-2">
        PREMIUM SESSION · ADMISSION REQUIRED
      </span>
      <h2 class="text-white mt-2 mb-1">{{ accessInfo.title }}</h2>
      <p class="text-white-50 small mb-4">Hosted by <strong class="text-white">{{ accessInfo.host }}</strong></p>

      <div class="locked-details">
        <div class="d-flex justify-content-between mb-2">
          <span class="text-white-50">Attendee Registration Fee</span>
          <strong class="text-success fs-5">₹{{ accessInfo.price | number:'1.2-2' }}</strong>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-white-50">Meeting Code</span>
          <code class="text-white bg-dark px-2 py-0.5 rounded">{{ code }}</code>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-white-50">Room Status</span>
          <span class="badge bg-warning text-dark rounded-pill">Payment Pending</span>
        </div>
      </div>

      <p class="text-white-50 small mt-3 mb-4">
        This host has configured an attendee fee. Unlock instant admission through MeetSphere Discover.
      </p>

      <div class="d-flex gap-2 justify-content-center flex-wrap">
        <a routerLink="/dashboard" class="btn btn-outline-light rounded-pill px-4">
          ← Workspace
        </a>
        <a routerLink="/discover" class="btn btn-primary rounded-pill px-4 fw-bold">
          Unlock in Discover →
        </a>
      </div>
    </div>
  </div>

  <!-- ================= ACTIVE CALL EXPERIENCE ================= -->
  <div *ngIf="!checking && (!accessInfo || accessInfo.hasAccess)" class="meeting-body" [class.with-drawer]="activeDrawer !== 'none'">

    <!-- Media Stage Area -->
    <main class="meeting-stage">

      <!-- Media Permission Warning Banner if device was blocked -->
      <div *ngIf="permissionWarning" class="alert alert-warning py-2 px-3 mx-3 mt-2 rounded-3 d-flex align-items-center justify-content-between small">
        <div>
          <strong>Camera/Mic notice:</strong> {{ permissionWarning }}
        </div>
        <button type="button" class="btn btn-sm btn-outline-dark py-0 px-2" (click)="requestMedia()">Retry Camera</button>
      </div>

      <!-- SCREEN SHARE ACTIVE BANNER -->
      <div *ngIf="isScreenSharing" class="screen-share-banner">
        <span>🖥️ You are sharing your screen with participants</span>
        <button class="btn btn-sm btn-outline-light py-0 px-2" (click)="stopScreenShare()">Stop Sharing</button>
      </div>

      <!-- MAIN VIDEO GRID -->
      <div class="video-grid" [ngClass]="{'grid-layout': isGridView, 'speaker-layout': !isGridView, 'has-screen': isScreenSharing}">

        <!-- Screen Share Stage if Active -->
        <div *ngIf="isScreenSharing" class="video-tile screen-tile">
          <video #screenVideo autoplay playsinline muted class="screen-video-elem"></video>
          <div class="tile-label">
            <span class="status-badge bg-primary">Your Shared Screen</span>
          </div>
        </div>

        <!-- Local Participant (You) -->
        <div class="video-tile local-tile" [class.muted-speaking]="!isAudioMuted && isSpeaking">
          <video #localVideo autoplay playsinline muted class="camera-video-elem" [class.d-none]="isVideoOff"></video>

          <!-- Avatar when Camera is OFF -->
          <div *ngIf="isVideoOff" class="avatar-tile-fallback">
            <div class="user-avatar-circle" [style.background]="myColor">
              {{ myInitials }}
            </div>
            <span class="mt-2 text-white-50 small">Camera Off</span>
          </div>

          <!-- Overlay Labels -->
          <div class="tile-label">
            <span class="tile-name">You ({{ isHost ? 'Host' : 'Participant' }})</span>
            <span class="mic-status" [class.is-muted]="isAudioMuted">
              {{ isAudioMuted ? '🔇' : '🎙️' }}
            </span>
          </div>
        </div>

        <!-- Dynamic Remote Participants -->
        <div *ngFor="let p of remoteParticipants" class="video-tile remote-tile">
          <div class="avatar-tile-fallback" [style.background]="p.color">
            <div class="user-avatar-circle" [style.background]="p.color">
              {{ p.initials }}
            </div>
            <div class="pulse-rings" *ngIf="!p.isMuted && !isScreenSharing">
              <span class="ring ring-1"></span>
              <span class="ring ring-2"></span>
            </div>
            <span class="mt-2 text-white-50 small">{{ p.name }}</span>
          </div>
          <div class="tile-label">
            <span class="tile-name">{{ p.name }} <span *ngIf="p.isHost">(Host)</span></span>
            <span class="mic-status" [class.is-muted]="p.isMuted">{{ p.isMuted ? '🔇' : '🎙️' }}</span>
          </div>
        </div>

        <!-- Waiting Card if Host is Alone -->
        <div *ngIf="remoteParticipants.length === 0" class="video-tile waiting-tile d-flex flex-column align-items-center justify-content-center text-center p-4">
          <div class="waiting-avatar mb-3">
            <span class="fs-1">👥</span>
          </div>
          <h5 class="text-white fw-bold mb-1">Waiting for participants to join</h5>
          <p class="text-white-50 small mb-3">Share your 10-digit meeting code or link with attendees</p>
          <div class="d-flex align-items-center gap-2 flex-wrap justify-content-center">
            <code class="px-3 py-1.5 rounded-pill bg-dark text-info border border-info border-opacity-25 fw-bold fs-6">{{ code }}</code>
            <button class="btn btn-outline-light btn-sm rounded-pill px-3" (click)="copyInviteLink()">
              📋 Copy Link
            </button>
            <button class="btn btn-primary btn-sm rounded-pill px-3" (click)="copyCode()">
              Copy Code
            </button>
          </div>
        </div>
      </div>
    </main>
    <!-- ================= RIGHT SLIDE-OUT DRAWERS ================= -->
    <aside *ngIf="activeDrawer !== 'none'" class="meeting-drawer">

      <!-- CHAT DRAWER -->
      <div *ngIf="activeDrawer === 'chat'" class="drawer-content d-flex flex-column h-100">
        <div class="drawer-header">
          <div class="d-flex align-items-center gap-2">
            <span class="fs-5">💬</span>
            <h6 class="mb-0 text-white fw-bold">In-Meeting Chat</h6>
          </div>
          <button class="drawer-close-btn" (click)="closeDrawer()">✕</button>
        </div>

        <div class="chat-messages-container" #chatContainer>
          <div *ngFor="let msg of messages" class="chat-bubble-wrap" [class.my-message]="msg.isMe">
            <div class="chat-meta">
              <span class="sender-name">{{ msg.sender }}</span>
              <span class="msg-time">{{ msg.time }}</span>
            </div>
            <div class="chat-bubble">
              {{ msg.text }}
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <div class="input-group">
            <input type="text" class="form-control form-control-sm chat-input"
                   [(ngModel)]="newChatMessage"
                   placeholder="Send a message to everyone..."
                   (keyup.enter)="sendMessage()">
            <button class="btn btn-primary btn-sm px-3 fw-bold"
                    [disabled]="!newChatMessage.trim()"
                    (click)="sendMessage()">
              Send →
            </button>
          </div>
        </div>
      </div>

      <!-- PARTICIPANTS DRAWER -->
      <div *ngIf="activeDrawer === 'participants'" class="drawer-content d-flex flex-column h-100">
        <div class="drawer-header">
          <div class="d-flex align-items-center gap-2">
            <span class="fs-5">👥</span>
            <h6 class="mb-0 text-white fw-bold">Participants ({{ participants.length }})</h6>
          </div>
          <button class="drawer-close-btn" (click)="closeDrawer()">✕</button>
        </div>

        <div class="p-3 border-bottom border-secondary border-opacity-25">
          <button class="btn btn-outline-light btn-sm w-100 rounded-pill" (click)="copyInviteLink()">
            📋 Copy Meeting Link
          </button>
        </div>

        <div class="participants-list">
          <div *ngFor="let p of participants" class="participant-item">
            <div class="d-flex align-items-center gap-2.5">
              <div class="p-avatar" [style.background]="p.color">
                {{ p.initials }}
              </div>
              <div>
                <b class="text-white d-block small">{{ p.name }}</b>
                <span class="badge bg-secondary-subtle text-secondary py-0 px-1 small" style="font-size: 10px;">
                  {{ p.role }}
                </span>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="text-white-50 small">{{ p.isMuted ? '🔇' : '🎙️' }}</span>
              <span class="text-white-50 small">{{ p.isVideoOff ? '🚫' : '📹' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- WHITEBOARD & NOTES DRAWER -->
      <div *ngIf="activeDrawer === 'notes'" class="drawer-content d-flex flex-column h-100">
        <div class="drawer-header">
          <div class="d-flex align-items-center gap-2">
            <span class="fs-5">📝</span>
            <h6 class="mb-0 text-white fw-bold">Meeting Notes &amp; Minutes</h6>
          </div>
          <button class="drawer-close-btn" (click)="closeDrawer()">✕</button>
        </div>

        <div class="p-3 flex-grow-1 d-flex flex-column">
          <label class="small text-white-50 mb-1">Session Key Takeaways &amp; Action Items</label>
          <textarea class="form-control notes-textarea flex-grow-1"
                    [(ngModel)]="meetingNotes"
                    (input)="saveNotes()"
                    placeholder="Take real-time notes during the meeting...&#10;• Decisions made&#10;• Follow-up tasks&#10;• Assigned owners"></textarea>
          <div class="mt-2 d-flex justify-content-between align-items-center">
            <small class="text-white-50">Auto-saved in session</small>
            <button class="btn btn-sm btn-outline-light rounded-pill px-3" (click)="copyNotes()">
              Copy Notes 📋
            </button>
          </div>
        </div>
      </div>

    </aside>
  </div>

  <!-- ================= FLOATING BOTTOM CONTROL DOCK ================= -->
  <footer *ngIf="!checking && (!accessInfo || accessInfo.hasAccess)" class="ms-meeting-dock">
    <div class="dock-inner">

      <!-- Mic Toggle -->
      <button class="dock-btn" [class.dock-btn-danger]="isAudioMuted" (click)="toggleAudio()" [title]="isAudioMuted ? 'Unmute Mic (Alt+A)' : 'Mute Mic (Alt+A)'">
        <span class="dock-icon">{{ isAudioMuted ? '🔇' : '🎙️' }}</span>
        <span class="dock-label">{{ isAudioMuted ? 'Unmute' : 'Mute' }}</span>
      </button>

      <!-- Camera Toggle -->
      <button class="dock-btn" [class.dock-btn-danger]="isVideoOff" (click)="toggleVideo()" [title]="isVideoOff ? 'Start Video (Alt+V)' : 'Stop Video (Alt+V)'">
        <span class="dock-icon">{{ isVideoOff ? '🚫' : '📹' }}</span>
        <span class="dock-label">{{ isVideoOff ? 'Start Video' : 'Stop Video' }}</span>
      </button>

      <!-- Screen Share Toggle -->
      <button class="dock-btn" [class.dock-btn-active]="isScreenSharing" (click)="toggleScreenShare()" title="Share Screen">
        <span class="dock-icon">{{ isScreenSharing ? '⏹️' : '🖥️' }}</span>
        <span class="dock-label">{{ isScreenSharing ? 'Stop Share' : 'Share Screen' }}</span>
      </button>

      <span class="dock-separator d-none d-sm-block"></span>

      <!-- Emoji Reactions Trigger -->
      <div class="reactions-popover-wrap">
        <button class="dock-btn" (click)="showReactionsMenu = !showReactionsMenu" title="Reactions">
          <span class="dock-icon">👏</span>
          <span class="dock-label">React</span>
        </button>

        <div *ngIf="showReactionsMenu" class="reactions-menu">
          <button (click)="sendReaction('👍')">👍</button>
          <button (click)="sendReaction('❤️')">❤️</button>
          <button (click)="sendReaction('👏')">👏</button>
          <button (click)="sendReaction('🔥')">🔥</button>
          <button (click)="sendReaction('🎉')">🎉</button>
          <button (click)="sendReaction('💡')">💡</button>
        </div>
      </div>

      <!-- Chat Drawer Toggle -->
      <button class="dock-btn position-relative" [class.dock-btn-active]="activeDrawer === 'chat'" (click)="toggleDrawer('chat')" title="In-Call Chat">
        <span class="dock-icon">💬</span>
        <span class="dock-label">Chat</span>
        <span *ngIf="unreadMessages > 0 && activeDrawer !== 'chat'" class="dock-badge">
          {{ unreadMessages }}
        </span>
      </button>

      <!-- Participants Toggle -->
      <button class="dock-btn" [class.dock-btn-active]="activeDrawer === 'participants'" (click)="toggleDrawer('participants')" title="Participants List">
        <span class="dock-icon">👥</span>
        <span class="dock-label">People ({{ participants.length }})</span>
      </button>

      <!-- Meeting Notes Toggle -->
      <button class="dock-btn d-none d-md-flex" [class.dock-btn-active]="activeDrawer === 'notes'" (click)="toggleDrawer('notes')" title="Meeting Notes">
        <span class="dock-icon">📝</span>
        <span class="dock-label">Notes</span>
      </button>

      <span class="dock-separator"></span>

      <!-- End / Leave Button -->
      <button class="dock-btn dock-btn-end" (click)="leaveRoom()" title="Leave Meeting">
        <span class="dock-icon">☎</span>
        <span class="dock-label">Leave</span>
      </button>

    </div>
  </footer>

</div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #0f1117;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .ms-meeting-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background: radial-gradient(circle at 50% 20%, #161922 0%, #0a0c10 100%);
      position: relative;
    }

    /* ================= HEADER ================= */
    .ms-meeting-header {
      height: 60px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(15, 17, 23, 0.85);
      backdrop-filter: blur(12px);
      z-index: 100;
      flex-shrink: 0;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: linear-gradient(135deg, #635bff, #9b51e0);
      display: inline-grid;
      place-items: center;
      font-weight: 800;
      font-size: 16px;
    }

    .room-title-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      max-width: 260px;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulseDot 2s infinite;
    }

    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }

    .room-title {
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
    }

    .code-pill-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(99, 91, 255, 0.12);
      border: 1px solid rgba(99, 91, 255, 0.3);
      border-radius: 20px;
      color: #fff;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .code-pill-btn:hover {
      background: rgba(99, 91, 255, 0.25);
      border-color: rgba(99, 91, 255, 0.6);
    }

    .code-val {
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #a5b4fc;
    }

    .timer-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
    }

    .header-tool-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .header-tool-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    /* ================= MAIN BODY & DRAWERS ================= */
    .meeting-body {
      display: flex;
      flex: 1;
      height: calc(100vh - 140px);
      overflow: hidden;
      position: relative;
    }

    .meeting-stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 16px;
      overflow: hidden;
      position: relative;
    }

    .screen-share-banner {
      background: rgba(99, 91, 255, 0.2);
      border: 1px solid rgba(99, 91, 255, 0.4);
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      color: #c7d2fe;
    }

    /* ================= VIDEO GRID ================= */
    .video-grid {
      flex: 1;
      display: grid;
      gap: 16px;
      width: 100%;
      height: 100%;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      align-items: center;
      justify-content: center;
    }

    .video-grid.speaker-layout {
      grid-template-columns: 2.2fr 1fr;
    }

    .video-grid.has-screen {
      grid-template-columns: 3fr 1fr;
    }

    .video-tile {
      position: relative;
      background: #141721;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      overflow: hidden;
      height: 100%;
      max-height: 100%;
      min-height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .video-tile.active-speaker {
      border: 2px solid #635bff;
      box-shadow: 0 0 20px rgba(99, 91, 255, 0.35);
    }

    .video-tile.muted-speaking {
      border: 2px solid #10b981;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
    }

    .camera-video-elem, .screen-video-elem {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }

    .screen-video-elem {
      transform: none !important;
      object-fit: contain;
      background: #000;
    }

    .avatar-tile-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .remote-grad-1 {
      background: radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);
    }

    .remote-grad-2 {
      background: radial-gradient(circle at 50% 50%, #282136 0%, #120e1c 100%);
    }

    .waiting-tile {
      background: radial-gradient(circle at 50% 50%, rgba(99, 91, 255, 0.12) 0%, #141721 100%);
      border: 1px dashed rgba(255, 255, 255, 0.22);
    }

    .waiting-avatar {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .user-avatar-circle {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      position: relative;
      z-index: 2;
    }

    .pulse-rings {
      position: absolute;
      width: 84px;
      height: 84px;
      pointer-events: none;
    }

    .ring {
      position: absolute;
      inset: -15px;
      border-radius: 50%;
      border: 2px solid rgba(16, 185, 129, 0.4);
      animation: ripple 2.5s infinite cubic-bezier(0, 0.2, 0.8, 1);
    }

    .ring-2 {
      animation-delay: 1.25s;
    }

    @keyframes ripple {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.8); opacity: 0; }
    }

    .tile-label {
      position: absolute;
      bottom: 12px;
      left: 14px;
      right: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      padding: 5px 12px;
      border-radius: 12px;
      z-index: 5;
    }

    .tile-name {
      font-size: 12px;
      font-weight: 600;
      color: #f8fafc;
    }

    .mic-status {
      font-size: 13px;
    }

    .mic-status.is-muted {
      color: #ef4444;
    }

    /* ================= SIDE DRAWER ================= */
    .meeting-drawer {
      width: 360px;
      height: 100%;
      background: #12151e;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      z-index: 40;
      animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .drawer-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .drawer-close-btn {
      background: transparent;
      border: 0;
      color: #94a3b8;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
    }

    .drawer-close-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    /* Chat Drawer Internals */
    .chat-messages-container {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chat-bubble-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      max-width: 85%;
    }

    .chat-bubble-wrap.my-message {
      align-self: flex-end;
      align-items: flex-end;
    }

    .chat-meta {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 3px;
    }

    .sender-name {
      font-weight: 600;
      margin-right: 6px;
    }

    .chat-bubble {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      padding: 9px 14px;
      font-size: 13px;
      line-height: 1.45;
      color: #e2e8f0;
      word-break: break-word;
    }

    .chat-bubble-wrap.my-message .chat-bubble {
      background: #635bff;
      color: #ffffff;
      border-color: #635bff;
    }

    .chat-input-area {
      padding: 14px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: #0f121a;
    }

    .chat-input {
      background: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      color: #fff !important;
      border-radius: 20px 0 0 20px !important;
      padding: 8px 14px !important;
    }

    .chat-input:focus {
      border-color: #635bff !important;
      box-shadow: none !important;
    }

    /* Participants Internals */
    .participants-list {
      flex: 1;
      padding: 12px 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .participant-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
    }

    .p-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
    }

    /* Notes Internals */
    .notes-textarea {
      background: rgba(255, 255, 255, 0.04) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #f1f5f9 !important;
      border-radius: 12px !important;
      font-family: monospace;
      font-size: 13px !important;
      padding: 12px !important;
      resize: none;
    }

    .notes-textarea:focus {
      border-color: #635bff !important;
      box-shadow: none !important;
    }

    /* ================= BOTTOM CONTROL DOCK ================= */
    .ms-meeting-dock {
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 16px;
      background: rgba(15, 17, 23, 0.95);
      backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 100;
      flex-shrink: 0;
    }

    .dock-inner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.04);
      padding: 8px 18px;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
    }

    .dock-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 0;
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 14px;
      cursor: pointer;
      min-width: 62px;
      transition: all 0.18s;
      position: relative;
    }

    .dock-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .dock-btn-danger {
      color: #f87171 !important;
    }

    .dock-btn-danger:hover {
      background: rgba(239, 68, 68, 0.15) !important;
    }

    .dock-btn-active {
      color: #818cf8 !important;
      background: rgba(99, 91, 255, 0.18) !important;
    }

    .dock-icon {
      font-size: 20px;
      line-height: 1;
      margin-bottom: 3px;
    }

    .dock-label {
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .dock-separator {
      width: 1px;
      height: 32px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 4px;
    }

    .dock-badge {
      position: absolute;
      top: 2px;
      right: 12px;
      background: #ef4444;
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      border-radius: 10px;
      padding: 1px 6px;
    }

    .dock-btn-end {
      background: #dc2626 !important;
      color: #fff !important;
      border-radius: 20px;
      padding: 6px 18px;
    }

    .dock-btn-end:hover {
      background: #b91c1c !important;
      transform: scale(1.03);
    }

    /* Reactions Popover */
    .reactions-popover-wrap {
      position: relative;
    }

    .reactions-menu {
      position: absolute;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e2230;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 30px;
      padding: 6px 12px;
      display: flex;
      gap: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      z-index: 120;
    }

    .reactions-menu button {
      background: transparent;
      border: 0;
      font-size: 22px;
      cursor: pointer;
      padding: 4px;
      border-radius: 8px;
      transition: transform 0.15s;
    }

    .reactions-menu button:hover {
      transform: scale(1.3);
    }

    /* Floating Emoji Animation */
    .reactions-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 90;
    }

    .floating-emoji {
      position: absolute;
      bottom: 90px;
      font-size: 38px;
      animation: floatUp 3s ease-out forwards;
    }

    @keyframes floatUp {
      0% { transform: translateY(0) scale(0.6); opacity: 1; }
      100% { transform: translateY(-70vh) scale(1.4); opacity: 0; }
    }

    /* Toast Notification */
    .meeting-toast {
      position: absolute;
      top: 75px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid rgba(99, 91, 255, 0.4);
      color: #fff;
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 200;
      animation: fadeInToast 0.2s ease-out;
    }

    @keyframes fadeInToast {
      from { opacity: 0; transform: translate(-50%, -10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    /* Loading & Locked States */
    .meeting-loading {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .meeting-locked {
      height: calc(100vh - 60px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .locked-card {
      background: #141721;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 36px 40px;
      max-width: 540px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    }

    .lock-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 22px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      font-size: 32px;
      display: grid;
      place-items: center;
      margin: 0 auto 16px;
    }

    .locked-details {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 16px 20px;
      text-align: left;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .meeting-drawer {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 100%;
      }
      .dock-label {
        display: none;
      }
      .dock-btn {
        min-width: 44px;
        padding: 8px;
      }
    }
  `]
})
export class RoomComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private session = inject(SessionService);

  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('screenVideo') screenVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('chatContainer') chatContainerRef!: ElementRef<HTMLDivElement>;

  code = this.route.snapshot.paramMap.get('code') || '';
  checking = true;
  accessInfo: any = null;

  openInZoom() {
    const code = String(this.code || '').trim();
    const digitsOnly = code.replace(/\D/g, '');
    if (digitsOnly.length >= 6) {
      // Numeric meeting codes are Zoom-compatible — open directly in Zoom
      window.open(`https://zoom.us/j/${digitsOnly}`, '_blank');
    } else {
      this.showToast('This meeting code is not a valid Zoom meeting ID.');
    }
  }

  openInGoogleMeet() {
    window.open('https://meet.google.com/new', '_blank');
  }

  // Media states
  localStream: MediaStream | null = null;
  screenStream: MediaStream | null = null;
  isAudioMuted = false;
  isVideoOff = false;
  isScreenSharing = false;
  permissionWarning = '';
  isSpeaking = false;

  // UI Modes
  isGridView = true;
  activeDrawer: 'none' | 'chat' | 'participants' | 'notes' = 'none';
  showReactionsMenu = false;
  toastMessage = '';
  private toastTimer: any = null;

  // Meeting Timer
  meetingDuration = '00:00:00';
  private timerInterval: any = null;
  private secondsElapsed = 0;

  // Chat & Participants
  myInitials = 'ME';
  myColor = 'linear-gradient(135deg, #635bff, #8b5cf6)';
  hostInitials = 'H';
  isHost = false;

  messages: ChatMessage[] = [
    {
      id: 'm1',
      sender: 'MeetSphere Bot',
      initials: 'MS',
      text: 'Welcome to your meeting space! Audio, live video, and screen sharing are active.',
      time: 'Just now',
      isMe: false
    }
  ];
  newChatMessage = '';
  unreadMessages = 0;

  participants: Participant[] = [];
  meetingNotes = '';
  activeReactions: { id: number; emoji: string; x: number }[] = [];

  ngOnInit() {
    const user = this.session.user;
    if (user?.fullName) {
      const parts = user.fullName.trim().split(' ');
      this.myInitials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }

    if (!this.code) {
      this.checking = false;
      return;
    }

    this.api.checkMeetingAccess(this.code).subscribe({
      next: (res) => {
        this.accessInfo = res;
        this.isHost = !!res?.isHost;
        if (res?.host) {
          const hp = res.host.trim().split(' ');
          this.hostInitials = hp.length > 1 ? (hp[0][0] + hp[1][0]).toUpperCase() : hp[0].slice(0, 2).toUpperCase();
        }
        this.checking = false;

        if (res?.hasAccess) {
          this.initMeetingRoom();
        }
      },
      error: () => {
        this.checking = false;
        this.initMeetingRoom();
      }
    });
  }

  ngOnDestroy() {
    this.cleanupMedia();
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private initMeetingRoom() {
    this.startTimer();
    this.setupParticipants();
    this.loadNotes();
    this.requestMedia();
  }

  private startTimer() {
    this.timerInterval = setInterval(() => {
      this.secondsElapsed++;
      const hrs = Math.floor(this.secondsElapsed / 3600);
      const mins = Math.floor((this.secondsElapsed % 3600) / 60);
      const secs = this.secondsElapsed % 60;
      this.meetingDuration =
        [hrs, mins, secs].map(v => v.toString().padStart(2, '0')).join(':');
    }, 1000);
  }

  loadNotes() {
    if (this.code) {
      try {
        this.meetingNotes = localStorage.getItem('ms_notes_' + this.code) || '';
      } catch {
        this.meetingNotes = '';
      }
    }
  }

  saveNotes() {
    if (this.code) {
      try {
        localStorage.setItem('ms_notes_' + this.code, this.meetingNotes);
      } catch {}
    }
  }

  get remoteParticipants(): Participant[] {
    return this.participants.filter(p => p.id !== 'me');
  }

  private setupParticipants() {
    const myName = this.session.user?.fullName || 'You';
    const hostName = this.accessInfo?.host || 'Meeting Host';

    if (this.isHost) {
      this.participants = [
        {
          id: 'me',
          name: myName,
          role: 'Host (You)',
          initials: this.myInitials,
          isHost: true,
          isMuted: this.isAudioMuted,
          isVideoOff: this.isVideoOff,
          color: 'linear-gradient(135deg, #635bff, #8b5cf6)'
        }
      ];
    } else {
      this.participants = [
        {
          id: 'me',
          name: myName,
          role: 'Attendee (You)',
          initials: this.myInitials,
          isHost: false,
          isMuted: this.isAudioMuted,
          isVideoOff: this.isVideoOff,
          color: 'linear-gradient(135deg, #635bff, #8b5cf6)'
        },
        {
          id: 'host',
          name: hostName,
          role: 'Host',
          initials: this.hostInitials,
          isHost: true,
          isMuted: false,
          isVideoOff: false,
          color: 'linear-gradient(135deg, #10b981, #047857)'
        }
      ];
    }
  }

  requestMedia() {
    this.permissionWarning = '';
    if (!navigator.mediaDevices?.getUserMedia) {
      this.permissionWarning = 'Camera/Microphone is not supported in this browser environment.';
      this.isVideoOff = true;
      this.isAudioMuted = true;
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.localStream = stream;
        this.isVideoOff = false;
        this.isAudioMuted = false;
        if (this.localVideoRef?.nativeElement) {
          this.localVideoRef.nativeElement.srcObject = stream;
        }
      })
      .catch(err => {
        // Fallback gracefully without throwing alert
        this.permissionWarning = 'Microphone & camera permissions were not granted or device was not found. Joined in avatar mode.';
        this.isVideoOff = true;
        this.isAudioMuted = true;
        if (this.participants.length) {
          this.participants[0].isVideoOff = true;
          this.participants[0].isMuted = true;
        }
      });
  }

  toggleAudio() {
    this.isAudioMuted = !this.isAudioMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isAudioMuted;
      });
    }
    if (this.participants.length) {
      this.participants[0].isMuted = this.isAudioMuted;
    }
    this.showToast(this.isAudioMuted ? 'Microphone muted 🔇' : 'Microphone unmuted 🎙️');
  }

  toggleVideo() {
    this.isVideoOff = !this.isVideoOff;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !this.isVideoOff;
      });
      if (!this.isVideoOff && this.localVideoRef?.nativeElement) {
        this.localVideoRef.nativeElement.srcObject = this.localStream;
      }
    } else if (!this.isVideoOff) {
      this.requestMedia();
    }
    if (this.participants.length) {
      this.participants[0].isVideoOff = this.isVideoOff;
    }
    this.showToast(this.isVideoOff ? 'Camera turned off 🚫' : 'Camera turned on 📹');
  }

  toggleScreenShare() {
    if (this.isScreenSharing) {
      this.stopScreenShare();
    } else {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        this.showToast('Screen sharing is not supported on this device/browser.');
        return;
      }

      navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
          this.screenStream = stream;
          this.isScreenSharing = true;
          if (this.screenVideoRef?.nativeElement) {
            this.screenVideoRef.nativeElement.srcObject = stream;
          }
          this.showToast('Screen sharing started 🖥️');

          stream.getVideoTracks()[0].onended = () => {
            this.stopScreenShare();
          };
        })
        .catch(() => {
          this.showToast('Screen share cancelled.');
        });
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    this.isScreenSharing = false;
    this.showToast('Screen share stopped.');
  }

  toggleDrawer(drawer: 'chat' | 'participants' | 'notes') {
    if (this.activeDrawer === drawer) {
      this.activeDrawer = 'none';
    } else {
      this.activeDrawer = drawer;
      if (drawer === 'chat') {
        this.unreadMessages = 0;
        setTimeout(() => this.scrollChatToBottom(), 50);
      }
    }
  }

  closeDrawer() {
    this.activeDrawer = 'none';
  }

  sendMessage() {
    const text = this.newChatMessage.trim();
    if (!text) return;

    const myName = this.session.user?.fullName || 'You';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages.push({
      id: 'm_' + Date.now(),
      sender: myName,
      initials: this.myInitials,
      text,
      time,
      isMe: true
    });

    this.newChatMessage = '';
    setTimeout(() => this.scrollChatToBottom(), 50);
  }

  private scrollChatToBottom() {
    if (this.chatContainerRef?.nativeElement) {
      this.chatContainerRef.nativeElement.scrollTop = this.chatContainerRef.nativeElement.scrollHeight;
    }
  }

  sendReaction(emoji: string) {
    this.showReactionsMenu = false;
    const reaction = {
      id: Date.now() + Math.random(),
      emoji,
      x: 35 + Math.random() * 30
    };
    this.activeReactions.push(reaction);
    setTimeout(() => {
      this.activeReactions = this.activeReactions.filter(r => r.id !== reaction.id);
    }, 3000);
  }

  toggleViewMode() {
    this.isGridView = !this.isGridView;
    this.showToast(this.isGridView ? 'Switched to Grid View ⊞' : 'Switched to Speaker View ▣');
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  copyCode() {
    navigator.clipboard?.writeText(this.code);
    this.showToast('Meeting code copied to clipboard! 📋');
  }

  copyInviteLink() {
    const link = `${window.location.origin}/room/${this.code}`;
    navigator.clipboard?.writeText(link);
    this.showToast('Meeting invite link copied! 📋');
  }

  copyNotes() {
    navigator.clipboard?.writeText(this.meetingNotes || 'No notes taken.');
    this.showToast('Meeting notes copied to clipboard! 📋');
  }

  leaveRoom() {
    this.cleanupMedia();
    this.router.navigateByUrl('/dashboard');
  }

  confirmLeave(event: Event) {
    event.preventDefault();
    this.leaveRoom();
  }

  private cleanupMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
  }

  private showToast(msg: string) {
    this.toastMessage = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 3000);
  }
}
