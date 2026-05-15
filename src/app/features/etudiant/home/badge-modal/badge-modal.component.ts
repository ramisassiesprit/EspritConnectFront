import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Badge } from '../../../../core/models/user.model';

@Component({
  selector: 'app-badge-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge-modal.component.html',
  styleUrls: ['./badge-modal.component.css']
})
export class BadgeModalComponent {
  @Input() badges: Badge[] = [];
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
