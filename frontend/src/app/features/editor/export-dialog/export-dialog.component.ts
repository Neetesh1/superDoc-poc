import { Component, Inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { PdfExportOptions } from '../../../core/models/policy.models';

interface DialogData { policyId: string; versionId: string; }

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatDividerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Export to PDF</h2>
    <mat-dialog-content>
      <p class="hint">Choose what to include in the exported PDF:</p>
      <mat-checkbox [(ngModel)]="opts.includeTrackedChanges">
        Include tracked changes (shown in margin balloons)
      </mat-checkbox>
      <mat-checkbox [(ngModel)]="opts.includeComments">
        Include comments &amp; replies
      </mat-checkbox>
    </mat-dialog-content>
    <mat-divider />
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="confirm()">Export PDF</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { display: flex; flex-direction: column; gap: 12px; padding: 16px 24px; }
    .hint { color: #666; font-size: 13px; margin: 0; }
  `],
})
export class ExportDialogComponent {
  opts: PdfExportOptions;

  constructor(
    private dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {
    this.opts = {
      includeTrackedChanges: false,
      includeComments: true,
      versionId: data.versionId,
    };
  }

  confirm(): void {
    this.dialogRef.close(this.opts);
  }
}
