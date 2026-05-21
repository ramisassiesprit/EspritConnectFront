import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Users, Info, MoreVertical, ThumbsUp } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/User.service';

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
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  currentUser = this.authService.currentUser;
  
  isPostModalOpen = signal(false);
  activePostMenuId: string | null = null;
  searchQuery = '';
  newPostContent = '';

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

  posts: FeedPost[] = [
    {
      author: 'salah anez',
      avatar: 'https://i.pravatar.cc/150?img=11',
      date: '12 May, 2026, 20:31',
      school: 'Esprit',
      content: 'À la recherche d\'un stage d\'été en informatique\nÉlève ingénieur en informatique à ESPRIT Engineering School, je suis actuellement à la recherche d\'un stage d\'été et reste ouverte à des opportunités dans plusieurs ...',
      attachment: {
        name: 'Salah_Anez.pdf',
        type: 'PDF Document'
      },
      likes: 0,
      liked: false
    }
  ];

  // Sidebar mock data
  recentJobs: JobItem[] = [
    { title: 'Offre de stage - Fnac Tunisie', company: 'Fnac Tunisie', location: 'Tunis', date: '22 NEW' },
    { title: 'Offres de stage PFE rémunérées', company: 'Dada Rent a Car', location: 'Tunis', date: '22 NEW' },
    { title: 'Stage Professionnel RH', company: 'KPS Groupe', location: 'Tunis', date: '22 NEW' }
  ];

  recentMembers: RecentMember[] = [
    { name: 'Amine Ben Ali', avatar: 'https://i.pravatar.cc/150?img=21', role: 'Student' },
    { name: 'Sara Mhiri', avatar: 'https://i.pravatar.cc/150?img=22', role: 'Alumni' },
    { name: 'Youssef Saad', avatar: 'https://i.pravatar.cc/150?img=23', role: 'Student' },
    { name: 'Leila Khemiri', avatar: 'https://i.pravatar.cc/150?img=24', role: 'Recruiter' }
  ];

  espritFbPosts: FbPost[] = [
    { title: 'ESPRIT - Open Day', excerpt: 'Rejoignez-nous pour la journée portes ouvertes...', date: '3h' },
    { title: 'Projet PFE primé', excerpt: 'Félicitations à l\'équipe gagnante du concours...', date: '1d' }
  ];

  ngOnInit() {
    window.addEventListener('click', this._windowClick);
  }

  ngOnDestroy() {
    window.removeEventListener('click', this._windowClick);
  }

  private _windowClick = () => {
    this.activePostMenuId = null;
  }

  openPostModal() {
    this.isPostModalOpen.set(true);
  }

  closePostModal() {
    this.isPostModalOpen.set(false);
  }

  togglePostMenu(postAuthor: string, event: Event) {
    event.stopPropagation();
    this.activePostMenuId = this.activePostMenuId === postAuthor ? null : postAuthor;
  }

  searchPosts() {
    // Implement search logic
    console.log('Searching for:', this.searchQuery);
  }

  toggleLike(post: FeedPost) {
    post.liked = !post.liked;
    post.likes = (post.likes || 0) + (post.liked ? 1 : -1);
  }
}
