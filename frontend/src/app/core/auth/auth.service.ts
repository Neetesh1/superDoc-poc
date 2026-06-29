import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, User, UserRole } from '../models/policy.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private readonly ROLE_COLORS: Record<UserRole, string> = {
    editor: '#1565C0',
    reviewer: '#2E7D32',
    viewer: '#6A1B9A',
    approver: '#E65100',
    linguistic_reviewer: '#00838F',
    external_collaborator: '#AD1457',
  };

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem('access_token', res.accessToken);
        const userWithColor = { ...res.user, color: this.ROLE_COLORS[res.user.role] };
        localStorage.setItem('current_user', JSON.stringify(userWithColor));
        this.currentUserSubject.next(userWithColor);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUser;
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser;
    return !!user && roles.includes(user.role);
  }

  canEdit(): boolean {
    return this.hasRole('editor', 'approver');
  }

  canReview(): boolean {
    return this.hasRole('reviewer', 'editor', 'linguistic_reviewer');
  }

  canApprove(): boolean {
    return this.hasRole('approver');
  }

  canComment(): boolean {
    return this.hasRole('reviewer', 'editor', 'approver', 'linguistic_reviewer', 'external_collaborator');
  }

  canAcceptReject(): boolean {
    return this.hasRole('editor', 'approver');
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem('current_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
