import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../../core/services/post.service';
import { CommentService } from '../../../core/services/comment.service';
import { PostDTO, CommentDTO } from '../../../core/models/post.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-feed.component.html',
  styleUrl: './admin-feed.component.css'
})
export class AdminFeedComponent implements OnInit {
  private postService = inject(PostService);
  private commentService = inject(CommentService);

  posts = signal<PostDTO[]>([]);
  allPosts = signal<PostDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters and search
  searchQuery = signal('');
  filterType = signal<'ALL' | 'MEDIA' | 'NO_MEDIA'>('ALL');

  // Stats
  totalPosts = signal(0);
  totalLikes = signal(0);
  totalComments = signal(0);
  mediaPostsCount = signal(0);

  // Comment Moderation State
  openCommentsPostIds = signal<{[postId: string]: boolean}>({});
  postComments = signal<{[postId: string]: CommentDTO[]}>({});

  // Confirmation Modal State
  isDeleteModalOpen = signal(false);
  deleteType = signal<'POST' | 'COMMENT' | null>(null);
  targetPost = signal<PostDTO | null>(null);
  targetCommentId = signal<string | null>(null);

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.loading.set(true);
    this.error.set(null);
    this.postService.getFeedPosts().subscribe({
      next: (data) => {
        this.allPosts.set(data);
        this.applyFilters();
        this.calculateStats();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load feed posts', err);
        this.error.set('Failed to load feed posts. Please try again.');
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allPosts()];

    // Apply Search
    const search = this.searchQuery().trim().toLowerCase();
    if (search) {
      filtered = filtered.filter(post => {
        const authorName = `${post.user?.firstName || ''} ${post.user?.lastName || ''}`.toLowerCase();
        const content = (post.content || '').toLowerCase();
        return authorName.includes(search) || content.includes(search);
      });
    }

    // Apply Media Filter
    const type = this.filterType();
    if (type === 'MEDIA') {
      filtered = filtered.filter(post => !!post.mediaUrl || (post.images && post.images.length > 0) || (post.files && post.files.length > 0));
    } else if (type === 'NO_MEDIA') {
      filtered = filtered.filter(post => !post.mediaUrl && (!post.images || post.images.length === 0) && (!post.files || post.files.length === 0));
    }

    this.posts.set(filtered);
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange(type: 'ALL' | 'MEDIA' | 'NO_MEDIA') {
    this.filterType.set(type);
    this.applyFilters();
  }

  calculateStats() {
    const all = this.allPosts();
    this.totalPosts.set(all.length);

    let likes = 0;
    let comments = 0;
    let mediaCount = 0;

    all.forEach(post => {
      likes += post.likesCount || 0;
      comments += post.commentsCount || 0;
      if (post.mediaUrl || (post.images && post.images.length > 0) || (post.files && post.files.length > 0)) {
        mediaCount++;
      }
    });

    this.totalLikes.set(likes);
    this.totalComments.set(comments);
    this.mediaPostsCount.set(mediaCount);
  }

  // --- Modal Moderation Methods ---
  confirmDeletePost(post: PostDTO) {
    this.targetPost.set(post);
    this.deleteType.set('POST');
    this.isDeleteModalOpen.set(true);
  }

  confirmDeleteComment(post: PostDTO, commentId: string) {
    this.targetPost.set(post);
    this.targetCommentId.set(commentId);
    this.deleteType.set('COMMENT');
    this.isDeleteModalOpen.set(true);
  }

  executeDelete() {
    const type = this.deleteType();
    const post = this.targetPost();

    if (type === 'POST' && post) {
      this.postService.deletePost(post.id).subscribe({
        next: () => {
          const updatedAll = this.allPosts().filter(p => p.id !== post.id);
          this.allPosts.set(updatedAll);
          this.applyFilters();
          this.calculateStats();
          this.closeDeleteModal();
        },
        error: (err) => {
          console.error('Failed to delete post', err);
          alert('Failed to delete post. Please try again.');
          this.closeDeleteModal();
        }
      });
    } else if (type === 'COMMENT' && post && this.targetCommentId()) {
      const commentId = this.targetCommentId()!;
      this.commentService.deleteComment(commentId).subscribe({
        next: () => {
          const postId = post.id;
          
          this.postComments.update(val => {
            const comments = val[postId] || [];
            return {
              ...val,
              [postId]: comments.filter(c => c.id !== commentId)
            };
          });

          post.commentsCount = Math.max(0, (post.commentsCount || 0) - 1);
          this.calculateStats();
          this.closeDeleteModal();
        },
        error: (err) => {
          console.error('Failed to delete comment', err);
          alert('Failed to delete comment. Please try again.');
          this.closeDeleteModal();
        }
      });
    }
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.deleteType.set(null);
    this.targetPost.set(null);
    this.targetCommentId.set(null);
  }

  // --- Comment Expansion Methods ---
  toggleComments(post: PostDTO) {
    const postId = post.id;
    const isOpen = !!this.openCommentsPostIds()[postId];
    
    this.openCommentsPostIds.update(val => ({
      ...val,
      [postId]: !isOpen
    }));

    if (!isOpen) {
      this.loadComments(postId);
    }
  }

  loadComments(postId: string) {
    this.commentService.getCommentsByPost(postId).subscribe({
      next: (comments) => {
        this.postComments.update(val => ({
          ...val,
          [postId]: comments
        }));
      },
      error: (err) => console.error('Failed to load comments', err)
    });
  }

  getFullUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return environment.apiUrl + (url.startsWith('/') ? url.substring(1) : url);
  }

  getSnippet(content: string, length: number = 80): string {
    if (!content) return '';
    if (content.length <= length) return content;
    return content.substring(0, length) + '...';
  }
}
