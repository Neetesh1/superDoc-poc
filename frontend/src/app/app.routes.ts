import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'policies', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'policies',
    canActivate: [authGuard],
    loadComponent: () => import('./features/policies/policy-list/policy-list.component').then(m => m.PolicyListComponent),
  },
  {
    path: 'policies/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/policies/policy-editor-page/policy-editor-page.component').then(m => m.PolicyEditorPageComponent),
  },
  {
    path: 'policies/:id/history',
    canActivate: [authGuard],
    loadComponent: () => import('./features/version-history/version-history.component').then(m => m.VersionHistoryComponent),
  },
  { path: '**', redirectTo: 'policies' },
];
