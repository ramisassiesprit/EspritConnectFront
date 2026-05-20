import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-offer-help-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillEditorComponent],
  templateUrl: './offer-help-modal.component.html'
})
export class OfferHelpModalComponent {
  @Input() isOpen = false;
  @Input() user!: User;
  @Input() helpOptions: string[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() send = new EventEmitter<{ type: string, message: string }>();

  selectedType = '';
  message = '';

  onClose() {
    this.close.emit();
    this.resetForm();
  }

  onSend() {
    if (this.isValid()) {
      this.send.emit({ type: this.selectedType, message: this.message });
      this.onClose();
    }
  }
  
  onDiscard() {
    this.onClose();
  }

  resetForm() {
    this.selectedType = '';
    this.message = '';
  }

  isValid(): boolean {
    return !!this.selectedType && this.message.length > 5;
  }
  
  getTextLength(): number {
    if (!this.message) return 0;
    const div = document.createElement('div');
    div.innerHTML = this.message;
    return div.textContent?.length || div.innerText?.length || 0;
  }
}
