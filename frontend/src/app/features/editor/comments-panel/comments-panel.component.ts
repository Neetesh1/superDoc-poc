import {
  Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { Comment } from '../../../core/models/policy.models';
import { PolicyService } from '../../../core/services/policy.service';

@Component({
  selector: 'app-comments-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="comments-panel">
      <div class="comments-header">
        <mat-icon>comment</mat-icon>
        <span>Comments</span>
      </div>

      <div class="comments-list">
        @for (comment of comments(); track comment.id) {
          <div class="comment-item">
            <div class="comment-author">{{ comment.author?.name ?? 'Unknown' }}</div>
            <div class="comment-body">{{ comment.body }}</div>
            <div class="comment-time">{{ comment.createdAt | date:'short' }}</div>
            @for (reply of comment.replies ?? []; track reply.id) {
              <div class="comment-reply">
                <div class="comment-author">{{ reply.author?.name ?? 'Unknown' }}</div>
                <div class="comment-body">{{ reply.body }}</div>
              </div>
            }
          </div>
        }
        @if (comments().length === 0) {
          <div class="empty-state">No comments yet.</div>
        }
      </div>

      <div class="comment-input-row">
        <mat-form-field appearance="outline" class="comment-field">
          <textarea
            matInput
            [formControl]="commentCtrl"
            rows="3"
            placeholder="Write a comment..."
            maxlength="2000"></textarea>
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="addComment()" [disabled]="!commentCtrl.valid">
          Add
        </button>
      </div>
    </div>
  `,
  styles: [`
    .comments-panel { display: flex; flex-direction: column; height: 100%; background: #fafafa; }
    .comments-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-weight: 600; background: #eeeeee; }
    .comments-list { flex: 1; overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
    .comment-item { background: #fff; border: 1px solid #ececec; border-radius: 8px; padding: 10px; }
    .comment-author { font-size: 12px; font-weight: 600; color: #424242; }
    .comment-body { font-size: 13px; margin-top: 4px; white-space: pre-wrap; word-break: break-word; }
    .comment-time { font-size: 11px; color: #9e9e9e; margin-top: 6px; }
    .comment-reply { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e0e0e0; }
    .empty-state { font-size: 13px; color: #9e9e9e; text-align: center; margin-top: 20px; }
    .comment-input-row { border-top: 1px solid #e0e0e0; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    .comment-field { width: 100%; }
  `],
})
export class CommentsPanelComponent implements OnInit, OnDestroy {
  @Input({ required: true }) policyId!: string;
  @Input() versionId?: string;

  private readonly policyService = inject(PolicyService);
  private readonly destroy$ = new Subject<void>();

  comments = signal<Comment[]>([]);
  commentCtrl = new FormControl('', [Validators.required, Validators.maxLength(2000)]);

  ngOnInit(): void {
    interval(3000).pipe(
      startWith(0),
      switchMap(() => this.policyService.listComments(this.policyId)),
      takeUntil(this.destroy$),
    ).subscribe(comments => this.comments.set(comments));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addComment(): void {
    const body = this.commentCtrl.value?.trim();
    if (!body) return;
    this.policyService.createComment(this.policyId, { body, versionId: this.versionId }).subscribe(comment => {
      this.comments.update(items => [...items, { ...comment, replies: comment.replies ?? [] }]);
      this.commentCtrl.reset();
    });
  }
}
