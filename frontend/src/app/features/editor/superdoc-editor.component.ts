import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ViewChild, ElementRef, ChangeDetectionStrategy, signal, inject, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { PolicyService } from '../../core/services/policy.service';
import { User, PolicyVersion, PdfExportOptions } from '../../core/models/policy.models';
import { ChatPanelComponent } from './chat-panel/chat-panel.component';
import { PresenceBarComponent } from './presence-bar/presence-bar.component';
import { ExportDialogComponent } from './export-dialog/export-dialog.component';
import { CompareDialogComponent } from './compare-dialog/compare-dialog.component';

declare global {
  interface Window {
    SuperDoc: any;
  }
}

@Component({
  selector: 'app-superdoc-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule,
    MatTooltipModule, MatChipsModule, MatBadgeModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatDialogModule, MatDividerModule,
    ChatPanelComponent, PresenceBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="editor-shell">
      <!-- Top Toolbar -->
      <mat-toolbar class="editor-toolbar" color="primary">
        <button mat-icon-button matTooltip="Back to policies" (click)="backRequested.emit()">
          <mat-icon>arrow_back</mat-icon>
        </button>

        <span class="policy-title">{{ policyTitle() }}</span>

        <app-presence-bar [users]="activeUsers()" class="presence-bar" />

        <span class="spacer"></span>

        <!-- Status badge -->
        <mat-chip [class]="'status-chip status-' + policyStatus()">
          {{ policyStatus() | titlecase }}
        </mat-chip>

        @if (isReadOnlyMode()) {
          <mat-chip class="readonly-chip">View only</mat-chip>
        } @else if (isReviewerMode()) {
          <mat-chip class="reviewer-chip">Reviewer — suggestions tracked</mat-chip>
          <mat-chip class="autosave-chip" [class.saving]="autoSaveState() === 'saving'" [class.error]="autoSaveState() === 'error'">
            {{ autoSaveLabel() }}
          </mat-chip>
        } @else {
          <mat-chip class="autosave-chip" [class.saving]="autoSaveState() === 'saving'" [class.error]="autoSaveState() === 'error'">
            {{ autoSaveLabel() }}
          </mat-chip>
        }

        <mat-divider vertical class="toolbar-divider" />

        <!-- Track changes toggle (editor/linguistic only) -->
        @if (canTrackChanges()) {
          <button mat-icon-button
            [color]="trackChangesEnabled() ? 'accent' : ''"
            matTooltip="Toggle Track Changes"
            (click)="toggleTrackChanges()">
            <mat-icon>track_changes</mat-icon>
          </button>
        }

        <!-- Accept / Reject all (editor/approver) -->
        @if (canAcceptReject()) {
          <button mat-button [matMenuTriggerFor]="revisionsMenu">
            <mat-icon>done_all</mat-icon> Revisions
          </button>
          <mat-menu #revisionsMenu>
            <button mat-menu-item (click)="acceptAllRevisions()">
              <mat-icon color="primary">check_circle</mat-icon> Accept All
            </button>
            <button mat-menu-item (click)="rejectAllRevisions()">
              <mat-icon color="warn">cancel</mat-icon> Reject All
            </button>
          </mat-menu>
        }

        <!-- Export -->
        <button mat-icon-button matTooltip="Export" [matMenuTriggerFor]="exportMenu">
          <mat-icon>download</mat-icon>
        </button>
        <mat-menu #exportMenu>
          <button mat-menu-item (click)="downloadDocx()">
            <mat-icon>description</mat-icon> Download .docx
          </button>
          <button mat-menu-item (click)="openExportDialog()">
            <mat-icon>picture_as_pdf</mat-icon> Export to PDF…
          </button>
        </mat-menu>

        <!-- Compare -->
        <button mat-icon-button matTooltip="Compare versions" (click)="openCompareDialog()">
          <mat-icon>compare</mat-icon>
        </button>

        <!-- Version history -->
        <button mat-icon-button matTooltip="Version history" (click)="showVersionHistory()">
          <mat-icon>history</mat-icon>
        </button>

        <!-- Snapshot -->
        @if (canEdit()) {
          <button mat-icon-button matTooltip="Save snapshot" (click)="saveSnapshot()">
            <mat-icon>save</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Upload DOCX" (click)="docxFileInput.click()">
            <mat-icon>upload_file</mat-icon>
          </button>
          <input #docxFileInput type="file" accept=".docx" hidden (change)="onDocxUpload($event)" />
        }

        <!-- Chat toggle -->
        <button mat-icon-button
          [color]="chatOpen() ? 'accent' : ''"
          matTooltip="In-document chat"
          (click)="toggleChat()">
          <mat-icon [matBadge]="unreadMessages()" matBadgeColor="warn"
            [matBadgeHidden]="unreadMessages() === 0" aria-hidden="false">chat</mat-icon>
        </button>
      </mat-toolbar>

      <!-- Editor + Chat layout -->
      <div class="editor-content-row">
        <!-- SuperDoc mount point -->
        <div class="editor-container" [class.chat-open]="chatOpen()">
          <!-- SuperDoc toolbar renders here -->
          <div #sdToolbar id="superdoc-toolbar" class="superdoc-toolbar-mount"></div>
          @if (loading()) {
            <div class="spinner-overlay">
              <mat-spinner diameter="48" />
              <p>Loading document…</p>
            </div>
          }
          <div #editorContainer id="superdoc-editor" class="superdoc-mount"></div>
        </div>

        <!-- Chat panel -->
        @if (chatOpen()) {
          <app-chat-panel
            [policyId]="policyId"
            [currentUser]="currentUser()!"
            class="chat-sidebar"
            (unreadCount)="unreadMessages.set($event)" />
        }
      </div>
    </div>
  `,
  styles: [`
    .editor-shell { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    .editor-toolbar { gap: 8px; padding: 0 16px; flex-shrink: 0; background-color: #1565c0 !important; color: white !important; }
    .editor-toolbar button, .editor-toolbar mat-icon { color: white !important; }
    .editor-toolbar .mdc-button__label { color: white !important; }
    .policy-title { font-size: 16px; font-weight: 500; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .presence-bar { margin: 0 12px; }
    .spacer { flex: 1; }
    .toolbar-divider { height: 28px; margin: 0 8px; }
    .editor-content-row { display: flex; flex: 1; overflow: hidden; }
    .editor-container { flex: 1; overflow: auto; position: relative; background: #f5f5f5; display: flex; flex-direction: column; }
    .superdoc-toolbar-mount { flex-shrink: 0; }
    .superdoc-mount { flex: 1; }
    .spinner-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,.8); z-index: 10; gap: 16px; }
    .chat-sidebar { width: 320px; flex-shrink: 0; border-left: 1px solid #e0e0e0; }
    .status-chip { font-size: 11px; height: 24px; }
    .status-draft { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-in_review { background: #fff9c4 !important; color: #f57f17 !important; }
    .status-published { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .autosave-chip { font-size: 11px; height: 24px; background: #e8f5e9 !important; color: #2e7d32 !important; }
    .autosave-chip.saving { background: #e3f2fd !important; color: #1565c0 !important; }
    .autosave-chip.error { background: #ffebee !important; color: #c62828 !important; }
    .readonly-chip { font-size: 11px; height: 24px; background: #fff3e0 !important; color: #e65100 !important; }
    .reviewer-chip { font-size: 11px; height: 24px; background: #e8f5e9 !important; color: #2e7d32 !important; }
  `],
})
export class SuperdocEditorComponent implements OnInit, OnDestroy {
  @Input({ required: true }) policyId!: string;
  @Input() versionId: string = '';
  @Input() policyTitle = signal('Untitled Policy');
  @Input() policyStatus = signal<string>('draft');
  @Output() documentSaved = new EventEmitter<void>();
  @Output() versionCreated = new EventEmitter<PolicyVersion>();
  @Output() backRequested = new EventEmitter<void>();

  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('sdToolbar', { static: true }) sdToolbar!: ElementRef<HTMLDivElement>;

  private readonly auth: AuthService = inject(AuthService);
  private readonly policyService: PolicyService = inject(PolicyService);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly zone: NgZone = inject(NgZone);

  // Signals
  loading = signal(true);
  trackChangesEnabled = signal(false);
  chatOpen = signal(false);
  activeUsers = signal<User[]>([]);
  unreadMessages = signal(0);
  currentUser = signal<User | null>(null);
  autoSaveState = signal<'saved' | 'pending' | 'saving' | 'error'>('saved');

  private superdoc: any = null;
  private ydoc: Y.Doc | null = null;
  private provider: WebsocketProvider | null = null;
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private autoSaveInFlight = false;
  private autoSavePending = false;
  private readonly autoSaveDelayMs = 1500;

  ngOnInit(): void {
    this.currentUser.set(this.auth.currentUser);
    this.initCollaboration();
    this.loadAndMountEditor();
  }

  ngOnDestroy(): void {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.superdoc?.destroy?.();
    this.provider?.destroy();
    this.ydoc?.destroy();
  }

  private initCollaboration(): void {
    this.ydoc = new Y.Doc();
    // All users on the same policy share one room regardless of version
    const roomName = `policy-${this.policyId}`;

    this.provider = new WebsocketProvider(environment.wsUrl, roomName, this.ydoc, {
      params: { token: this.auth.getToken() ?? '' },
    });

    const user = this.auth.currentUser!;
    // Include `id` so Angular @for can track uniquely
    this.provider.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.color,
      role: user.role,
    });

    const refreshUsers = () => {
      const states = Array.from(this.provider!.awareness.getStates().values());
      const users: User[] = states
        .filter((s: any) => s?.user?.id)
        .map((s: any) => s.user as User)
        // deduplicate by user id (same user in multiple tabs)
        .filter((u, idx, arr) => arr.findIndex(x => x.id === u.id) === idx);
      this.zone.run(() => this.activeUsers.set(users));
    };

    // Fire on any awareness change (peer joins, leaves, updates)
    this.provider.awareness.on('change', refreshUsers);
    // Also fire once the WS connection syncs so the current user appears immediately
    this.provider.on('sync', refreshUsers);
    // Populate current user right away (no need to wait for an event)
    refreshUsers();
  }

  private async loadAndMountEditor(): Promise<void> {
    try {
      // Fetch the DOCX blob only if a version exists; otherwise start blank
      let file: File | undefined;
      if (this.versionId) {
        const blob = await this.policyService.getDocx(this.policyId, this.versionId).toPromise();
        file = new File([blob!], 'policy.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      }

      const { SuperDoc } = await import('@harbour-enterprises/superdoc');

      const user = this.auth.currentUser!;
      // viewer is fully read-only; reviewer/linguistic_reviewer get suggestion (track-changes) mode
      const isReadOnly = this.auth.hasRole('viewer');
      const forceTrackChanges = this.auth.hasRole('reviewer', 'linguistic_reviewer', 'external_collaborator');
      const documentMode = isReadOnly ? 'viewing' : (forceTrackChanges ? 'suggesting' : 'editing');
      const zone = this.zone;
      const self = this;

      zone.runOutsideAngular(() => {
        self.superdoc = new (SuperDoc as any)({
          selector: '#superdoc-editor',
          toolbar: '#superdoc-toolbar',
          ...(file ? { document: file } : {}),
          documentMode,
          licenseKey: environment.superdocLicenseKey,
          user: {
            id: user.id,
            name: user.name,
            color: user.color,
            email: user.email,
            role: user.role,
          },
          onReady: () => {
            // Upgrade to collaboration AFTER document is loaded so DOCX content is visible
            try {
              self.superdoc.upgradeToCollaboration?.({ ydoc: self.ydoc, provider: self.provider });
            } catch { /* graceful fallback if API unavailable */ }
            zone.run(() => self.loading.set(false));
          },
          onChange: () => {
            if (documentMode !== 'viewing') {
              zone.run(() => self.scheduleAutoSave());
            }
          },
        } as any);
      });
    } catch (err) {
      this.zone.run(() => {
        this.loading.set(false);
        this.snackBar.open('Failed to load document', 'Dismiss', { duration: 4000 });
      });
    }
  }

  // --- Toolbar actions ---

  toggleTrackChanges(): void {
    if (!this.superdoc) return;
    const next = !this.trackChangesEnabled();
    this.trackChangesEnabled.set(next);
    try {
      this.superdoc.setDocumentMode?.(next ? 'suggesting' : 'editing');
    } catch { /* graceful fallback */ }
  }

  private enableTrackChanges(enabled: boolean): void {
    if (!this.superdoc) return;
    // SuperDoc track changes protection mode
    this.superdoc.editor?.setEditable(!enabled ? true : false);
    // Toggle suggestion mode via protection API
    try {
      if (enabled) {
        this.superdoc.editor?.doc?.protection?.setEditingRestriction({ type: 'tracked-changes' });
      } else {
        this.superdoc.editor?.doc?.protection?.clearEditingRestriction();
      }
    } catch { /* graceful fallback */ }
  }

  async acceptAllRevisions(): Promise<void> {
    if (!this.superdoc) return;
    try {
      const changes = await this.superdoc.editor.doc.trackChanges.list();
      for (const change of changes) {
        await this.superdoc.editor.doc.trackChanges.decide(change.id, 'accept');
      }
      this.snackBar.open(`Accepted ${changes.length} revision(s)`, undefined, { duration: 2500 });
    } catch {
      this.snackBar.open('Could not accept revisions', 'Dismiss', { duration: 3000 });
    }
  }

  async rejectAllRevisions(): Promise<void> {
    if (!this.superdoc) return;
    try {
      const changes = await this.superdoc.editor.doc.trackChanges.list();
      for (const change of changes) {
        await this.superdoc.editor.doc.trackChanges.decide(change.id, 'reject');
      }
      this.snackBar.open(`Rejected ${changes.length} revision(s)`, undefined, { duration: 2500 });
    } catch {
      this.snackBar.open('Could not reject revisions', 'Dismiss', { duration: 3000 });
    }
  }

  async downloadDocx(): Promise<void> {
    if (!this.superdoc) return;
    try {
      await this.superdoc.export?.({
        exportType: ['docx'],
        exportedName: 'SuperDoc',
        triggerDownload: true,
      });
    } catch {
      this.snackBar.open('Export failed', 'Dismiss', { duration: 3000 });
    }
  }

  openExportDialog(): void {
    const ref = this.dialog.open(ExportDialogComponent, {
      width: '420px',
      data: { policyId: this.policyId, versionId: this.versionId },
    });
    ref.afterClosed().subscribe((opts: PdfExportOptions | undefined) => {
      if (opts) this.exportPdf(opts);
    });
  }

  private async exportPdf(opts: PdfExportOptions): Promise<void> {
    const snack = this.snackBar.open('Generating PDF…', undefined, { duration: 60000 });
    try {
      const blob = await this.policyService.exportPdf(this.policyId, opts).toPromise();
      this.triggerDownload(blob!, 'policy.pdf', 'application/pdf');
      snack.dismiss();
      this.snackBar.open('PDF downloaded', undefined, { duration: 2500 });
    } catch {
      snack.dismiss();
      this.snackBar.open('PDF export failed', 'Dismiss', { duration: 4000 });
    }
  }

  openCompareDialog(): void {
    const ref = this.dialog.open(CompareDialogComponent, {
      width: '820px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { policyId: this.policyId },
    });
    ref.afterClosed().subscribe((restored: PolicyVersion | undefined) => {
      if (!restored) return;
      this.versionId = restored.id;
      this.versionCreated.emit(restored);
      void this.reloadWithVersionId(restored.id);
    });
  }

  private async reloadWithVersionId(versionId: string): Promise<void> {
    const snack = this.snackBar.open('Loading restored version…', undefined, { duration: 30000 });
    try {
      const blob = await this.policyService.getDocx(this.policyId, versionId).toPromise();
      const file = new File([blob!], 'policy.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      this.superdoc?.destroy?.();
      this.superdoc = null;
      snack.dismiss();
      await this.remountWithFile(file);
    } catch {
      snack.dismiss();
      this.snackBar.open('Failed to load restored version', 'Dismiss', { duration: 4000 });
    }
  }

  showVersionHistory(): void {
    // Navigation handled by parent via router or separate panel
    this.snackBar.open('Open Version History in the sidebar', undefined, { duration: 2500 });
  }

  async onDocxUpload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const snack = this.snackBar.open('Uploading document…', undefined, { duration: 30000 });
    try {
      const version = await this.policyService.uploadDocx(this.policyId, file).toPromise();
      snack.dismiss();
      this.snackBar.open('Document uploaded — reloading editor…', undefined, { duration: 2000 });
      this.versionId = version!.id;
      this.versionCreated.emit(version!);
      // Destroy and remount editor with the newly uploaded file
      this.superdoc?.destroy?.();
      this.superdoc = null;
      await this.remountWithFile(file);
    } catch {
      snack.dismiss();
      this.snackBar.open('Upload failed', 'Dismiss', { duration: 4000 });
    }
    // Reset input so same file can be re-uploaded
    (event.target as HTMLInputElement).value = '';
  }

  private async remountWithFile(file: File): Promise<void> {
    this.loading.set(true);
    try {
      const { SuperDoc } = await import('@harbour-enterprises/superdoc');
      const toolbarEl = this.sdToolbar.nativeElement;
      const user = this.auth.currentUser!;
      const isReadOnly = this.auth.hasRole('viewer');
      const forceTrackChanges = this.auth.hasRole('reviewer', 'linguistic_reviewer', 'external_collaborator');
      const documentMode = isReadOnly ? 'viewing' : (forceTrackChanges ? 'suggesting' : 'editing');
      const zone = this.zone;
      const self = this;
      zone.runOutsideAngular(() => {
        self.superdoc = new (SuperDoc as any)({
          selector: '#superdoc-editor',
          toolbar: '#superdoc-toolbar',
          document: file,
          documentMode,
          licenseKey: environment.superdocLicenseKey,
          user: {
            id: user.id,
            name: user.name,
            color: user.color,
            email: user.email,
            role: user.role,
          },
          onReady: () => {
            // Upgrade to collaboration AFTER document is loaded so DOCX content is visible
            try {
              self.superdoc.upgradeToCollaboration?.({ ydoc: self.ydoc, provider: self.provider });
            } catch { /* graceful fallback if API unavailable */ }
            zone.run(() => self.loading.set(false));
          },
          onChange: () => {
            if (documentMode !== 'viewing') {
              zone.run(() => self.scheduleAutoSave());
            }
          },
        } as any);
      });
    } catch {
      this.loading.set(false);
      this.snackBar.open('Failed to load document', 'Dismiss', { duration: 4000 });
    }
  }

  async saveSnapshot(): Promise<void> {
    if (!this.superdoc) return;

    const summary = prompt('Snapshot summary (optional):') ?? '';
    const snack = this.snackBar.open('Saving document…', undefined, { duration: 30000 });
    try {
      const blob = await this.exportDocxBlob();
      const file = new File([blob], `policy-${this.policyId}-${Date.now()}.docx`, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const version = await this.policyService.uploadDocx(this.policyId, file, summary).toPromise();
      snack.dismiss();
      this.snackBar.open(`Snapshot V${version!.versionNo} saved`, undefined, { duration: 3000 });
      this.versionCreated.emit(version!);
      this.documentSaved.emit();
    } catch {
      snack.dismiss();
      this.snackBar.open('Snapshot failed', 'Dismiss', { duration: 3000 });
    }
  }

  private scheduleAutoSave(): void {
    this.autoSavePending = true;
    this.autoSaveState.set('pending');
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = null;
      void this.flushAutoSave();
    }, this.autoSaveDelayMs);
  }

  private async flushAutoSave(): Promise<void> {
    if (!this.superdoc || !this.autoSavePending) return;
    if (this.autoSaveInFlight) return;

    this.autoSaveInFlight = true;
    this.autoSavePending = false;
    this.autoSaveState.set('saving');
    try {
      const blob = await this.exportDocxBlob();
      const file = new File([blob], `policy-${this.policyId}-autosave.docx`, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const version = await this.policyService.saveCurrentDocx(this.policyId, file, this.versionId).toPromise();
      if (version?.id) {
        this.versionId = version.id;
        this.versionCreated.emit(version);
      }
      this.documentSaved.emit();
      this.autoSaveState.set('saved');
    } catch {
      this.autoSaveState.set('error');
    } finally {
      this.autoSaveInFlight = false;
      if (this.autoSavePending) void this.flushAutoSave();
    }
  }

  private async exportDocxBlob(): Promise<Blob> {
    return this.superdoc.export?.({
      exportType: ['docx'],
      exportedName: 'SuperDoc',
      triggerDownload: false,
    });
  }

  autoSaveLabel(): string {
    switch (this.autoSaveState()) {
      case 'pending': return 'Unsaved changes';
      case 'saving': return 'Saving...';
      case 'error': return 'Autosave failed';
      default: return 'Saved';
    }
  }

  toggleChat(): void {
    this.chatOpen.set(!this.chatOpen());
    if (this.chatOpen()) this.unreadMessages.set(0);
  }

  // --- Role helpers ---
  // Track-changes toggle is only available for editors/approvers (reviewers always have it forced on)
  canTrackChanges(): boolean {
    return this.auth.hasRole('editor', 'approver');
  }

  // Only viewer is truly read-only
  isReadOnlyMode(): boolean {
    return this.auth.hasRole('viewer');
  }

  // Reviewer / linguistic_reviewer are in suggestion (forced track-changes) mode
  isReviewerMode(): boolean {
    return this.auth.hasRole('reviewer', 'linguistic_reviewer', 'external_collaborator');
  }

  canEdit(): boolean {
    return this.auth.canEdit();
  }

  canUpload(): boolean {
    return this.auth.canEdit() || this.auth.canApprove();
  }

  canAcceptReject(): boolean {
    return this.auth.canAcceptReject();
  }

  private triggerDownload(blob: Blob, filename: string, mimeType: string): void {
    const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
