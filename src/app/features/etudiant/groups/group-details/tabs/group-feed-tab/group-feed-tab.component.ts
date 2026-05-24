import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../../../core/services/auth.service';
import { GroupService } from '../../../../../../core/services/group.service';
import { UserService } from '../../../../../../core/services/User.service';
import { PostService } from '../../../../../../core/services/post.service';
import { CommentService } from '../../../../../../core/services/comment.service';
import { ReactionService } from '../../../../../../core/services/reaction.service';
import { CommentDTO } from '../../../../../../core/models/post.model';
import { environment } from '../../../../../../../environments/environment';
import { LucideAngularModule, Search, Users, Info, MoreVertical, ThumbsUp, User } from 'lucide-angular';
import { QuillModule } from 'ngx-quill';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface GroupPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  liked?: boolean;
  images?: string[];
  files?: Array<{ name: string; size: string; type: string; url?: string }>;
  tags?: Array<{ id: string; name: string }>;
  link?: string;
}

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  isOnline?: boolean;
  membershipStatus?: string; // e.g. 'PENDING', 'APPROVED'
}

@Component({
  selector: 'app-group-feed-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, QuillModule],
  templateUrl: './group-feed-tab.component.html',
  styleUrls: ['./group-feed-tab.component.css']
})
export class GroupFeedTabComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private groupService = inject(GroupService);
  private postService = inject(PostService);
  private commentService = inject(CommentService);
  private reactionService = inject(ReactionService);
  private route = inject(ActivatedRoute);

  groupId = '';
  currentUser = this.authService.currentUser;
  posts: GroupPost[] = [];
  onlineMembers: GroupMember[] = [];
  searchQuery = '';
  newPostContent = '';
  loadingPosts = false;

  // Rich Creator Modal States
  showCreatePostModal = false;
  modalPostContent = '';
  selectedMediaFiles: File[] = [];
  selectedMediaUrls: string[] = [];
  selectedFiles: File[] = [];
  showTagDropdown = false;
  selectedTags: any[] = [];
  attachedLink = '';

  // Comments states
  postComments: { [postId: string]: CommentDTO[] } = {};
  openCommentsPostIds: { [postId: string]: boolean } = {};
  newCommentInputs: { [postId: string]: string } = {};

  // Post Edit states
  showEditPostModal = false;
  editingPost: GroupPost | null = null;
  editPostContent = '';
  editPostLink = '';

  activeDropdownPostId: string | null = null;

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'bullet' }, { 'list': 'ordered' }],
      ['link']
    ]
  };

  // Invite member states
  allUsers: any[] = [];
  inviteSearchQuery = '';
  searchResults: any[] = [];
  selectedUserForInvite: any = null;
  showDropdown = false;
  inviteMessage = '';
  inviteMessageType: 'success' | 'error' = 'success';

  readonly Search = Search;
  readonly Users = Users;
  readonly Info = Info;
  readonly MoreVertical = MoreVertical;
  readonly ThumbsUp = ThumbsUp;
  readonly User = User;

  private stompClient: any = null;

  mockPosts: GroupPost[] = [
    {
      id: '1',
      authorId: 'user1',
      authorName: 'Amira Boubaker',
      authorAvatar: '',
      content: 'Hello everyone! I have created a repository containing the final revision resources for mobile development. Check it out and let me know if you have any questions!',
      createdAt: '19 February, 2026, 12:30',
      likes: 42,
      comments: 8,
      liked: false,
      link: 'https://github.com/amiraboubaker/mobile-dev-revision',
      images: ['https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80']
    },
    {
      id: '2',
      authorId: 'user2',
      authorName: 'Sara Ahmed',
      authorAvatar: '',
      content: 'Here are the syllabus and lecture notes folders for the upcoming Software Quality Assurance chapter. Best of luck!',
      createdAt: '18 February, 2026, 15:45',
      likes: 12,
      comments: 3,
      liked: true,
      files: [
        { name: 'QA_Chapter3_LectureNotes.pdf', size: '2450000', type: 'application/pdf' },
        { name: 'QA_Lab_Guidelines.docx', size: '1200000', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      ],
      tags: [{ id: '1', name: 'Amira Boubaker' }]
    }
  ];

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.groupId = params.get('id') || '';
      if (this.groupId) {
        this.loadPosts();
        this.loadOnlineMembers();
        this.loadAllUsers();
        this.connectWebSocket();
      }
    });
  }

  loadPosts() {
    this.loadingPosts = true;
    this.postService.getGroupPosts(this.groupId).subscribe({
      next: (data) => {
        this.posts = data.map(p => this.mapBackendPostToGroupPost(p));
        // Pre-add photos to the gallery tab if present
        this.posts.forEach(p => {
          if (p.images && p.images.length > 0) {
            this.groupService.addPhotos(p.images);
          }
        });
        this.loadingPosts = false;
      },
      error: (err) => {
        console.error('Failed to load group posts', err);
        this.loadingPosts = false;
      }
    });
  }

  mapBackendPostToGroupPost(p: any): GroupPost {
    let formattedDate = '';
    if (p.createdAt) {
      const date = new Date(p.createdAt);
      formattedDate = date.toLocaleString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }

    let displayContent = p.content || '';
    displayContent = this.decodeHtml(displayContent);
    displayContent = this.cleanHtmlContent(displayContent);

    let parsedTags: Array<{ id: string; name: string }> = [];
    const tagsStartIndex = displayContent.indexOf('<!--TAGS:');
    if (tagsStartIndex > -1) {
      const tagsEndIndex = displayContent.indexOf('-->', tagsStartIndex);
      if (tagsEndIndex > -1) {
        const jsonStr = displayContent.substring(tagsStartIndex + 9, tagsEndIndex);
        try {
          parsedTags = JSON.parse(jsonStr);
          displayContent = displayContent.substring(0, tagsStartIndex);
        } catch (e) {
          console.error('Failed to parse tags JSON', e);
        }
      }
    }

    return {
      id: p.id,
      authorId: p.user?.id || 'unknown',
      authorName: p.user ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() : 'Unknown User',
      authorAvatar: p.user?.avatarUrl ? this.getFullUrl(p.user.avatarUrl) : '',
      content: displayContent,
      createdAt: formattedDate,
      likes: p.likesCount || 0,
      comments: p.commentsCount || 0,
      liked: p.liked || false,
      images: p.images ? p.images.map((img: string) => this.getFullUrl(img)) : [],
      files: p.files ? p.files.map((f: any) => ({
        name: f.name,
        size: f.size?.toString() || '0',
        type: f.type,
        url: this.getFullUrl(f.url)
      })) : [],
      tags: parsedTags,
      link: p.mediaUrl || undefined
    };
  }

  formatLink(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return 'https://' + url;
  }

  decodeHtml(html: string): string {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    let decoded = txt.value;
    if (decoded.includes('&lt;') || decoded.includes('&gt;')) {
      txt.innerHTML = decoded;
      decoded = txt.value;
    }
    return decoded;
  }

  cleanHtmlContent(html: string): string {
    if (!html) return '';
    // Replace non-breaking spaces with standard space characters
    return html.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ');
  }

  stripHtmlTags(html: string): string {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return (tempDiv.textContent || tempDiv.innerText || '').trim();
  }

  getFullUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = environment.apiUrl;
    return base + (url.startsWith('/') ? url.substring(1) : url);
  }

  loadOnlineMembers() {
    this.groupService.getGroupMembers(this.groupId).subscribe({
      next: (data) => {
        this.onlineMembers = data
          .filter((m: any) => (m.status || m.membershipStatus || m.memberStatus) !== 'PENDING')
          .map((m: any) => ({
            id: m.userId,
            firstName: m.firstName || m.userFullName?.split(' ')[0] || '',
            lastName: m.lastName || m.userFullName?.split(' ')[1] || '',
            avatarUrl: m.avatarUrl || '',
            isOnline: m.isOnline || false,
            membershipStatus: m.status || m.membershipStatus || m.memberStatus || undefined
          }));
      },
      error: (err) => {
        console.error('Failed to load group members for feed initially', err);
      }
    });
  }

  connectWebSocket() {
    this.disconnectWebSocket();
    const socket = new SockJS('http://localhost:8086/EspritConnect/ws-chat');
    this.stompClient = Stomp.over(socket);

    // Disable log spew in console
    this.stompClient.debug = () => { };

    const currentUser = this.authService.currentUser();
    this.stompClient.connectHeaders = {
      userId: currentUser ? currentUser.userId : ''
    };

    this.stompClient.onConnect = (frame: any) => {
      console.log('Connected to group feed WebSocket for members:', this.groupId);

      // Members list subscription
      this.stompClient.subscribe(`/topic/group/${this.groupId}/members`, (message: { body: string }) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          this.onlineMembers = data
            .filter((m: any) => (m.status || m.membershipStatus || m.memberStatus) !== 'PENDING')
            .map((m: any) => ({
              id: m.userId,
              firstName: m.firstName || m.userFullName?.split(' ')[0] || '',
              lastName: m.lastName || m.userFullName?.split(' ')[1] || '',
              avatarUrl: m.avatarUrl || '',
              isOnline: m.isOnline || false,
              membershipStatus: m.status || m.membershipStatus || m.memberStatus || undefined
            }));
        }
      });

      // Real-time group members posts subscription!
      this.stompClient.subscribe(`/topic/group/${this.groupId}/posts`, (message: { body: string }) => {
        if (message.body) {
          const newPost = JSON.parse(message.body);

          // Avoid duplicate posts if we sent it ourselves
          if (!this.posts.some(p => p.id === newPost.id)) {
            this.posts.unshift(newPost);

            // Dynamically propagate photos to dynamic gallery in Photos tab
            if (newPost.images && newPost.images.length > 0) {
              this.groupService.addPhotos(newPost.images);
            }
          }
        }
      });

      // Real-time group members posts update/delete subscription!
      this.stompClient.subscribe(`/topic/group/${this.groupId}/posts/update`, (message: { body: string }) => {
        if (message.body) {
          const action = JSON.parse(message.body);
          if (action.type === 'UPDATE' && action.post) {
            const idx = this.posts.findIndex(p => p.id === action.post.id);
            if (idx > -1) {
              const localPost = this.posts[idx];
              this.posts[idx] = {
                ...action.post,
                liked: localPost.liked
              };
            }
          } else if (action.type === 'DELETE' && action.postId) {
            this.posts = this.posts.filter(p => p.id !== action.postId);
          }
        }
      });
    };

    this.stompClient.onStompError = (frame: any) => {
      console.error('Group feed WebSocket error:', frame);
    };

    this.stompClient.activate();
  }

  loadAllUsers() {
    this.userService.getDirectoryUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
      },
      error: (err) => {
        console.error('Failed to fetch system users for invites', err);
      }
    });
  }

  onInviteSearchFocus() {
    this.showDropdown = true;
    this.searchUsersToInvite();
  }

  searchUsersToInvite() {
    if (!this.inviteSearchQuery.trim() && !this.selectedUserForInvite) {
      this.searchResults = [];
      return;
    }

    const q = this.inviteSearchQuery.toLowerCase();

    this.searchResults = this.allUsers.filter(user => {
      const isAlreadyMember = this.onlineMembers.some(member => member.id === user.id);
      if (isAlreadyMember) return false;

      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }

  selectUser(user: any) {
    this.selectedUserForInvite = user;
    this.inviteSearchQuery = `${user.firstName} ${user.lastName}`;
    this.showDropdown = false;
  }

  clearSelectedUser() {
    this.selectedUserForInvite = null;
    this.inviteSearchQuery = '';
    this.searchResults = [];
    this.showDropdown = false;
  }

  inviteUser() {
    if (!this.selectedUserForInvite) return;

    const targetUser = this.selectedUserForInvite;
    this.groupService.addMember(this.groupId, targetUser.id).subscribe({
      next: (res) => {
        // Backend may return membership object or status field to indicate pending vs approved
        const status = res?.status || res?.membershipStatus || res?.memberStatus || (res?.membership ? res.membership.status : undefined);
        if (status === 'PENDING') {
          this.inviteMessage = `Waiting for the admin to approve ${targetUser.firstName} ${targetUser.lastName}.`;
          this.inviteMessageType = 'success';

          // Add a temporary pending member to the UI so inviter sees the pending state
          const already = this.onlineMembers.some(m => m.id === targetUser.id);
          if (!already) {
            this.onlineMembers = [{
              id: targetUser.id,
              firstName: targetUser.firstName,
              lastName: targetUser.lastName,
              avatarUrl: targetUser.avatarUrl || '',
              isOnline: false,
              membershipStatus: 'PENDING'
            }, ...this.onlineMembers];
          }
        } else {
          this.inviteMessage = `Successfully invited ${targetUser.firstName} ${targetUser.lastName}!`;
          this.inviteMessageType = 'success';
        }
        this.clearSelectedUser();

        setTimeout(() => {
          this.inviteMessage = '';
        }, 4000);
      },
      error: (err) => {
        console.error('Failed to invite user', err);
        this.inviteMessage = err?.error?.message || 'Failed to invite user. Try again.';
        this.inviteMessageType = 'error';
      }
    });
  }

  // --- Modal rich creator actions ---
  openPostModal() {
    this.showCreatePostModal = true;
    this.modalPostContent = this.newPostContent;
  }

  closePostModal() {
    this.showCreatePostModal = false;
    this.modalPostContent = '';
    this.selectedMediaFiles = [];
    this.selectedMediaUrls = [];
    this.selectedFiles = [];
    this.selectedTags = [];
    this.showTagDropdown = false;
  }

  onMediaSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.selectedMediaFiles.push(file);
      this.selectedMediaUrls.push(URL.createObjectURL(file));
    }
  }

  removeMedia(index: number) {
    this.selectedMediaFiles.splice(index, 1);
    this.selectedMediaUrls.splice(index, 1);
  }

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

  toggleTagDropdown() {
    this.showTagDropdown = !this.showTagDropdown;
  }

  toggleMemberTag(member: any) {
    const index = this.selectedTags.findIndex(t => t.id === member.id);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push({ id: member.id, name: `${member.firstName} ${member.lastName}` });
    }
  }

  isMemberTagged(member: any): boolean {
    return this.selectedTags.some(t => t.id === member.id);
  }

  removeTag(tag: any) {
    const index = this.selectedTags.findIndex(t => t.id === tag.id);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    }
  }

  formatBytes(bytesStr: string | number): string {
    const bytes = typeof bytesStr === 'string' ? parseInt(bytesStr) : bytesStr;
    if (isNaN(bytes) || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  submitPost() {
    if (!this.modalPostContent.trim() && this.selectedMediaFiles.length === 0 && this.selectedFiles.length === 0) return;

    // Combine all selected media files and other attachments
    const uploads: File[] = [...this.selectedMediaFiles, ...this.selectedFiles];

    let finalContent = this.modalPostContent;
    if (this.selectedTags && this.selectedTags.length > 0) {
      finalContent += `<!--TAGS:${JSON.stringify(this.selectedTags)}-->`;
    }

    this.postService.createGroupPost(finalContent, this.groupId, uploads, this.attachedLink).subscribe({
      next: (savedPost) => {
        // Map backend returned PostDTO to UI GroupPost structure
        const post = this.mapBackendPostToGroupPost(savedPost);

        // Publish to WebSocket topic for real-time propagation across all members!
        if (this.stompClient && this.stompClient.connected) {
          this.stompClient.publish({
            destination: `/topic/group/${this.groupId}/posts`,
            body: JSON.stringify(post)
          });
        } else {
          // Fallback locally
          this.posts.unshift(post);
          if (post.images && post.images.length > 0) {
            this.groupService.addPhotos(post.images);
          }
        }

        this.newPostContent = '';
        this.attachedLink = '';
        this.selectedTags = [];
        this.closePostModal();
      },
      error: (err) => {
        console.error('Failed to publish group post to backend', err);
      }
    });
  }

  createPost() {
    this.openPostModal();
  }

  likePost(post: GroupPost) {
    if (post.liked) {
      this.reactionService.unlikePost(post.id).subscribe({
        next: () => {
          post.liked = false;
          post.likes = Math.max(0, post.likes - 1);
          this.syncPostUpdate(post);
        },
        error: (err) => console.error('Failed to unlike post', err)
      });
    } else {
      this.reactionService.likePost(post.id).subscribe({
        next: () => {
          post.liked = true;
          post.likes += 1;
          this.syncPostUpdate(post);
        },
        error: (err) => console.error('Failed to like post', err)
      });
    }
  }

  syncPostUpdate(post: GroupPost) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/topic/group/${this.groupId}/posts/update`,
        body: JSON.stringify({ type: 'UPDATE', post: post })
      });
    }
  }

  toggleComments(post: GroupPost) {
    const postId = post.id;
    this.openCommentsPostIds[postId] = !this.openCommentsPostIds[postId];
    if (this.openCommentsPostIds[postId] && !this.postComments[postId]) {
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

  submitComment(post: GroupPost) {
    const postId = post.id;
    const content = this.newCommentInputs[postId]?.trim();
    if (!content) return;

    this.commentService.addComment(postId, content).subscribe({
      next: (newComment) => {
        if (!this.postComments[postId]) {
          this.postComments[postId] = [];
        }
        this.postComments[postId].push(newComment);
        this.newCommentInputs[postId] = '';
        post.comments += 1;
        this.syncPostUpdate(post);
      },
      error: (err) => console.error('Failed to submit comment', err)
    });
  }

  deleteComment(post: GroupPost, commentId: string) {
    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        const postId = post.id;
        if (this.postComments[postId]) {
          this.postComments[postId] = this.postComments[postId].filter(c => c.id !== commentId);
        }
        post.comments = Math.max(0, post.comments - 1);
        this.syncPostUpdate(post);
      },
      error: (err) => console.error('Failed to delete comment', err)
    });
  }

  deletePost(postId: string) {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postService.deletePost(postId).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.id !== postId);
          if (this.stompClient && this.stompClient.connected) {
            this.stompClient.publish({
              destination: `/topic/group/${this.groupId}/posts/update`,
              body: JSON.stringify({ type: 'DELETE', postId: postId })
            });
          }
        },
        error: (err) => console.error('Failed to delete post', err)
      });
    }
  }

  openEditModal(post: GroupPost) {
    this.editingPost = post;
    this.editPostContent = this.stripHtmlTags(post.content);
    this.editPostLink = post.link || '';
    this.showEditPostModal = true;
    this.activeDropdownPostId = null;
  }

  closeEditModal() {
    this.showEditPostModal = false;
    this.editingPost = null;
    this.editPostContent = '';
    this.editPostLink = '';
  }

  submitEdit() {
    if (!this.editingPost || !this.editPostContent.trim()) return;

    let formattedContent = this.editPostContent.replace(/\n/g, '<br>');

    let finalContent = formattedContent;
    if (this.editingPost.tags && this.editingPost.tags.length > 0) {
      finalContent += `<!--TAGS:${JSON.stringify(this.editingPost.tags)}-->`;
    }

    this.postService.updatePost(this.editingPost.id, finalContent, this.editPostLink).subscribe({
      next: (updatedPostDto) => {
        const updated = this.mapBackendPostToGroupPost(updatedPostDto);
        updated.liked = this.editingPost?.liked;

        const idx = this.posts.findIndex(p => p.id === updated.id);
        if (idx > -1) {
          this.posts[idx] = updated;
        }

        this.syncPostUpdate(updated);
        this.closeEditModal();
      },
      error: (err) => console.error('Failed to update post', err)
    });
  }

  toggleDropdown(postId: string, event: Event) {
    event.stopPropagation();
    if (this.activeDropdownPostId === postId) {
      this.activeDropdownPostId = null;
    } else {
      this.activeDropdownPostId = postId;
    }
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.activeDropdownPostId = null;
  }

  searchPosts() {
    if (!this.searchQuery.trim()) {
      this.loadPosts();
    } else {
      this.postService.getGroupPosts(this.groupId).subscribe({
        next: (data) => {
          const allMapped = data.map(p => this.mapBackendPostToGroupPost(p));
          this.posts = allMapped.filter(p =>
            p.content.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            p.authorName.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
      });
    }
  }

  disconnectWebSocket() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log('Disconnected group feed WebSocket');
    }
  }

  ngOnDestroy() {
    this.disconnectWebSocket();
  }
}
