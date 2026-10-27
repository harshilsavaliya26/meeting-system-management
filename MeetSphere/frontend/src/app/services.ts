import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';

const API = 'http://localhost:5001/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private headers() {
    const token = sessionStorage.getItem('ms_token') || localStorage.getItem('ms_token');
    return { headers: new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {}) };
  }

  register(data: any, admin = false): Observable<any> { return this.http.post(`${API}/auth/${admin ? 'admin-register' : 'register'}`, data); }
  forgotPassword(email: string): Observable<any> { return this.http.post(`${API}/auth/forgot-password`, { email }); }
  resetPassword(data: { email: string; code: string; newPassword: string }): Observable<any> { return this.http.post(`${API}/auth/reset-password`, data); }

  login(data: any): Observable<any> {
    // Authentication state belongs to this tab only. Remove legacy shared keys once.
    sessionStorage.removeItem('ms_token');
    sessionStorage.removeItem('ms_user');
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_user');
    return this.http.post<any>(`${API}/auth/login`, data).pipe(
      tap(r => {
        // Keep authentication credentials in sessionStorage only. localStorage is shared across tabs.
        sessionStorage.setItem('ms_token', r.token);
        sessionStorage.setItem('ms_user', JSON.stringify(r.user));
      })  
    );
  }

  getMe(): Observable<any> {
    // Do not update storage here. SessionService.syncNow compares the server
    // response with the previous tab-local user before saving changes.
    return this.http.get<any>(`${API}/auth/me`, this.headers());
  }

  meetings(): Observable<any[]> { return this.http.get<any[]>(`${API}/meetings`, this.headers()); }
  meetingStats(): Observable<any> { return this.http.get<any>(`${API}/meetings/stats`, this.headers()); }
  latestAnnouncement(): Observable<any> { return this.http.get<any>(`${API}/announcements`, this.headers()); }
  publishAnnouncement(message: string): Observable<any> { return this.http.post<any>(`${API}/announcements`, { message }, this.headers()); }
  dismissAnnouncement(id: number): Observable<any> { return this.http.delete<any>(`${API}/announcements/${id}`, this.headers()); }
  createMeeting(data: any): Observable<any> { return this.http.post(`${API}/meetings`, data, this.headers()); }
  users(): Observable<any[]> { return this.http.get<any[]>(`${API}/admin/users`, this.headers()); }
  getUserDetail(id: number): Observable<any> { return this.http.get<any>(`${API}/admin/users/${id}`, this.headers()); }
  updateUserRole(id: number, role: string): Observable<any> { return this.http.put(`${API}/admin/users/${id}/role`, { role }, this.headers()); }
  editUser(id: number, data: any): Observable<any> { return this.http.put(`${API}/admin/users/${id}`, data, this.headers()); }
  editMeeting(id: number, data: any): Observable<any> { return this.http.put(`${API}/admin/meetings/${id}`, data, this.headers()); }
  deleteUser(id: number): Observable<any> { return this.http.delete(`${API}/admin/users/${id}`, this.headers()); }
  deleteMeeting(id: number): Observable<any> { return this.http.delete(`${API}/meetings/${id}`, this.headers()); }
  deleteMeetingByCode(code: string): Observable<any> { return this.http.delete(`${API}/meetings/code/${code}`, this.headers()); }
  discoverMeetings(): Observable<any[]> { return this.http.get<any[]>(`${API}/meetings/discover`, this.headers()); }
  adminPayments(): Observable<any[]> { return this.http.get<any[]>(`${API}/payments/admin`, this.headers()); }
  myPayments(): Observable<any[]> { return this.http.get<any[]>(`${API}/payments/mine`, this.headers()); }
  paymentConfig(): Observable<any> { return this.http.get<any>(`${API}/payments/config`, this.headers()); }
  createPaymentOrder(meetingId: number): Observable<any> { return this.http.post<any>(`${API}/payments/create-order`, { meetingId }, this.headers()); }
  demoPayment(orderId: string, method: string, demo = true): Observable<any> { return this.http.post<any>(`${API}/payments/in-app`, { orderId, method, demo }, this.headers()); }
  verifyPayment(data: any): Observable<any> { return this.http.post<any>(`${API}/payments/verify`, data, this.headers()); }
  checkMeetingAccess(code: string): Observable<any> { return this.http.get<any>(`${API}/meetings/access/${code}`, this.headers()); }
  calendar(admin = false): Observable<any[]> { return this.http.get<any[]>(`${API}/workspace/calendar`, this.headers()); }
  addCalendar(data:any): Observable<any> { return this.http.post(`${API}/workspace/calendar`, data, this.headers()); }
  updateCalendar(id:number,data:any): Observable<any> { return this.http.put(`${API}/workspace/calendar/${id}`, data, this.headers()); }
  deleteCalendar(id:number): Observable<any> { return this.http.delete(`${API}/workspace/calendar/${id}`, this.headers()); }
  notes(admin = false): Observable<any[]> { return this.http.get<any[]>(`${API}/workspace/notes`, this.headers()); }
  addNote(data:any): Observable<any> { return this.http.post(`${API}/workspace/notes`, data, this.headers()); }
  updateNote(id:number,data:any): Observable<any> { return this.http.put(`${API}/workspace/notes/${id}`, data, this.headers()); }
  deleteNote(id:number): Observable<any> { return this.http.delete(`${API}/workspace/notes/${id}`, this.headers()); }
  contacts(admin = false): Observable<any[]> { return this.http.get<any[]>(`${API}/workspace/contacts`, this.headers()); }
  addContact(data:any): Observable<any> { return this.http.post(`${API}/workspace/contacts`, data, this.headers()); }
  updateContact(id:number,data:any): Observable<any> { return this.http.put(`${API}/workspace/contacts/${id}`, data, this.headers()); }
  deleteContact(id:number): Observable<any> { return this.http.delete(`${API}/workspace/contacts/${id}`, this.headers()); }
  actions(admin = false): Observable<any[]> { return this.http.get<any[]>(`${API}/workspace/actions`, this.headers()); }
  addAction(data:any): Observable<any> { return this.http.post(`${API}/workspace/actions`, data, this.headers()); }
  updateAction(id:number,data:any): Observable<any> { return this.http.put(`${API}/workspace/actions/${id}`, data, this.headers()); }
  deleteAction(id:number): Observable<any> { return this.http.delete(`${API}/workspace/actions/${id}`, this.headers()); }
  automations(admin = false): Observable<any[]> { return this.http.get<any[]>(`${API}/workspace/automations`, this.headers()); }
  addAutomation(data: any): Observable<any> {
    const name = String(data?.name ?? '').trim();
    const trigger = String(data?.trigger ?? data?.triggerName ?? data?.trigger_name ?? '').trim();
    const action = String(data?.action ?? data?.actionName ?? data?.action_name ?? '').trim();

    const payload = {
      name,
      trigger,
      action,
      triggerName: trigger,
      actionName: action,
      trigger_name: trigger,
      action_name: action,
      enabled: data?.enabled !== false
    };

    return this.http.post(`${API}/workspace/automations`, payload, this.headers());
  }
  updateAutomation(id:number,data:any): Observable<any> { return this.http.put(`${API}/workspace/automations/${id}`, data, this.headers()); }
  toggleAutomation(id:number): Observable<any> { return this.http.put(`${API}/workspace/automations/${id}/toggle`, {}, this.headers()); }
  deleteAutomation(id:number): Observable<any> { return this.http.delete(`${API}/workspace/automations/${id}`, this.headers()); }
  subscription(): Observable<any> { return this.http.get<any>(`${API}/workspace/subscription`, this.headers()); }
  upgrade(plan: string, details?: any): Observable<any> { return this.http.post(`${API}/workspace/subscription`, { plan, ...(details || {}) }, this.headers()); }
  adminSubscriptions(): Observable<any[]> { return this.http.get<any[]>(`${API}/workspace/admin/subscriptions`, this.headers()); }
  zoomAuthorizeUrl(): Observable<any> { return this.http.get<any>(`${API}/zoom/authorize-url`, this.headers()); }
  zoomStatus(): Observable<any> { return this.http.get<any>(`${API}/zoom/status`, this.headers()); }
  zoomDemoConnect(): Observable<any> { return this.http.post<any>(`${API}/zoom/demo-connect`, {}, this.headers()); }
  zoomCallback(search: string): Observable<any> { return this.http.get<any>(`${API}/zoom/callback${search}`); }
  loginLogs(status: string = 'all', search: string = ''): Observable<any[]> {
    let url = `${API}/admin/login-logs?limit=300`;
    if (status && status !== 'all') url += `&status=${encodeURIComponent(status)}`;
    if (search && search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    return this.http.get<any[]>(url, this.headers());
  }
  deleteLoginLog(id: number): Observable<any> { return this.http.delete(`${API}/admin/login-logs/${id}`, this.headers()); }
  clearLoginLogs(): Observable<any> { return this.http.delete(`${API}/admin/login-logs/clear`, this.headers()); }
  logClientError(data: { email?: string; errorMessage: string; errorType?: string }): Observable<any> {
    return this.http.post(`${API}/auth/log-error`, data);
  }
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private router = inject(Router);
  private api = inject(ApiService);
  private _syncTimer: any = null;

  get token(): string | null {
    return sessionStorage.getItem('ms_token') || localStorage.getItem('ms_token');
  }

  get user(): any {
    try {
      const s = sessionStorage.getItem('ms_user') || localStorage.getItem('ms_user');
      return JSON.parse(s || 'null');
    } catch {
      return null;
    }
  }

  get isAdmin(): boolean { return this.user?.role === 'admin'; }
  get loggedIn(): boolean { return !!this.token && !!this.user; }

  logout() {
    this.stopSync();
    sessionStorage.removeItem('ms_token');
    sessionStorage.removeItem('ms_user');
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_user');
    this.router.navigateByUrl('/');
  }

  openPanel() { this.router.navigateByUrl(this.isAdmin ? '/admin' : '/dashboard'); }
  redirectToLogin() { this.router.navigateByUrl('/login'); }

  /**
   * Start automatic session sync with the server.
   * Polls /api/auth/me every 15 seconds to detect if admin has updated the user's details.
   * If the user was deleted or token expired, silently logs out (no popup).
   */
  startSync(onUpdated?: (user: any) => void): void {
    this.stopSync();
    this._syncTimer = setInterval(() => {
      this.syncNow(onUpdated);
    }, 15000); // Check every 15 seconds
  }

  stopSync(): void {
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
      this._syncTimer = null;
    }
  }

  /**
   * Immediately sync with server. Detects admin updates.
   * Any auth error (401/404) → silent logout, no popup.
   * Network errors → ignored, retries on next interval.
   */
  syncNow(onUpdated?: (user: any) => void): void {
    if (!this.loggedIn) return;
    this.api.getMe().pipe(
      catchError((err) => {
        // 401 = token expired, 404 = user deleted → silent logout
        if (err.status === 401 || err.status === 404) {
          this.stopSync();
          this.logout();
        }
        // Network or server errors → ignore, retry next cycle
        return of(null);
      })
    ).subscribe((serverUser: any) => {
      if (!serverUser) return;

      const localUser = this.user;
      // Detect changes: name, email, or role updated by admin
      if (localUser &&
        (localUser.fullName !== serverUser.fullName ||
         localUser.email !== serverUser.email ||
         localUser.role !== serverUser.role)) {
        // Update storage with fresh data from server
        sessionStorage.setItem('ms_user', JSON.stringify(serverUser));
        if (onUpdated) onUpdated(serverUser);
        // If role changed from user to admin or vice versa, redirect
        if (localUser.role !== serverUser.role) {
          if (serverUser.role === 'admin') {
            this.router.navigateByUrl('/admin');
          } else {
            this.router.navigateByUrl('/dashboard');
          }
        }
      }
    });
  }
}
