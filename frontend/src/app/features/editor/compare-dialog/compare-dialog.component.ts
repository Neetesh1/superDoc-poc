import { Component, Inject, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PolicyService } from '../../../core/services/policy.service';
import { PolicyVersion } from '../../../core/models/policy.models';

interface DialogData { policyId: string; }

@Component({
  selector: 'app-compare-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatSelectModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Compare Versions</h2>
    <mat-dialog-content>
      <p class="hint">Select two versions to generate a redline comparison (.docx):</p>
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
      <button mat-flat-button color="primary" [disabled]="!v1Id || !v2Id || comparing()" (click)="compare()">
        @if (comparing()) { <mat-spinner diameter="20" /> } @else { Compare }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.hint { color: #666; font-size: 13px; } .full-width { width: 100%; }`],
})
export class CompareDialogComponent implements OnInit {
  private readonly policyService = inject(PolicyService);
  private readonly snackBar = inject(MatSnackBar);

  versions = signal<PolicyVersion[]>([]);
  comparing = signal(false);
  v1Id = '';
  v2Id = '';

  constructor(
    private dialogRef: MatDialogRef<CompareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  ngOnInit(): void {
    this.policyService.listVersions(this.data.policyId).subscribe(v => this.versions.set(v));
  }

  async compare(): Promise<void> {
    if (!this.v1Id || !this.v2Id) return;
    this.comparing.set(true);
    this.policyService.compareVersions(this.data.policyId, this.v1Id, this.v2Id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
        const a = document.createElement('a');
        a.href = url; a.download = 'comparison-redline.docx'; a.click();
        URL.revokeObjectURL(url);
        this.comparing.set(false);
        this.dialogRef.close();
      },
      error: () => {
        this.comparing.set(false);
        this.snackBar.open('Comparison failed', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
