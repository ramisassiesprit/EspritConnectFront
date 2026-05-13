import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Search, ChevronRight, MoreVertical, ThumbsUp, Download, FileText, Smile, Send, X } from 'lucide-angular';
import { UserService } from '../../../core/services/User.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);

  user: User | null = null;
  completionPercentage = 75; 
  isPostModalOpen = signal(false);
  activePostMenuId = signal<number | null>(null);
  activeReactionPostId = signal<number | null>(null);
  activeCommentPostId = signal<number | null>(null);
  readonly Search = Search;
  readonly ChevronRight = ChevronRight;

  onlineMembers = [
    { name: 'User 1', avatar: 'https://i.pravatar.cc/150?img=1', status: 'online' },
    { name: 'User 2', avatar: 'https://i.pravatar.cc/150?img=2', status: 'online' },
    { name: 'User 3', avatar: 'https://i.pravatar.cc/150?img=3', status: 'online' },
    { name: 'User 4', avatar: 'https://i.pravatar.cc/150?img=4', status: 'online' },
    { name: 'User 5', avatar: 'https://i.pravatar.cc/150?img=5', status: 'online' },
    { name: 'User 6', avatar: 'https://i.pravatar.cc/150?img=6', status: 'online' },
    { name: 'User 7', avatar: 'https://i.pravatar.cc/150?img=7', status: 'away' },
    { name: 'User 8', avatar: 'https://i.pravatar.cc/150?img=8', status: 'away' },
    { name: 'User 9', avatar: 'https://i.pravatar.cc/150?img=9', status: 'away' },
  ];

  recentJobs = [
    {
      title: 'Offre de stage - Fnac Tunisie',
      company: 'Fnac Tunisie',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Fnac_Logo.svg/1200px-Fnac_Logo.svg.png'
    },
    {
      title: 'Offres de stage PFE rémunérés + Offres embauches -',
      company: 'Dada Rent a Car',
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6-6eF9N_6zX-fD7zX8Z5Z-zZzZzZzZzZzZ&s'
    },
    {
      title: 'Offre de stage - - Stage Professionnel RH : Chargé(e) de Recrutement & Développement RH (H/F',
      company: 'KPS Groupe',
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz9zZzZzZzZzZzZzZzZzZzZzZzZzZzZzZ&s'
    },
    {
      title: "Offre d'emploi",
      company: 'Murex',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Murex_logo.svg/1200px-Murex_logo.svg.png'
    }
  ];

  recentMembers = [
    { avatar: 'https://i.pravatar.cc/150?img=1' },
    { avatar: 'https://i.pravatar.cc/150?img=2' },
    { avatar: 'https://i.pravatar.cc/150?img=3' },
    { avatar: 'https://i.pravatar.cc/150?img=4' },
    { avatar: 'https://i.pravatar.cc/150?img=5' },
    { avatar: 'https://i.pravatar.cc/150?img=6' },
    { avatar: 'https://i.pravatar.cc/150?img=7' },
    { avatar: 'https://i.pravatar.cc/150?img=8' },
    { avatar: 'https://i.pravatar.cc/150?img=9' },
    { avatar: 'https://i.pravatar.cc/150?img=10' },
    { avatar: 'https://i.pravatar.cc/150?img=11' },
    { avatar: 'https://i.pravatar.cc/150?img=12' }
  ];

  posts = [
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
      selectedReaction: null as any
    }
  ];

  readonly MoreVertical = MoreVertical;
  readonly ThumbsUp = ThumbsUp;
  readonly Download = Download;
  readonly FileText = FileText;
  readonly Smile = Smile;
  readonly Send = Send;
  readonly XIcon = X;

  ngOnInit() {
    this.userService.getCurrentUser().subscribe(u => this.user = u);
  }

  navigateToProfile() {
    this.router.navigate(['/etudiant/profile']);
  }

  openBadgeModal() {
    console.log('Opening badge modal...');
    // Implementation for badges modal
  }

  openPostModal() {
    this.isPostModalOpen.set(true);
  }

  closePostModal() {
    this.isPostModalOpen.set(false);
  }

  reactions = [
    { type: 'LIKE', label: 'Like', icon: '👍', color: '#3b82f6' },
    { type: 'CELEBRATE', label: 'Celebrate', icon: '👏', color: '#22c55e' },
    { type: 'SUPPORT', label: 'Support', icon: '🤝', color: '#8b5cf6' },
    { type: 'LOVE', label: 'Love', icon: '❤️', color: '#ef4444' },
    { type: 'INSIGHTFUL', label: 'Insightful', icon: '💡', color: '#eab308' },
    { type: 'FUNNY', label: 'Funny', icon: '🤣', color: '#06b6d4' }
  ];

  onReaction(postIndex: number, reaction: any) {
    this.posts[postIndex].selectedReaction = reaction;
    this.activeReactionPostId.set(null);
  }

  showReactions(index: number) {
    this.activeReactionPostId.set(index);
  }

  hideReactions() {
    this.activeReactionPostId.set(null);
  }

  setActiveComment(index: number) {
    this.activeCommentPostId.set(index);
  }

  clearActiveComment() {
    this.activeCommentPostId.set(null);
  }

  togglePostMenu(index: number, event: Event) {
    event.stopPropagation();
    if (this.activePostMenuId() === index) {
      this.activePostMenuId.set(null);
    } else {
      this.activePostMenuId.set(index);
    }
  }

  @HostListener('document:click')
  closeAllMenus() {
    this.activePostMenuId.set(null);
  }
}
