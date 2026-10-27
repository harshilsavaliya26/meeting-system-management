import { ErrorHandler, Injectable } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

const API_LOG_URL = 'http://localhost:5001/api/auth/log-error';

// Error throttling cache: prevents logging identical errors repeatedly
const recentErrors = new Map<string, number>();

export function reportErrorToAdmin(
  errorMessage: string,
  source: string = 'App',
  errorType: string = 'System Error'
): void {
  try {
    const cleanMsg = (errorMessage || 'Unknown error').trim().substring(0, 350);
    const cacheKey = `${source}:${cleanMsg}`;
    const now = Date.now();

    // Skip if logged within the last 5 seconds
    const lastSeen = recentErrors.get(cacheKey) || 0;
    if (now - lastSeen < 5000) {
      return;
    }
    recentErrors.set(cacheKey, now);

    // Keep cache size bounded
    if (recentErrors.size > 100) {
      recentErrors.clear();
    }

    // Identify the user experiencing the error
    let email = 'unauthenticated';
    let fullName = 'Guest / Unknown';
    let role = 'user';

    try {
      const stored = sessionStorage.getItem('ms_user') || localStorage.getItem('ms_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u) {
          email = u.email || email;
          fullName = u.fullName || fullName;
          role = u.role || role;
        }
      }
    } catch {}

    const payload = {
      email,
      fullName,
      role,
      errorType: `[${source}] ${errorType}`,
      errorMessage: `${cleanMsg} (Route: ${window.location.pathname || '/'})`
    };

    // Use native fetch with keepalive so delivery is guaranteed even during navigation or crash
    fetch(API_LOG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {
      // Fail silently if server is completely offline
    });
  } catch {
    // Never crash the error handler itself
  }
}

/**
 * Global Angular ErrorHandler:
 * Catches all uncaught runtime exceptions and template errors on any user's screen.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('[MeetSphere Global Error Handler]:', error);

    const message =
      error?.message ||
      (typeof error === 'string' ? error : error?.toString?.() || 'Unknown runtime error');

    reportErrorToAdmin(message, 'Client Runtime', 'Unhandled Exception');
  }
}

/**
 * Global HTTP Interceptor:
 * Automatically captures all HTTP 4xx / 5xx and network failures across the app and sends them to Admin Logs.
 */
export const errorTelemetryInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Don't report errors from the logging endpoint itself or silent 401 token checks
      if (!req.url.includes('/auth/log-error') && err.status !== 401) {
        const statusText = err.status === 0 ? 'Network Connection Failure' : `HTTP ${err.status}`;
        const serverMsg = err.error?.message || err.message || err.statusText || 'Request failed';
        const msg = `${req.method} ${req.url} → ${serverMsg}`;

        reportErrorToAdmin(msg, 'API Request', statusText);
      }
      return throwError(() => err);
    })
  );
};

// Global unhandled promise rejection listener
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = reason?.message || (typeof reason === 'string' ? reason : 'Unhandled Promise Rejection');
    reportErrorToAdmin(msg, 'Promise', 'Async Rejection');
  });
}
