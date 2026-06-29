import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PolicyService } from '../../../core/services/policy.service';
import { Policy } from '../../../core/models/policy.models';

@Component({
  selector: 'app-new-policy-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatInputModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Create New Policy</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" maxlength="200" />
          <mat-error>Title is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Scope</mat-label>
          <input matInput formControlName="scope" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Jurisdiction</mat-label>
          <input matInput formControlName="jurisdiction" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Upload Initial DOCX (optional)</mat-label>
          <input matInput readonly [value]="selectedFile()?.name ?? ''" placeholder="No file selected" />
        </mat-form-field>
        <button mat-stroked-button type="button" (click)="fileInput.click()">Choose .docx File</button>
        <input #fileInput type="file" accept=".docx" hidden (change)="onFile($event)" />
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || saving()" (click)="create()">
        @if (saving()) { <mat-spinner diameter="18" /> } @else { Create }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form { display: flex; flex-direction: column; gap: 12px; min-width: 360px; } .full-width { width: 100%; }`],
})
export class NewPolicyDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly policyService = inject(PolicyService);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    scope: [''],
    jurisdiction: [''],
  });

  saving = signal(false);
  selectedFile = signal<File | null>(null);

  constructor(private dialogRef: MatDialogRef<NewPolicyDialogComponent>) {}

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectedFile.set(file);
  }

  create(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload = this.form.value as Partial<Policy>;
    this.policyService.create(payload).pipe(
      switchMap(policy => {
        const file = this.selectedFile();
        if (file) {
          return this.policyService.uploadDocx(policy.id, file).pipe(
            switchMap(() => of(policy)),
          );
        }
        return of(policy);
      }),
    ).subscribe({
      next: (policy) => {
        this.saving.set(false);
        this.dialogRef.close(policy);
      },
      error: () => this.saving.set(false),
    });
  }
}
