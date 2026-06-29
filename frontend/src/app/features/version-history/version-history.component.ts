import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PolicyService } from '../../core/services/policy.service';
import { PolicyVersion, AuditLogEntry } from '../../core/models/policy.models';

@Component({
  selector: 'app-version-history',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatButtonModule, MatIconModule,
    MatToolbarModule, MatCardModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-shell">
      <mat-toolbar color="primary">
        <button mat-icon-button [routerLink]="['/policies']"><mat-icon>arrow_back</mat-icon></button>
        <span>Version History</span>
      </mat-toolbar>

      <div class="page-content">
        <mat-card>
          <mat-card-header><mat-card-title>Versions</mat-card-title></mat-card-header>
          <mat-card-content>
            @if (loading()) {
              <mat-spinner diameter="36" />
            } @else {
              <table mat-table [dataSource]="versions()" class="full-width">
                <ng-container matColumnDef="versionNo">
                  <th mat-header-cell *matHeaderCellDef>#</th>
                  <td mat-cell *matCellDef="let v">V{{ v.versionNo }}</td>
                </ng-container>
                <ng-container matColumnDef="changeSummary">
                  <th mat-header-cell *matHeaderCellDef>Summary</th>
                  <td mat-cell *matCellDef="let v">{{ v.changeSummary ?? '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef>Created</th>
                  <td mat-cell *matCellDef="let v">{{ v.createdAt | date:'medium' }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let v">
                    <button mat-icon-button (click)="downloadDocx(v)"><mat-icon>download</mat-icon></button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['versionNo','changeSummary','createdAt','actions']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['versionNo','changeSummary','createdAt','actions'];"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>Audit Log</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="auditLog()" class="full-width">
              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef>Action</th>
                <td mat-cell *matCellDef="let e">{{ e.action }}</td>
              </ng-container>
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let e">{{ e.user?.name ?? e.userId }}</td>
              </ng-container>
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Time</th>
                <td mat-cell *matCellDef="let e">{{ e.createdAt | date:'medium' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['action','user','createdAt']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['action','user','createdAt'];"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`.page-shell { display: flex; flex-direction: column; min-height: 100vh; } .page-content { padding: 24px; display: flex; flex-direction: column; gap: 20px; } .full-width { width: 100%; }`],
})
export class VersionHistoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly policyService = inject(PolicyService);

  versions = signal<PolicyVersion[]>([]);
  auditLog = signal<AuditLogEntry[]>([]);
  loading = signal(true);
  policyId = '';

  ngOnInit(): void {
    this.policyId = this.route.snapshot.paramMap.get('id')!;
    this.policyService.listVersions(this.policyId).subscribe(v => {
      this.versions.set(v);
      this.loading.set(false);
    });
    this.policyService.getAuditLog(this.policyId).subscribe(log => this.auditLog.set(log));
  }

  downloadDocx(v: PolicyVersion): void {
    this.policyService.getDocx(this.policyId, v.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `policy-v${v.versionNo}.docx`; a.click();
      URL.revokeObjectURL(url);
    });
  }
}
