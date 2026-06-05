import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostService } from '../../../../core/services/post.service';
import { PostDTO } from '../../../../core/models/post.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-recent-feed-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recent-feed-posts.component.html',
  styleUrl: './recent-feed-posts.component.css'
})
export class RecentFeedPostsComponent implements OnInit {
  private postService = inject(PostService);

  recentPosts: PostDTO[] = [];
  loading: boolean = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadRecentPosts();
  }

  loadRecentPosts(): void {
    this.loading = true;
    this.error = null;
    this.postService.getFeedPosts().subscribe({
      next: (posts: PostDTO[]) => {
        // Feed posts are ordered by createdAt DESC from the backend.
        // We take the last 2 (most recent) posts.
        this.recentPosts = posts.slice(0, 2);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading recent posts:', err);
        this.error = 'Failed to load recent posts.';
        this.loading = false;
      }
    });
  }

  getFullUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return environment.apiUrl + (url.startsWith('/') ? url.substring(1) : url);
  }

  getSnippet(content?: string, limit: number = 120): string {
    if (!content) return '';
    if (content.length <= limit) return content;
    return content.substring(0, limit) + '...';
  }
}
