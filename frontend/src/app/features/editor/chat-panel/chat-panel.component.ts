import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  signal, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpClient } from '@angular/common/http';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';

import { ChatMessage, User } from '../../../core/models/policy.models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatListModule, MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-panel">
      <div class="chat-header">
        <mat-icon>chat</mat-icon>
        <span>Document Chat</span>
      </div>

      <div class="messages-list" #scrollContainer>
        @for (msg of messages(); track msg.id) {
          <div class="message" [class.own]="msg.authorId === currentUser.id">
            <div class="msg-avatar" [style.background]="msg.author?.color ?? '#9e9e9e'">
              {{ initials(msg.author?.name ?? '?') }}
            </div>
            <div class="msg-body">
              <div class="msg-author">{{ msg.author?.name ?? 'Unknown' }}</div>
              <div class="msg-text" [innerHTML]="highlightMentions(msg.body)"></div>
              <div class="msg-time">{{ msg.createdAt | date:'shortTime' }}</div>
            </div>
          </div>
        }
        @if (messages().length === 0) {
          <p class="empty-state">No messages yet. Start the conversation!</p>
        }
      </div>

      <div class="chat-input-row">
        <mat-form-field appearance="outline" class="chat-field">
          <input matInput [formControl]="messageCtrl" placeholder="Message… (@mention)"
            (keydown.enter)="sendMessage()" maxlength="2000" />
        </mat-form-field>
        <button mat-icon-button color="primary" (click)="sendMessage()" [disabled]="!messageCtrl.valid">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-panel { display: flex; flex-direction: column; height: 100%; background: #fafafa; }
    .chat-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background: #eeeeee; font-weight: 600; border-bottom: 1px solid #e0e0e0; }
    .messages-list { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
    .message { display: flex; gap: 8px; }
    .message.own { flex-direction: row-reverse; }
    .msg-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; font-weight: 600; flex-shrink: 0; }
    .msg-body { max-width: 80%; background: #fff; border-radius: 8px; padding: 8px 10px; box-shadow: 0 1px 2px rgba(0,0,0,.1); }
    .message.own .msg-body { background: #e3f2fd; }
    .msg-author { font-size: 11px; color: #757575; margin-bottom: 2px; }
    .msg-text { font-size: 13px; word-break: break-word; }
    .msg-time { font-size: 10px; color: #bdbdbd; text-align: right; margin-top: 4px; }
    .mention { color: #1565c0; font-weight: 600; }
    .empty-state { color: #9e9e9e; font-size: 13px; text-align: center; margin-top: 24px; }
    .chat-input-row { display: flex; align-items: center; padding: 8px; border-top: 1px solid #e0e0e0; gap: 8px; }
    .chat-field { flex: 1; }
  `],
})
export class ChatPanelComponent implements OnInit, OnDestroy {
  @Input({ required: true }) policyId!: string;
  @Input({ required: true }) currentUser!: User;
  @Output() unreadCount = new EventEmitter<number>();

  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();

  messages = signal<ChatMessage[]>([]);
  messageCtrl = new FormControl('', [Validators.required, Validators.maxLength(2000)]);

  ngOnInit(): void {
    // Poll every 3 seconds for new messages (replace with WebSocket sub-channel in prod)
    interval(3000).pipe(
      startWith(0),
      switchMap(() => this.http.get<ChatMessage[]>(`${environment.apiUrl}/policies/${this.policyId}/chat`)),
      takeUntil(this.destroy$),
    ).subscribe(msgs => this.messages.set(msgs));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage(): void {
    const body = this.messageCtrl.value?.trim();
    if (!body) return;
    const mentions = this.extractMentions(body);
    this.http.post<ChatMessage>(`${environment.apiUrl}/policies/${this.policyId}/chat`, { body, mentions })
      .subscribe(msg => {
        this.messages.update(msgs => [...msgs, msg]);
        this.messageCtrl.reset();
      });
  }

  highlightMentions(text: string): string {
    return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private extractMentions(text: string): string[] {
    return (text.match(/@\w+/g) ?? []).map(m => m.slice(1));
  }
}
