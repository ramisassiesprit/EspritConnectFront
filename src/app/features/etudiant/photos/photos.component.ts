import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../../core/services/post.service';
import { PostDTO } from '../../../core/models/post.model';
import { environment } from '../../../../environments/environment';

interface GalleryPhoto {
  url: string;
  postId: string;
  authorName: string;
  authorAvatar?: string;
  postContent: string;
  createdAt: string;
  postType: string;
}

@Component({
  selector: 'app-photos',
  imports: [CommonModule, FormsModule],
  templateUrl: './photos.component.html',
  styleUrl: './photos.component.css'
})
export class PhotosComponent implements OnInit {
  private postService = inject(PostService);

  posts = signal<PostDTO[]>([]);
  searchQuery = signal('');
  sortBy: 'newest' | 'oldest' = 'newest';
  activeLightbox: GalleryPhoto | null = null;

  private getFullUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const base = environment.apiUrl;
    return base + (url.startsWith('/') ? url.substring(1) : url);
  }

  allPhotos = computed<GalleryPhoto[]>(() => {
    const photos: GalleryPhoto[] = [];
    for (const post of this.posts()) {
      if (post.images && post.images.length > 0) {
        for (const url of post.images) {
          photos.push({
            url: this.getFullUrl(url),
            postId: post.id,
            authorName: `${post.user.firstName} ${post.user.lastName}`,
            authorAvatar: this.getFullUrl(post.user.avatarUrl),
            postContent: post.content,
            createdAt: post.createdAt,
            postType: post.postType
          });
        }
      }
    }
    return photos;
  });

  filteredPhotos = computed<GalleryPhoto[]>(() => {
    let result = [...this.allPhotos()];
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      result = result.filter(p =>
        p.authorName.toLowerCase().includes(q) ||
        p.postContent.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return this.sortBy === 'newest' ? db - da : da - db;
    });
    return result;
  });

  ngOnInit(): void {
    this.loadPhotos();
  }

  loadPhotos(): void {
    this.postService.getFeedPosts().subscribe({
      next: (posts) => this.posts.set(posts),
      error: () => this.posts.set([])
    });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  setSort(sort: 'newest' | 'oldest'): void {
    this.sortBy = sort;
  }

  openLightbox(photo: GalleryPhoto): void {
    this.activeLightbox = photo;
  }

  closeLightbox(): void {
    this.activeLightbox = null;
  }

  trackByUrl(_index: number, photo: GalleryPhoto): string {
    return photo.url;
  }
}
