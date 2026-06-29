import { Component, Inject, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PolicyService } from '../../../core/services/policy.service';
import { PolicyVersion } from '../../../core/models/policy.models';

interface DiffResult { htmlDiff: string; v1No: number; v2No: number; }

interface DialogData { policyId: string; }

@Component({
  selector: 'app-compare-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-shell">
      @if (!diffResult()) {
        <!-- ── Step 1: version picker ── -->
        <h2 mat-dialog-title>Compare Versions</h2>
        <mat-dialog-content class="picker-content">
          <p class="hint">Select two versions to compare inline — no file download.</p>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Base version (older)</mat-label>
            <mat-select [(ngModel)]="v1Id">
              @for (v of versions(); track v.id) {
                <mat-option [value]="v.id">V{{ v.versionNo }} — {{ v.createdAt | date:'short' }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Revised version (newer)</mat-label>
            <mat-select [(ngModel)]="v2Id">
              @for (v of versions(); track v.id) {
                <mat-option [value]="v.id">V{{ v.versionNo }} — {{ v.createdAt | date:'short' }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button mat-dialog-close>Cancel</button>
          <button mat-flat-button color="primary"
            [disabled]="!v1Id || !v2Id || v1Id === v2Id || comparing()"
            (click)="compare()">
            @if (comparing()) { <mat-spinner diameter="20" /> } @else { Compare }
          </button>
        </mat-dialog-actions>

      } @else {
        <!-- ── Step 2: inline diff view ── -->
        <div class="diff-header">
          <span class="diff-title">V{{ diffResult()!.v1No }} → V{{ diffResult()!.v2No }}</span>
          <span class="spacer"></span>
          <span class="legend del-legend">Deleted</span>
          <span class="legend ins-legend">Added</span>
          <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
        </div>
        <mat-divider />

        <div class="diff-body" [innerHTML]="safeDiffHtml()"></div>

        <mat-divider />
        <div class="diff-actions">
          <button mat-button (click)="diffResult.set(null)">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
          <span class="spacer"></span>
          <button mat-stroked-button color="warn"
            [disabled]="!!restoring()"
            (click)="restoreVersion(v1Id, diffResult()!.v1No)">
            @if (restoring() === v1Id) {
              <mat-spinner diameter="16" />
            } @else {
              Restore V{{ diffResult()!.v1No }} as Latest
            }
          </button>
          <button mat-flat-button color="primary"
            [disabled]="!!restoring()"
            (click)="restoreVersion(v2Id, diffResult()!.v2No)">
            @if (restoring() === v2Id) {
              <mat-spinner diameter="16" />
            } @else {
              Restore V{{ diffResult()!.v2No }} as Latest
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dialog-shell { display: flex; flex-direction: column; height: 100%; }
    .picker-content { display: flex; flex-direction: column; gap: 12px; padding: 16px 24px; }
    .hint { color: #666; font-size: 13px; margin: 0; }
    .full-width { width: 100%; }

    .diff-header {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px 10px 24px; background: #fff; flex-shrink: 0;
    }
    .diff-title { font-size: 15px; font-weight: 600; }
    .spacer { flex: 1; }
    .legend { border-radius: 4px; padding: 2px 10px; font-size: 12px; font-weight: 500; }
    .del-legend { background: #ffebee; color: #c62828; }
    .ins-legend { background: #e8f5e9; color: #2e7d32; }

    .diff-body {
      flex: 1; overflow-y: auto; padding: 20px 28px;
      font-family: "Georgia", serif; font-size: 15px; line-height: 1.9;
      background: #fafafa; white-space: pre-wrap; min-height: 240px;
    }
    :host ::ng-deep .diff-body del {
      color: #c62828; background: #ffebee;
      text-decoration: line-through; border-radius: 2px; padding: 0 1px;
    }
    :host ::ng-deep .diff-body ins {
      color: #2e7d32; background: #e8f5e9;
      text-decoration: none; border-radius: 2px; padding: 0 1px;
    }

    .diff-actions {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; flex-shrink: 0;
    }
  `],
})
export class CompareDialogComponent implements OnInit {
  private readonly policyService = inject(PolicyService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);

  versions = signal<PolicyVersion[]>([]);
  comparing = signal(false);
  restoring = signal<string>('');
  diffResult = signal<DiffResult | null>(null);
  v1Id = '';
  v2Id = '';

  constructor(
    private dialogRef: MatDialogRef<CompareDialogComponent, PolicyVersion | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  ngOnInit(): void {
    this.policyService.listVersions(this.data.policyId).subscribe(v =>
      this.versions.set(v.slice().sort((a, b) => a.versionNo - b.versionNo)),
    );
  }

  safeDiffHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.diffResult()?.htmlDiff ?? '');
  }

  compare(): void {
    if (!this.v1Id || !this.v2Id || this.v1Id === this.v2Id) return;
    this.comparing.set(true);
    this.policyService.compareVersions(this.data.policyId, this.v1Id, this.v2Id).subscribe({
      next: (result) => {
        this.diffResult.set(result);
        this.comparing.set(false);
      },
      error: () => {
        this.comparing.set(false);
        this.snackBar.open('Comparison failed', 'Dismiss', { duration: 4000 });
      },
    });
  }

  restoreVersion(versionId: string, versionNo: number): void {
    if (this.restoring()) return;
    this.restoring.set(versionId);
    this.policyService.restoreVersion(this.data.policyId, versionId).subscribe({
      next: (version) => {
        this.restoring.set('');
        this.snackBar.open(
          `V${versionNo} restored as latest (V${version.versionNo})`,
          undefined,
          { duration: 3500 },
        );
        this.dialogRef.close(version);
      },
      error: () => {
        this.restoring.set('');
        this.snackBar.open('Restore failed', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
