import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatInputModule, MatButtonModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatIconModule, MatSnackBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-shell">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="logo-icon">policy</mat-icon>
          <mat-card-title>Policy Management</mat-card-title>
          <mat-card-subtitle>Sign in to continue</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="login()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="username" />
              <mat-icon matSuffix>email</mat-icon>
              <mat-error>Valid email required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
              <button mat-icon-button matSuffix type="button" (click)="showPwd.set(!showPwd())">
                <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error>Password is required</mat-error>
            </mat-form-field>

            <button mat-flat-button color="primary" class="full-width login-btn"
              type="submit" [disabled]="form.invalid || loading()">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Sign In }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-shell { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%); }
    .login-card { width: 400px; padding: 8px; }
    .logo-icon { font-size: 36px; width: 36px; height: 36px; color: #1565c0; }
    .login-form { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .full-width { width: 100%; }
    .login-btn { height: 44px; font-size: 15px; }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  showPwd = signal(false);

  login(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/policies']);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Invalid credentials', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
