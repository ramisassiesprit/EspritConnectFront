import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Users, Info, MoreVertical, ThumbsUp } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/User.service';
import { PostService } from '../../../core/services/post.service';
import { ReactionService } from '../../../core/services/reaction.service';
import { CommentService } from '../../../core/services/comment.service';
import { PostDTO, CommentDTO } from '../../../core/models/post.model';
import { User } from '../../../core/models/user.model';
import { JobOffer } from '../../../core/models/job.model';
import { JobService } from '../../../core/services/job.service';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { DEFAULT_JOBS_SETTINGS, JobsSettings, JobsSettingsService } from '../../../core/services/jobs-settings.service';

interface FeedPost {
  author: string;
  avatar?: string;
  date: string;
  school?: string;
  content: string;
  attachment?: {
    name: string;
    type: string;
  };
  likes?: number;
  liked?: boolean;
  media?: string[];
}

interface OnlineMember {
  name: string;
  avatar: string;
  status: 'online' | 'away';
}


interface JobItem {
  title: string;
  company: string;
  location?: string;
  date: string;
}

interface RecentMember {
  name: string;
  avatar?: string;
  role?: string;
}

interface FbPost {
  title: string;
  excerpt: string;
  date: string;
}
@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private postService = inject(PostService);
  private reactionService = inject(ReactionService);
  private commentService = inject(CommentService);
  private jobService = inject(JobService);
  private jobsSettingsService = inject(JobsSettingsService);

  currentUser = this.authService.currentUser;

  isPostModalOpen = signal(false);
  activePostMenuId: string | null = null;
  searchQuery = '';
  newPostContent = '';

  isEditModalOpen = signal(false);
  editingPostId: string | null = null;
  editPostContent = '';

  openCommentsPostIds: { [postId: string]: boolean } = {};
  newCommentInputs: { [postId: string]: string } = {};
  postComments: { [postId: string]: CommentDTO[] } = {};

  isCommentEditModalOpen = signal(false);
  editingCommentId: string | null = null;
  editCommentContent = '';
  editingCommentPostId: string | null = null;

  readonly Search = Search;
  readonly Users = Users;
  readonly Info = Info;
  readonly MoreVertical = MoreVertical;
  readonly ThumbsUp = ThumbsUp;

  onlineMembers: OnlineMember[] = [
    { name: 'User 1', avatar: 'https://i.pravatar.cc/150?img=1', status: 'online' },
    { name: 'User 2', avatar: 'https://i.pravatar.cc/150?img=2', status: 'online' },
    { name: 'User 3', avatar: 'https://i.pravatar.cc/150?img=3', status: 'online' },
    { name: 'User 4', avatar: 'https://i.pravatar.cc/150?img=4', status: 'online' },
    { name: 'User 5', avatar: 'https://i.pravatar.cc/150?img=5', status: 'online' },
    { name: 'User 6', avatar: 'https://i.pravatar.cc/150?img=6', status: 'online' },
    { name: 'User 7', avatar: 'https://i.pravatar.cc/150?img=7', status: 'away' },
    { name: 'User 8', avatar: 'https://i.pravatar.cc/150?img=8', status: 'away' },
    { name: 'User 9', avatar: 'https://i.pravatar.cc/150?img=9', status: 'away' }
  ];

  onlineUsers: User[] = [];
  private refreshInterval: any;
  posts: PostDTO[] = [];
  allPosts: PostDTO[] = [];
  recentJobs: JobOffer[] = [];
  jobsSettings: JobsSettings = DEFAULT_JOBS_SETTINGS;

  recentMembers: User[] = [];
  totalUsersCount = 0;

  espritFbPosts: FbPost[] = [
    { title: 'ESPRIT - Open Day', excerpt: 'Rejoignez-nous pour la journée portes ouvertes...', date: '3h' },
    { title: 'Projet PFE primé', excerpt: 'Félicitations à l\'équipe gagnante du concours...', date: '1d' }
  ];

  ngOnInit() {
    window.addEventListener('click', this._windowClick);
    this.jobsSettingsService.settings$.subscribe((settings) => {
      this.jobsSettings = settings;
      if (!settings.displayJobWidgetOnFeedPage) {
        this.recentJobs = [];
      } else {
        this.loadRecentJobs();
      }
    });
    this.loadFeedPosts();
    this.loadOnlineUsers();
    this.loadRecentMembers();

    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadOnlineUsers();
      this.loadRecentJobs();
      this.loadRecentMembers();
    }, 30000);
  }

  ngOnDestroy() {
    window.removeEventListener('click', this._windowClick);
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadOnlineUsers() {
    this.userService.getOnlineUsers().subscribe({
      next: (users) => {
        this.onlineUsers = users;
      },
      error: (err) => {
        console.error('Failed to load online users', err);
      }
    });
  }

  loadRecentJobs() {
    if (!this.jobsSettings.displayJobWidgetOnFeedPage) {
      this.recentJobs = [];
      return;
    }
    this.jobService.getAllJobs().subscribe({
      next: (offers) => {
        this.recentJobs = offers
          .filter(job => job.status === 'OPEN')
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 3);
      },
      error: (err) => {
        console.error('Failed to load recent jobs', err);
      }
    });
  }

  loadRecentMembers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.totalUsersCount = users.length;
        // Sort by registration/createdAt descending and take 12
        this.recentMembers = users
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 12);
      },
      error: (err) => {
        console.error('Failed to load recent members', err);
      }
    });
  }

  private _windowClick = () => {
    this.activePostMenuId = null;
  }

  loadFeedPosts() {
    this.postService.getFeedPosts().subscribe({
      next: (data) => {
        this.allPosts = data;  // ← save full list
        this.posts = data;
      },
      error: (err) => {
        console.error('Failed to load feed posts', err);
      }
    });
  }

  openPostModal() {
    this.isPostModalOpen.set(true);
  }

  closePostModal() {
    this.isPostModalOpen.set(false);
  }

  togglePostMenu(postId: string, event: Event) {
    event.stopPropagation();
    this.activePostMenuId = this.activePostMenuId === postId ? null : postId;
  }

  searchPosts() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.posts = this.allPosts;
      return;
    }
    this.posts = this.allPosts.filter(post => {
      const firstName = post.user?.firstName?.toLowerCase() || '';
      const lastName = post.user?.lastName?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`;
      return fullName.includes(query) || firstName.includes(query) || lastName.includes(query);
    });
  }

  selectedFiles: File[] = [];

  onFilesAttached(event: any) {
    const files: FileList = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      this.selectedFiles.push(files[i]);
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  publishPost() {
    if (!this.newPostContent.trim() && this.selectedFiles.length === 0) return;

    this.postService.createPost(this.newPostContent, this.selectedFiles).subscribe({
      next: (newPost) => {
        this.allPosts = [newPost, ...this.allPosts]; // ← add this
        this.posts = [newPost, ...this.posts];
        this.newPostContent = '';
        this.selectedFiles = [];
        this.closePostModal();
      },
      error: (err) => {
        console.error('Failed to create post', err);
      }
    });
  }

  toggleLike(post: PostDTO) {
    if (post.liked) {
      this.reactionService.unlikePost(post.id).subscribe({
        next: () => {
          post.liked = false;
          post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
        },
        error: (err) => console.error('Failed to unlike post', err)
      });
    } else {
      this.reactionService.likePost(post.id, 'LIKE').subscribe({
        next: () => {
          post.liked = true;
          post.likesCount = (post.likesCount || 0) + 1;
        },
        error: (err) => console.error('Failed to like post', err)
      });
    }
  }

  toggleComments(post: PostDTO) {
    const postId = post.id;
    this.openCommentsPostIds[postId] = !this.openCommentsPostIds[postId];
    if (this.openCommentsPostIds[postId]) {
      this.loadComments(postId);
    }
  }

  loadComments(postId: string) {
    this.commentService.getCommentsByPost(postId).subscribe({
      next: (comments) => {
        this.postComments[postId] = comments;
      },
      error: (err) => console.error('Failed to load comments', err)
    });
  }

  submitComment(post: PostDTO) {
    const postId = post.id;
    const content = this.newCommentInputs[postId]?.trim();
    if (!content) return;

    this.commentService.addComment(postId, content).subscribe({
      next: (comment) => {
        if (!this.postComments[postId]) {
          this.postComments[postId] = [];
        }
        this.postComments[postId].push(comment);
        this.newCommentInputs[postId] = '';
        post.commentsCount = (post.commentsCount || 0) + 1;
      },
      error: (err) => console.error('Failed to submit comment', err)
    });
  }
  deleteComment(post: PostDTO, commentId: string) {
    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        const postId = post.id;
        if (this.postComments[postId]) {
          this.postComments[postId] = this.postComments[postId].filter(c => c.id !== commentId);
        }
        post.commentsCount = Math.max(0, (post.commentsCount || 0) - 1);
      },
      error: (err) => console.error('Failed to delete comment', err)
    });
  }

  getFullUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return environment.apiUrl + (url.startsWith('/') ? url.substring(1) : url);
  }
  getRoleNavigationPath(): string {
  const role = this.currentUser()?.role;
  return  role === 'ETUDIANT' ? 'etudiant' : 'enseignant';
}
// Ouvre la modale d'édition avec le contenu actuel du post
updateComment(comment: CommentDTO, postId: string) {
  this.editingCommentId = comment.id;
  this.editingCommentPostId = postId; // On sauvegarde l'ID du post ici
  this.editCommentContent = comment.content;
  this.isCommentEditModalOpen.set(true);
  this.activePostMenuId = null;
}

closeCommentEditModal() {
  this.isCommentEditModalOpen.set(false);
  this.editingCommentId = null;
  this.editingCommentPostId = null; // Reset
  this.editCommentContent = '';
}

// Plus besoin de passer de paramètre ici !
submitCommentUpdate() {
  if (!this.editingCommentId || !this.editingCommentPostId || !this.editCommentContent.trim()) return;

  const postId = this.editingCommentPostId;

  this.commentService.updateComment(this.editingCommentId, this.editCommentContent).subscribe({
    next: (updatedComment) => {
      if (this.postComments[postId]) {
        // Met à jour le commentaire dans le bon tableau grâce à l'ID sauvegardé
        this.postComments[postId] = this.postComments[postId].map(c => 
          c.id === this.editingCommentId ? { ...c, content: updatedComment.content } : c
        );
      }
      this.closeCommentEditModal();
    },
    error: (err) => console.error('Failed to update comment', err)
  });
}
openEditModal(post: PostDTO, event: Event) {
  event.stopPropagation();
  this.editingPostId = post.id;
  this.editPostContent = post.content;
  this.isEditModalOpen.set(true);
  this.activePostMenuId = null;
}

closeEditModal() {
  this.isEditModalOpen.set(false);
  this.editingPostId = null;
  this.editPostContent = '';
}

// Enregistre les modifications sur le serveur
updatePost() {
  if (!this.editingPostId || !this.editPostContent.trim()) return;

  this.postService.updatePost(this.editingPostId, this.editPostContent).subscribe({
    next: (updatedPost) => {
      // Met à jour le post en temps réel dans la liste locale
      this.allPosts = this.allPosts.map(p => p.id === this.editingPostId ? { ...p, content: updatedPost.content } : p);
      this.posts = this.posts.map(p => p.id === this.editingPostId ? { ...p, content: updatedPost.content } : p);
      this.closeEditModal();
    },
    error: (err) => console.error('Failed to update post', err)
  });
}

// Supprime définitivement un post
deletePost(postId: string, event: Event) {
  event.stopPropagation();
  
  if (confirm('Are you sure you want to delete this post?')) {
    this.postService.deletePost(postId).subscribe({
      next: () => {
        // Filtre et retire le post de l'affichage local
        this.allPosts = this.allPosts.filter(p => p.id !== postId);
        this.posts = this.posts.filter(p => p.id !== postId);
        this.activePostMenuId = null;
      },
      error: (err) => console.error('Failed to delete post', err)
    });
  }
  
}
}

