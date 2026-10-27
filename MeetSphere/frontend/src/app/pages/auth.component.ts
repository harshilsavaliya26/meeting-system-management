import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../services';
import { timeout } from 'rxjs/operators';

@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink],template:`
<div class="auth-wrap" [class.admin-auth]="isAdmin" [class.register-auth]="isRegister">
  <div class="auth-form-side">
    <div class="auth-card">
      <a routerLink="/" class="auth-brand"><span class="brand-icon">M</span><span>MeetSphere</span></a>

      <div class="form-icon">{{isAdmin?'⌘':'✦'}}</div>
      <span class="eyebrow">{{isAdmin?'ADMIN CONSOLE':'MEETSPHERE WORKSPACE'}}</span>
      <h2>{{isRegister ? (isAdmin ? 'Create admin account' : 'Create your account') : (isAdmin ? 'Welcome, Admin' : 'Welcome back')}}</h2>
      <p class="muted">{{isRegister ? (isAdmin ? 'Set up a secure administrator account.' : 'Join MeetSphere and start connecting with purpose.') : (isAdmin ? 'Sign in to manage users and meetings.' : 'Enter your details to continue to MeetSphere.')}}</p>

      <div class="security-badge" *ngIf="isAdmin"><span>✓</span> Authorized administrator access</div>

      <form (ngSubmit)="submit()" #authForm="ngForm" novalidate>
        <div class="mb-3" *ngIf="isRegister">
          <label class="form-label">Full name</label>
          <input class="form-control form-control-lg" name="fullName" [(ngModel)]="fullName" required placeholder="e.g. Harshil Savaliya">
        </div>

        <div class="mb-3">
          <label class="form-label">Email address</label>
          <input class="form-control form-control-lg" type="email" name="email" [(ngModel)]="email" required placeholder="you@example.com">
        </div>

        <div class="mb-2">
          <div class="password-label">
            <label class="form-label">Password</label>
            <a *ngIf="!isRegister" routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
          </div>
          <input class="form-control form-control-lg" type="password" name="password" [(ngModel)]="password" required placeholder="Enter your password">
        </div>
        <small class="form-hint" *ngIf="isRegister">Use at least 8 characters.</small>

        <div class="mb-3 mt-3" *ngIf="isRegister && isAdmin">
          <label class="form-label">Admin Setup Key</label>
          <input class="form-control form-control-lg" type="text" name="setupKey" [(ngModel)]="setupKey" required placeholder="MEETSPHERE-ADMIN-2026">
          <small class="form-hint">Authorized key: <code class="text-primary fw-bold clickable-key" (click)="setupKey='MEETSPHERE-ADMIN-2026'" title="Click to fill key" style="cursor:pointer; text-decoration:underline;">MEETSPHERE-ADMIN-2026</code> (click to auto-fill)</small>
        </div>

        <div class="alert alert-danger mt-3" *ngIf="error">{{error}}</div>
        <div class="alert alert-success mt-3" *ngIf="success">{{success}}</div>

        <button type="submit" class="btn btn-primary btn-lg w-100 auth-submit mt-3" [disabled]="busy">
          <span>{{busy?'Please wait…':(isRegister?(isAdmin?'Create admin account':'Create account'):(isAdmin?'Sign in to console':'Sign in securely'))}}</span>
          <span>→</span>
        </button>
      </form>

      <div class="auth-switch" *ngIf="!isRegister">
        {{isAdmin?'Need an admin account?':'New here?'}}
        <a [routerLink]="isAdmin?'/admin/register':'/register'">{{isAdmin?'Register securely':'Create an account'}}</a>
      </div>
      <div class="auth-switch" *ngIf="isRegister">
        Already registered?
        <a [routerLink]="isAdmin?'/admin/login':'/login'">Sign in</a>
      </div>
      <a class="back-home" routerLink="/">← Back to home</a>
    </div>
  </div>

  <aside class="auth-visual">
    <div class="visual-orb orb-a"></div><div class="visual-orb orb-b"></div>
    <div class="visual-top"><a routerLink="/" class="auth-brand"><span class="brand-icon">M</span> MeetSphere</a><span class="secure-pill">{{isAdmin?'ADMIN ACCESS':'PRIVATE & SECURE'}}</span></div>
    <div class="visual-copy">
      <span class="eyebrow">{{isAdmin?'MEETSPHERE ADMIN':'CONNECT WITH PURPOSE'}}</span>
      <h1>{{isAdmin?'Everything under control.':'Meet. Talk. Create.'}}</h1>
      <p>{{isAdmin?'A focused workspace for managing your MeetSphere community.':'A simpler way to bring people together for meaningful meetings and conversations.'}}</p>
      <div class="visual-grid">
        <div><b>01</b><span>{{isAdmin?'Manage users':'Create meetings'}}</span></div>
        <div><b>02</b><span>{{isAdmin?'Track meetings':'Share access'}}</span></div>
        <div><b>03</b><span>{{isAdmin?'Manage community':'Stay connected'}}</span></div>
      </div>
    </div>
    <div class="visual-bottom">MEETSPHERE <span>·</span> SIMPLE · SECURE · CONNECTED</div>
  </aside>
</div>`})
export class AuthComponent {
 private route=inject(ActivatedRoute); private api=inject(ApiService); private router=inject(Router);
 isAdmin=false; isRegister=false; fullName=''; email=''; password=''; setupKey=''; error=''; success=''; busy=false;

 constructor() {
  this.route.data.subscribe(d => {
    this.isAdmin = d['role'] === 'admin';
    this.isRegister = d['mode'] === 'register';
    if (this.isAdmin && this.isRegister && !this.setupKey) {
      this.setupKey = 'MEETSPHERE-ADMIN-2026';
    }
  });
 }

 submit(){
  if(this.busy) return;
  this.error=''; this.success='';
  
  const rawEmail = (this.email || '').trim();
  const rawFullName = (this.fullName || '').trim();
  const rawPassword = this.password || '';
  const rawSetupKey = (this.setupKey || '').trim();

  if(this.isRegister && !rawFullName) {
    this.error = 'Please enter your full name.';
    return;
  }

  if(!rawEmail || !rawEmail.includes('@')) {
    this.error = 'Please enter a valid email address.';
    return;
  }

  if(this.isRegister && rawPassword.length < 8) {
    this.error = 'Password must be at least 8 characters long.';
    return;
  }

  if(!this.isRegister && !rawPassword) {
    this.error = 'Please enter your password.';
    return;
  }

  if(this.isRegister && this.isAdmin && !rawSetupKey) {
    this.error = 'Please enter the Admin Setup Key (MEETSPHERE-ADMIN-2026).';
    return;
  }

  this.busy=true;
  const req = this.isRegister
    ? this.api.register({
        fullName: rawFullName,
        email: rawEmail,
        password: rawPassword,
        setupKey: rawSetupKey || 'MEETSPHERE-ADMIN-2026'
      }, this.isAdmin)
    : this.api.login({
        email: rawEmail,
        password: rawPassword,
        role: this.isAdmin ? 'admin' : 'user'
      });

  req.pipe(timeout(15000)).subscribe({
    next:(r:any)=>{
      this.busy=false;
      if(this.isRegister){
        this.success = r?.message || (this.isAdmin ? 'Admin account created successfully! Redirecting to sign in…' : 'Account created successfully! Please sign in.');
        setTimeout(() => this.router.navigateByUrl(this.isAdmin ? '/admin/login' : '/login'), 1200);
        return;
      }
      let user: any;
      try {
        const stored = sessionStorage.getItem('ms_user');
        user = JSON.parse(stored || 'null');
      } catch {
        user = null;
      }
      if (!user || user.role !== (this.isAdmin ? 'admin' : 'user')) {
        sessionStorage.removeItem('ms_token'); sessionStorage.removeItem('ms_user');
        localStorage.removeItem('ms_token'); localStorage.removeItem('ms_user');
        this.error = this.isAdmin ? 'This account is not an admin account. Please sign in as a user.' : 'This is an admin account. Please use Admin Login.';
        try {
          this.api.logClientError({ email: rawEmail, errorMessage: this.error, errorType: 'Role Mismatch' }).subscribe({ error: () => {} });
        } catch {}
        return;
      }
      void this.router.navigateByUrl(user.role === 'admin' ? '/admin' : '/dashboard');
    },
    error:(e:any)=>{
      this.busy=false;
      if(e?.name==='TimeoutError') this.error='The request took too long. Check that MySQL is running and the API can connect to the database, then try again.';
      else if(e?.status===0) this.error='Cannot reach the .NET API. Start the backend at http://localhost:5001 and try again.';
      else this.error=e?.error?.message||`Request failed (${e?.status||'unknown'}). Check the API and database settings.`;

      if (!this.isRegister && (e?.status === 0 || e?.name === 'TimeoutError')) {
        try {
          this.api.logClientError({ email: rawEmail, errorMessage: this.error, errorType: 'Connection Failure' }).subscribe({ error: () => {} });
        } catch {}
      }
    }
  });
 }
}
