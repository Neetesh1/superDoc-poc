import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';

import { PolicyService } from '../../../core/services/policy.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Policy, PolicyStatus } from '../../../core/models/policy.models';
import { NewPolicyDialogComponent } from '../new-policy-dialog/new-policy-dialog.component';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatButtonModule, MatIconModule,
    MatToolbarModule, MatChipsModule, MatMenuModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDialogModule, MatSnackBarModule, MatCardModule, MatBadgeModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-shell">
      <!-- App header -->
      <mat-toolbar color="primary" class="app-header">
        <mat-icon>policy</mat-icon>
        <span class="app-title">Policy Management</span>
        <span class="spacer"></span>
        <span class="user-label">{{ currentUser?.name }}</span>
        <button mat-icon-button matTooltip="Logout" (click)="logout()">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <!-- Content -->
      <div class="page-content">
        <!-- Summary cards -->
        <div class="summary-row">
          @for (card of summaryCards(); track card.label) {
            <mat-card class="summary-card" [class]="'card-' + card.color">
              <mat-card-content>
                <div class="card-value">{{ card.value }}</div>
                <div class="card-label">{{ card.label }}</div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Policy table -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Policies</mat-card-title>
            <span class="spacer"></span>
            <button mat-flat-button color="primary" (click)="openNewDialog()">
              <mat-icon>add</mat-icon> New Policy
            </button>
          </mat-card-header>
          <mat-card-content>
            @if (loading()) {
              <div class="center"><mat-spinner diameter="40" /></div>
            } @else {
              <table mat-table [dataSource]="policies()" class="policy-table">
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Title</th>
                  <td mat-cell *matCellDef="let p">
                    <a [routerLink]="['/policies', p.id]" class="policy-link">{{ p.title }}</a>
                  </td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let p">
                    <mat-chip [class]="'status-chip status-' + p.status">{{ p.status | titlecase }}</mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="jurisdiction">
                  <th mat-header-cell *matHeaderCellDef>Jurisdiction</th>
                  <td mat-cell *matCellDef="let p">{{ p.jurisdiction ?? '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="updatedAt">
                  <th mat-header-cell *matHeaderCellDef>Last Updated</th>
                  <td mat-cell *matCellDef="let p">{{ p.updatedAt | date:'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let p">
                    <button mat-icon-button [matMenuTriggerFor]="rowMenu" [matMenuTriggerData]="{policy: p}">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              <mat-menu #rowMenu>
                <ng-template matMenuContent let-policy="policy">
                  <button mat-menu-item [routerLink]="['/policies', policy.id]">
                    <mat-icon>edit</mat-icon> Open Editor
                  </button>
                  <button mat-menu-item (click)="exportPdf(policy.id)">
                    <mat-icon>picture_as_pdf</mat-icon> Export PDF
                  </button>
                  <button mat-menu-item [routerLink]="['/policies', policy.id, 'history']">
                    <mat-icon>history</mat-icon> Version History
                  </button>
                </ng-template>
              </mat-menu>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-shell { display: flex; flex-direction: column; min-height: 100vh; background: #f5f5f5; }
    .app-header { gap: 12px; }
    .app-title { font-size: 18px; font-weight: 600; }
    .spacer { flex: 1; }
    .user-label { font-size: 14px; }
    .page-content { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .summary-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
    .summary-card { cursor: default; }
    .card-value { font-size: 32px; font-weight: 700; }
    .card-label { font-size: 12px; color: #666; margin-top: 4px; }
    .card-blue .card-value { color: #1565c0; }
    .card-orange .card-value { color: #e65100; }
    .card-green .card-value { color: #2e7d32; }
    .card-purple .card-value { color: #6a1b9a; }
    .policy-table { width: 100%; }
    .policy-link { color: #1565c0; text-decoration: none; font-weight: 500; }
    .policy-link:hover { text-decoration: underline; }
    .status-chip { font-size: 11px; }
    .status-draft { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-in_review { background: #fff9c4 !important; color: #f57f17 !important; }
    .status-published { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-pending_approval { background: #fce4ec !important; color: #c62828 !important; }
    .center { display: flex; justify-content: center; padding: 40px; }
  `],
})
export class PolicyListComponent implements OnInit {
  private readonly policyService = inject(PolicyService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  policies = signal<Policy[]>([]);
  loading = signal(true);
  displayedColumns = ['title', 'status', 'jurisdiction', 'updatedAt', 'actions'];
  currentUser = this.auth.currentUser;

  summaryCards = signal([
    { label: 'Total', value: 0, color: 'blue' },
    { label: 'In Review', value: 0, color: 'orange' },
    { label: 'Published', value: 0, color: 'green' },
    { label: 'Pending Approval', value: 0, color: 'purple' },
  ]);

  ngOnInit(): void {
    this.policyService.list().subscribe({
      next: (list) => {
        this.policies.set(list);
        this.loading.set(false);
        this.summaryCards.set([
          { label: 'Total', value: list.length, color: 'blue' },
          { label: 'In Review', value: list.filter(p => p.status === 'in_review').length, color: 'orange' },
          { label: 'Published', value: list.filter(p => p.status === 'published').length, color: 'green' },
          { label: 'Pending Approval', value: list.filter(p => p.status === 'pending_approval').length, color: 'purple' },
        ]);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load policies', 'Dismiss', { duration: 4000 });
      },
    });
  }

  openNewDialog(): void {
    const ref = this.dialog.open(NewPolicyDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((created: Policy | undefined) => {
      if (created) this.policies.update(p => [created, ...p]);
    });
  }

  exportPdf(policyId: string): void {
    this.snackBar.open('Open the policy editor and use the Export menu', undefined, { duration: 3000 });
  }

  logout(): void {
    this.auth.logout();
  }
}
