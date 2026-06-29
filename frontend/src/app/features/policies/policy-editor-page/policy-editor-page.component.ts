import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap, tap } from 'rxjs/operators';
import { PolicyService } from '../../../core/services/policy.service';
import { Policy, PolicyVersion } from '../../../core/models/policy.models';
import { SuperdocEditorComponent } from '../../editor/superdoc-editor.component';

@Component({
  selector: 'app-policy-editor-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatProgressSpinnerModule, MatSnackBarModule, SuperdocEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else if (policy()) {
      <app-superdoc-editor
        [policyId]="policy()!.id"
        [versionId]="currentVersion()?.id ?? ''"
        [policyTitle]="titleSignal"
        [policyStatus]="statusSignal"
        (backRequested)="goBack()"
        (versionCreated)="onVersionCreated($event)" />
    } @else {
      <div class="center"><p>Policy not found.</p></div>
    }
  `,
  styles: [`.center { display: flex; justify-content: center; align-items: center; height: 100vh; }`],
})
export class PolicyEditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly policyService = inject(PolicyService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  policy = signal<Policy | null>(null);
  currentVersion = signal<PolicyVersion | null>(null);
  loading = signal(true);
  titleSignal = signal('');
  statusSignal = signal('');

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id')!;
        return this.policyService.get(id).pipe(
          tap(p => {
            this.policy.set(p);
            this.titleSignal.set(p.title);
            this.statusSignal.set(p.status);
          }),
          switchMap(p => this.policyService.listVersions(p.id)),
        );
      }),
    ).subscribe({
      next: (versions) => {
        const latest = versions.sort((a, b) => b.versionNo - a.versionNo)[0];
        this.currentVersion.set(latest ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load policy', 'Dismiss', { duration: 4000 });
        this.router.navigate(['/policies']);
      },
    });
  }

  onVersionCreated(v: PolicyVersion): void {
    this.currentVersion.set(v);
  }

  goBack(): void {
    this.router.navigate(['/policies']);
  }
}
