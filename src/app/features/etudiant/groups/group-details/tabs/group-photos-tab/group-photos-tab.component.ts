import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupService } from '../../../../../../core/services/group.service';

@Component({
  selector: 'app-group-photos-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-card photos-card">
      <div class="photos-header">
        <h3>Photos & Media</h3>
        <span class="photos-count">{{ photos().length }} items</span>
      </div>

      <!-- Empty State -->
      <div *ngIf="photos().length === 0" class="empty-photos-state">
        <i class="bi bi-images gallery-icon"></i>
        <h4>No photos in this group yet</h4>
        <p>Pictures and visual updates uploaded in the group feed will appear here automatically.</p>
      </div>

      <!-- Image Grid -->
      <div *ngIf="photos().length > 0" class="photos-grid">
        <div *ngFor="let photo of photos()" class="photo-wrapper">
          <img [src]="photo" alt="Group Media" (click)="openLightbox(photo)">
        </div>
      </div>
    </div>

    <!-- Lightbox Modal Overlay -->
    <div *ngIf="activeLightboxPhoto" class="lightbox-overlay" (click)="closeLightbox()">
      <div class="lightbox-content" (click)="$event.stopPropagation()">
        <img [src]="activeLightboxPhoto" alt="Lightbox Image">
        <button class="lightbox-close" (click)="closeLightbox()">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .photos-card {
      padding: 24px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    .photos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 12px;
    }
    .photos-header h3 {
      margin: 0;
      color: #1c1e21;
      font-size: 16px;
      font-weight: 700;
    }
    .photos-count {
      font-size: 13px;
      color: #65676b;
      font-weight: 600;
    }
    .empty-photos-state {
      text-align: center;
      padding: 48px 24px;
    }
    .gallery-icon {
      font-size: 48px;
      color: #bcc0c4;
      display: block;
      margin-bottom: 12px;
    }
    .empty-photos-state h4 {
      margin: 0 0 6px;
      color: #1c1e21;
      font-size: 15px;
      font-weight: 700;
    }
    .empty-photos-state p {
      margin: 0;
      color: #65676b;
      font-size: 13px;
      line-height: 1.4;
      max-width: 320px;
      margin: 0 auto;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }
    .photo-wrapper {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      background-color: #f9fafb;
    }
    .photo-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .photo-wrapper:hover img {
      transform: scale(1.05);
    }
    
    /* Lightbox modal styles */
    .lightbox-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }
    .lightbox-content {
      position: relative;
      max-width: 90%;
      max-height: 90%;
    }
    .lightbox-content img {
      max-width: 100%;
      max-height: 90vh;
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    }
    .lightbox-close {
      position: absolute;
      top: -40px;
      right: 0;
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      font-weight: bold;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class GroupPhotosTabComponent {
  private groupService = inject(GroupService);
  photos = this.groupService.groupPhotos;

  activeLightboxPhoto: string | null = null;

  openLightbox(photo: string) {
    this.activeLightboxPhoto = photo;
  }

  closeLightbox() {
    this.activeLightboxPhoto = null;
  }
}
