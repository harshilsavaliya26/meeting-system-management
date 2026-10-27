import { ForgotPasswordComponent } from './pages/forgot-password.component';
import { inject } from '@angular/core';
import { CanActivateFn, Routes, Router } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { AuthComponent } from './pages/auth.component';
import { DashboardComponent } from './pages/dashboard.component';
import { AdminComponent } from './pages/admin.component';
import { RoomComponent } from './pages/room.component';
import { DiscoverComponent } from './pages/discover.component';
import { AdminPaymentsComponent } from './pages/admin-payments.component';
import { PaymentHistoryComponent } from './pages/payment-history.component';

// Login and registration pages must remain accessible even when another role
// was previously signed in. This lets users switch from an existing admin session.

function getSessionAuth() {
  try {
    const token = sessionStorage.getItem('ms_token');
    const stored = sessionStorage.getItem('ms_user');
    const user = JSON.parse(stored || 'null');
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

const userPageGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const { token, user } = getSessionAuth();
  if (token && (user?.role === 'user' || user?.role === 'admin')) return true;
  return router.parseUrl('/login');
};

const userOnlyGuard: CanActivateFn = () => {
  const router = inject(Router);
  const { token, user } = getSessionAuth();
  if (token && user?.role === 'user') return true;
  if (token && user?.role === 'admin') return router.parseUrl('/admin');
  return router.parseUrl('/login');
};

const adminPageGuard: CanActivateFn = () => {
  const router = inject(Router);
  const { token, user } = getSessionAuth();
  if (token && user?.role === 'admin') return true;
  // Keep normal users in their own workspace.
  if (token && user?.role === 'user') return router.parseUrl('/dashboard');
  return router.parseUrl('/admin/login');
};

const roomPageGuard: CanActivateFn = () => {
  const router = inject(Router);
  const { token, user } = getSessionAuth();
  if (token && (user?.role === 'user' || user?.role === 'admin')) return true;
  return router.parseUrl('/login');
};

import { SettingsComponent } from './pages/settings.component';
import { AdminSettingsComponent } from './pages/admin-settings.component';
import { WorkspaceToolsComponent } from './pages/workspace-tools.component';
import { ZoomIntegrationComponent } from './pages/zoom-integration.component';
import { AdminLogsComponent } from './pages/admin-logs.component';

export const routes: Routes = [
 {path:'',component:HomeComponent},
 {path:'home',component:HomeComponent},
 {path:'login',component:AuthComponent,data:{mode:'login',role:'user'}},
 {path:'forgot-password',component:ForgotPasswordComponent},
 {path:'register',component:AuthComponent,data:{mode:'register',role:'user'}},
 {path:'admin/login',component:AuthComponent,data:{mode:'login',role:'admin'}},
 {path:'admin/register',component:AuthComponent,data:{mode:'register',role:'admin'}},
 {path:'dashboard',component:DashboardComponent,canActivate:[userPageGuard]},
 {path:'discover',component:DiscoverComponent,canActivate:[userPageGuard]},
 {path:'payment-history',component:PaymentHistoryComponent,canActivate:[userPageGuard]},
 {path:'settings',component:SettingsComponent,canActivate:[userPageGuard]},
 {path:'calendar',component:WorkspaceToolsComponent,data:{tool:'calendar'},canActivate:[userPageGuard]},
 {path:'notetaker',component:WorkspaceToolsComponent,data:{tool:'notes'},canActivate:[userPageGuard]},
 {path:'contacts',component:WorkspaceToolsComponent,data:{tool:'contacts'},canActivate:[userPageGuard]},
 {path:'automations',component:ZoomIntegrationComponent,canActivate:[userPageGuard]},
 {path:'workspace-automations',component:WorkspaceToolsComponent,data:{tool:'automations'},canActivate:[userPageGuard]},
 {path:'zoom/activate',component:ZoomIntegrationComponent},
 {path:'zoom/callback',component:ZoomIntegrationComponent},
 {path:'upgrade',component:WorkspaceToolsComponent,data:{tool:'upgrade'},canActivate:[userPageGuard]},
 {path:'meeting-brief',component:WorkspaceToolsComponent,data:{tool:'brief'},canActivate:[userPageGuard]},
 {path:'meeting-readiness',component:WorkspaceToolsComponent,data:{tool:'readiness'},canActivate:[userPageGuard]},
 {path:'meeting-cost',component:WorkspaceToolsComponent,data:{tool:'cost'},canActivate:[userPageGuard]},
 {path:'calendar-conflicts',component:WorkspaceToolsComponent,data:{tool:'conflicts'},canActivate:[userPageGuard]},
 {path:'follow-up-actions',component:WorkspaceToolsComponent,data:{tool:'actions'},canActivate:[userPageGuard]},
 {path:'meeting-follow-up',component:WorkspaceToolsComponent,data:{tool:'followup-message'},canActivate:[userPageGuard]},
 {path:'decision-ledger',component:WorkspaceToolsComponent,data:{tool:'decision-ledger'},canActivate:[userOnlyGuard]},
 {path:'admin-tools/diagnostics',component:WorkspaceToolsComponent,data:{admin:true,tool:'diagnostics'},canActivate:[adminPageGuard]},
 {path:'admin-tools/capacity',component:WorkspaceToolsComponent,data:{admin:true,tool:'capacity'},canActivate:[adminPageGuard]},
 {path:'admin-tools/meeting-hygiene',component:WorkspaceToolsComponent,data:{admin:true,tool:'hygiene'},canActivate:[adminPageGuard]},
 {path:'admin-tools/exports',component:WorkspaceToolsComponent,data:{admin:true,tool:'exports'},canActivate:[adminPageGuard]},
 {path:'admin-tools/change-log',component:WorkspaceToolsComponent,data:{admin:true,tool:'change-log'},canActivate:[adminPageGuard]},
 {path:'admin-tools/governance',component:WorkspaceToolsComponent,data:{admin:true,tool:'governance'},canActivate:[adminPageGuard]},
 {path:'admin-tools/security',component:WorkspaceToolsComponent,data:{admin:true,tool:'security'},canActivate:[adminPageGuard]},
 {path:'admin',component:AdminComponent,canActivate:[adminPageGuard]},
 {path:'admin-logs',component:AdminLogsComponent,canActivate:[adminPageGuard]},
 {path:'admin-payments',component:AdminPaymentsComponent,canActivate:[adminPageGuard]},
 {path:'admin-settings',component:AdminSettingsComponent,canActivate:[adminPageGuard]},
 {path:'admin-tools/:tool',component:WorkspaceToolsComponent,data:{admin:true},canActivate:[adminPageGuard]},
 {path:'room/:code',component:RoomComponent,canActivate:[roomPageGuard]},
 {path:'**',redirectTo:''}
];
