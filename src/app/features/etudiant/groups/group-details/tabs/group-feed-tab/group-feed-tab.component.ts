import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../../../core/services/auth.service';
import { LucideAngularModule, Search, Users, Info, MoreVertical, Github, ThumbsUp, User } from 'lucide-angular';

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
}

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  isOnline?: boolean;
}

@Component({
  selector: 'app-group-feed-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './group-feed-tab.component.html',
  styleUrls: ['./group-feed-tab.component.css']
})
export class GroupFeedTabComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  groupId = '';
  currentUser = this.authService.currentUser;
  posts: GroupPost[] = [];
  onlineMembers: GroupMember[] = [];
  searchQuery = '';
  newPostContent = '';
  loadingPosts = false;

  readonly Search = Search;
  readonly Users = Users;
  readonly Info = Info;
  readonly MoreVertical = MoreVertical;
  readonly Github = Github;
  readonly ThumbsUp = ThumbsUp;
  readonly User = User;

  mockPosts: GroupPost[] = [
    {
      id: '1',
      authorId: 'user1',
      authorName: 'Amira Boubaker',
      authorAvatar: 'https://via.placeholder.com/48',
      content: 'Software Engineer specialized in Mobile Development...',
      createdAt: '19 February, 2026, 12:30',
      likes: 42,
      comments: 8,
      liked: false
    }
  ];

  mockOnlineMembers: GroupMember[] = [
    { id: '1', firstName: 'Amina', lastName: 'Boubaker', avatarUrl: 'https://via.placeholder.com/32', isOnline: true },
    { id: '2', firstName: 'Sara', lastName: 'Ahmed', avatarUrl: 'https://via.placeholder.com/32', isOnline: true },
    { id: '3', firstName: 'Alex', lastName: 'Chen', avatarUrl: 'https://via.placeholder.com/32', isOnline: true },
    { id: '4', firstName: 'Maria', lastName: 'Garcia', avatarUrl: 'https://via.placeholder.com/32', isOnline: true },
    { id: '5', firstName: 'John', lastName: 'Smith', avatarUrl: 'https://via.placeholder.com/32', isOnline: true },
    { id: '6', firstName: 'Lisa', lastName: 'Wong', avatarUrl: 'https://via.placeholder.com/32', isOnline: true },
    { id: '7', firstName: 'Tom', lastName: 'Brown', avatarUrl: 'https://via.placeholder.com/32', isOnline: false },
    { id: '8', firstName: 'Emma', lastName: 'Davis', avatarUrl: 'https://via.placeholder.com/32', isOnline: false }
  ];

  ngOnInit() {
    // Access parent param id
    this.route.parent?.paramMap.subscribe(params => {
      this.groupId = params.get('id') || '';
      this.loadPosts();
      this.loadOnlineMembers();
    });
  }

  loadPosts() {
    this.loadingPosts = true;
    setTimeout(() => {
      this.posts = this.mockPosts;
      this.loadingPosts = false;
    }, 500);
  }

  loadOnlineMembers() {
    this.onlineMembers = this.mockOnlineMembers;
  }

  createPost() {
    if (!this.newPostContent.trim()) return;
    const user = this.currentUser();
    const post: GroupPost = {
      id: Date.now().toString(),
      authorId: user?.userId || 'current-user',
      authorName: user ? `${user.firstName || 'User'} ${user.lastName || ''}` : 'User',
      authorAvatar: user?.avatarUrl || 'https://via.placeholder.com/48',
      content: this.newPostContent,
      createdAt: new Date().toLocaleString(),
      likes: 0,
      comments: 0,
      liked: false
    };
    this.posts.unshift(post);
    this.newPostContent = '';
  }

  likePost(post: GroupPost) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
  }

  searchPosts() {
    if (!this.searchQuery.trim()) {
      this.posts = this.mockPosts;
    } else {
      this.posts = this.mockPosts.filter(p => 
        p.content.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.authorName.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }
}
