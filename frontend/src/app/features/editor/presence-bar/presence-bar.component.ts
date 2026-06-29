import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../../../core/models/policy.models';

@Component({
  selector: 'app-presence-bar',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="presence-bar">
      @for (user of visibleUsers; track user.id) {
        <div class="avatar" [style.background]="user.color"
          [matTooltip]="user.name + ' (' + user.role + ')'">
          {{ initials(user.name) }}
        </div>
      }
      @if (overflow > 0) {
        <div class="avatar overflow-badge" matTooltip="{{ overflow }} more users">
          +{{ overflow }}
        </div>
      }
    </div>
  `,
  styles: [`
    .presence-bar { display: flex; align-items: center; gap: -8px; }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; font-size: 12px;
      font-weight: 600; color: #fff; border: 2px solid #fff;
      margin-left: -8px; cursor: default; flex-shrink: 0;
    }
    .overflow-badge { background: #757575 !important; }
  `],
})
export class PresenceBarComponent {
  @Input() users: User[] = [];

  private readonly MAX_VISIBLE = 5;

  get visibleUsers(): User[] {
    return this.users.slice(0, this.MAX_VISIBLE);
  }

  get overflow(): number {
    return Math.max(0, this.users.length - this.MAX_VISIBLE);
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
