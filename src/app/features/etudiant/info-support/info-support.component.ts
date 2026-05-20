import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/User.service';
import { TicketService } from '../../../core/services/ticket.service';
import { User } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/user-role.enum';
import { TicketPost, TicketComment } from '../../../core/models/ticket.model';
import { Subscription, catchError, of } from 'rxjs';

@Component({
  selector: 'app-info-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './info-support.component.html',
  styleUrl: './info-support.component.css'
})
export class InfoSupportComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private ticketService = inject(TicketService);

  currentUser: User | null = null;
  posts: TicketPost[] = [];
  isOfflineMode: boolean = false;

  get filteredPosts(): TicketPost[] {
    return this.posts;
  }

  get totalOpenCount(): number {
    return this.posts.filter(p => p.status === 'EN_COURS').length;
  }

  get totalResolvedCount(): number {
    return this.posts.filter(p => p.status === 'RESOLU').length;
  }

  // Filters
  searchQuery: string = '';
  selectedCategory: string = 'TOUS';
  selectedStatus: string = 'TOUS';

  // Modal & Selection
  isNewPostModalOpen: boolean = false;
  selectedPost: TicketPost | null = null;

  // Typing & UI indicators
  isTyping: boolean = false;
  typingUser: string = '';
  private typingTimeout: any;

  // Form values
  newPostTitle: string = '';
  newPostContent: string = '';
  newPostCategory: string = 'CAMPUS';
  newCommentText: string = '';

  // RxJS subscriptions
  private subscriptions: Subscription[] = [];
  private activePostSubscriptions: Subscription[] = [];

  categories = [
    { value: 'TOUS', label: 'Toutes les catégories', color: 'bg-gray-100 text-gray-800' },
    { value: 'CAMPUS', label: 'Campus & Salles', color: 'bg-blue-50 text-blue-600' },
    { value: 'COURS', label: 'Cours & Projets', color: 'bg-purple-50 text-purple-600' },
    { value: 'OBJETS', label: 'Objets Perdus', color: 'bg-red-50 text-red-600' },
    { value: 'TRANSPORT', label: 'Transport & Logement', color: 'bg-amber-50 text-amber-600' },
    { value: 'LIBRE', label: 'Discussion Libre', color: 'bg-emerald-50 text-emerald-600' }
  ];

  // Offline mock fallback data in case Spring Boot backend is not currently running
  private offlinePosts: TicketPost[] = [
    {
      id: '1',
      title: 'Où se trouve la salle de TP D203 ?',
      content: 'Bonjour à tous, je suis étudiant en première année et j\'ai un TP de Java prévu en D203 cet après-midi. Je suis au bloc A et je me sens un peu perdu, quelqu\'un pourrait-il m\'indiquer le chemin exact depuis le hall principal ? Merci beaucoup !',
      category: 'CAMPUS',
      status: 'RESOLU',
      upvotes: 8,
      hasUpvoted: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'user_aline',
        firstName: 'Aline',
        lastName: 'Trabelsi',
        email: 'aline@esprit.tn',
        role: UserRole.ETUDIANT,
        status: 'ACTIVE' as any,
        avatarUrl: 'https://i.pravatar.cc/150?img=5'
      },
      comments: [
        {
          id: 'c1',
          content: 'Salut Aline ! Ne t\'inquiète pas, c\'est très simple. Depuis le hall principal du Bloc A, sors par la porte vitrée arrière pour aller vers la cour centrale. Traverse la cour pour entrer dans le Bloc D. Prends l\'ascenseur ou les escaliers jusqu\'au 2ème étage. En sortant de l\'ascenseur, va tout au bout du couloir à droite, c\'est la troisième porte ! 🚀',
          isSolution: true,
          ticketPostId: '1',
          upvotes: 6,
          hasUpvoted: false,
          createdAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'user_karim',
            firstName: 'Karim',
            lastName: 'Gharbi',
            email: 'karim@esprit.tn',
            role: UserRole.ETUDIANT,
            status: 'ACTIVE' as any,
            avatarUrl: 'https://i.pravatar.cc/150?img=12'
          }
        }
      ],
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Erreur d\'injection HttpClient avec standalone: true',
      content: 'Salut ! Je développe mon projet d\'intégration Angular (v19) et j\'obtiens une erreur persistante: "NullInjectorError: No provider for HttpClient!". J\'ai pourtant bien fait l\'import dans mon composant. Quelqu\'un a déjà eu ce souci ?',
      category: 'COURS',
      status: 'RESOLU',
      upvotes: 14,
      hasUpvoted: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'user_salah',
        firstName: 'Salah',
        lastName: 'Anes',
        email: 'salah@esprit.tn',
        role: UserRole.ETUDIANT,
        status: 'ACTIVE' as any,
        avatarUrl: 'https://i.pravatar.cc/150?img=11'
      },
      comments: [
        {
          id: 'c3',
          content: 'Bonjour Salah. C\'est une erreur classique en standalone. Importer HttpClient dans le tableau `imports` de votre composant ne suffit pas à enregistrer ses services réseau globaux. Vous devez ouvrir votre fichier `app.config.ts` et ajouter `provideHttpClient()` dans le tableau `providers` : \n\n```typescript\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideRouter(routes),\n    provideHttpClient() // <-- À AJOUTER ICI !\n  ]\n};\n```',
          isSolution: true,
          ticketPostId: '2',
          upvotes: 11,
          hasUpvoted: false,
          createdAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'user_amin',
            firstName: 'Prof. Amin',
            lastName: 'Ben Salem',
            email: 'amin@esprit.tn',
            role: UserRole.ENSEIGNANT,
            status: 'ACTIVE' as any,
            avatarUrl: 'https://i.pravatar.cc/150?img=68'
          }
        }
      ],
      updatedAt: new Date().toISOString()
    }
  ];

  ngOnInit() {
    this.userService.getCurrentUser().subscribe(u => {
      this.currentUser = u;
      if (u) {
        // Connect to WebSocket STOMP
        this.ticketService.connect(u.id);
        this.setupWebSocketListeners();
      }
    });

    this.loadPosts();
  }

  // Load all posts via REST
  loadPosts() {
    this.ticketService.getPosts(
      this.selectedCategory === 'TOUS' ? undefined : this.selectedCategory,
      this.selectedStatus === 'TOUS' ? undefined : this.selectedStatus,
      this.searchQuery ? this.searchQuery : undefined
    ).pipe(
      catchError(err => {
        console.warn('Backend server offline. Falling back to offline mockup simulation mode.');
        this.isOfflineMode = true;
        return of(this.offlinePosts);
      })
    ).subscribe(data => {
      this.posts = data;
    });
  }

  // Setup global WebSocket listener for new posts
  setupWebSocketListeners() {
    const postSub = this.ticketService.onNewPost().subscribe(newPost => {
      // Avoid duplicates
      if (!this.posts.some(p => p.id === newPost.id)) {
        this.posts.unshift(newPost);
      }
    });
    this.subscriptions.push(postSub);
  }

  // Setup active post WebSockets subscribers when post is clicked
  setupActivePostListeners(postId: string) {
    // Unsubscribe from previous active post
    this.activePostSubscriptions.forEach(sub => sub.unsubscribe());
    this.activePostSubscriptions = [];

    // Tell service to subscribe
    this.ticketService.subscribeToPost(postId);

    // Listen to real-time comments
    const commentSub = this.ticketService.onNewComment().subscribe(comment => {
      if (this.selectedPost && comment.ticketPostId === this.selectedPost.id) {
        // Find existing index or append
        const index = this.selectedPost.comments.findIndex(c => c.id === comment.id);
        if (index !== -1) {
          this.selectedPost.comments[index] = comment;
        } else {
          this.selectedPost.comments.push(comment);
        }
      }
    });

    // Listen to status updates
    const statusSub = this.ticketService.onStatusUpdate().subscribe(updatedPost => {
      if (this.selectedPost && updatedPost.id === this.selectedPost.id) {
        this.selectedPost.status = updatedPost.status;
      }
      const index = this.posts.findIndex(p => p.id === updatedPost.id);
      if (index !== -1) {
        this.posts[index].status = updatedPost.status;
      }
    });

    // Listen to upvote updates
    const upvoteSub = this.ticketService.onUpvoteUpdate().subscribe(updatedPost => {
      if (this.selectedPost && updatedPost.id === this.selectedPost.id) {
        this.selectedPost.upvotes = updatedPost.upvotes;
      }
      const index = this.posts.findIndex(p => p.id === updatedPost.id);
      if (index !== -1) {
        this.posts[index].upvotes = updatedPost.upvotes;
      }
    });

    // Listen to typing indicator
    const typingSub = this.ticketService.onTypingUpdate().subscribe(data => {
      if (this.selectedPost && data.postId === this.selectedPost.id) {
        // Don't show typing indicator for oneself
        const myName = this.currentUser ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : '';
        if (data.username !== myName) {
          this.isTyping = true;
          this.typingUser = data.username;
          
          clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
          }, 3000);
        }
      }
    });

    this.activePostSubscriptions.push(commentSub, statusSub, upvoteSub, typingSub);
  }

  // Filter triggers
  setCategoryFilter(category: string) {
    this.selectedCategory = category;
    this.loadPosts();
  }

  setStatusFilter(status: string) {
    this.selectedStatus = status;
    this.loadPosts();
  }

  // Helper categories classes
  getCategoryColorClasses(cat: string): string {
    switch(cat) {
      case 'CAMPUS': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'COURS': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'OBJETS': return 'bg-red-50 text-red-600 border-red-100';
      case 'TRANSPORT': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
  }

  getCategoryLabel(cat: string): string {
    const found = this.categories.find(c => c.value === cat);
    return found ? found.label : 'Discussion';
  }

  // Actions
  upvotePost(post: TicketPost, event: Event) {
    event.stopPropagation();
    if (this.isOfflineMode) {
      if (post.hasUpvoted) {
        post.upvotes--;
        post.hasUpvoted = false;
      } else {
        post.upvotes++;
        post.hasUpvoted = true;
      }
      return;
    }

    this.ticketService.upvotePost(post.id).subscribe(updated => {
      post.upvotes = updated.upvotes;
      post.hasUpvoted = updated.hasUpvoted;
    });
  }

  upvoteComment(comment: TicketComment, event: Event) {
    event.stopPropagation();
    if (this.isOfflineMode) {
      if (comment.hasUpvoted) {
        comment.upvotes--;
        comment.hasUpvoted = false;
      } else {
        comment.upvotes++;
        comment.hasUpvoted = true;
      }
      return;
    }

    this.ticketService.upvoteComment(comment.id).subscribe(updated => {
      comment.upvotes = updated.upvotes;
      comment.hasUpvoted = updated.hasUpvoted;
    });
  }

  // Open / Close Post Details
  openPostDetails(post: TicketPost) {
    this.selectedPost = post;
    this.newCommentText = '';
    this.isTyping = false;

    if (!this.isOfflineMode) {
      this.setupActivePostListeners(post.id);
    }
  }

  closePostDetails() {
    this.selectedPost = null;
    this.activePostSubscriptions.forEach(sub => sub.unsubscribe());
    this.activePostSubscriptions = [];
  }

  // Open / Close create modal
  openNewPostModal() {
    this.isNewPostModalOpen = true;
  }

  closeNewPostModal() {
    this.isNewPostModalOpen = false;
    this.newPostTitle = '';
    this.newPostContent = '';
  }

  // Send comment keypress handler (triggers typing broadcast)
  onCommentInput() {
    if (this.isOfflineMode || !this.selectedPost || !this.currentUser) return;
    const fullName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    this.ticketService.sendTyping(this.selectedPost.id, fullName);
  }

  // Create new Q&A post
  createPost() {
    if (!this.newPostTitle.trim() || !this.newPostContent.trim()) return;

    if (this.isOfflineMode) {
      const mockPost: TicketPost = {
        id: Math.random().toString(36).substring(2, 9),
        title: this.newPostTitle,
        content: this.newPostContent,
        category: this.newPostCategory,
        status: 'EN_COURS',
        upvotes: 1,
        hasUpvoted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: this.currentUser?.id || 'curr',
          firstName: this.currentUser?.firstName || 'Moi',
          lastName: this.currentUser?.lastName || '',
          email: this.currentUser?.email || '',
          role: this.currentUser?.role || UserRole.ETUDIANT,
          status: 'ACTIVE' as any,
          avatarUrl: this.currentUser?.avatarUrl || 'https://i.pravatar.cc/150?img=12'
        },
        comments: []
      };
      this.posts.unshift(mockPost);
      this.closeNewPostModal();
      this.simulateOfflineReply(mockPost);
      return;
    }

    this.ticketService.createPost(this.newPostTitle, this.newPostContent, this.newPostCategory)
      .subscribe(created => {
        // WS will automatically broadcast to setupWebSocketListeners, but manually push just in case
        if (!this.posts.some(p => p.id === created.id)) {
          this.posts.unshift(created);
        }
        this.closeNewPostModal();
      });
  }

  // Add Comment
  addComment() {
    if (!this.newCommentText.trim() || !this.selectedPost) return;

    if (this.isOfflineMode) {
      const mockComment: TicketComment = {
        id: Math.random().toString(36).substring(2, 9),
        content: this.newCommentText,
        isSolution: false,
        ticketPostId: this.selectedPost.id,
        upvotes: 0,
        hasUpvoted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: this.currentUser?.id || 'curr',
          firstName: this.currentUser?.firstName || 'Moi',
          lastName: this.currentUser?.lastName || '',
          email: this.currentUser?.email || '',
          role: this.currentUser?.role || UserRole.ETUDIANT,
          status: 'ACTIVE' as any,
          avatarUrl: this.currentUser?.avatarUrl || 'https://i.pravatar.cc/150?img=12'
        }
      };
      this.selectedPost.comments.push(mockComment);
      this.newCommentText = '';
      return;
    }

    this.ticketService.addComment(this.selectedPost.id, this.newCommentText)
      .subscribe(comment => {
        // WS will push, but add locally for double security
        if (this.selectedPost && !this.selectedPost.comments.some(c => c.id === comment.id)) {
          this.selectedPost.comments.push(comment);
        }
        this.newCommentText = '';
      });
  }

  // Mark solution
  markAsSolution(post: TicketPost, comment: TicketComment, event: Event) {
    event.stopPropagation();
    if (this.isOfflineMode) {
      post.comments.forEach(c => c.isSolution = false);
      comment.isSolution = true;
      post.status = 'RESOLU';
      return;
    }

    this.ticketService.markCommentAsSolution(comment.id).subscribe(updatedComment => {
      post.comments.forEach(c => {
        if (c.id === updatedComment.id) {
          c.isSolution = true;
        } else {
          c.isSolution = false;
        }
      });
      post.status = 'RESOLU';
    });
  }

  // Simulate offline responses to keep the WOW effect active if backend is shut down
  private simulateOfflineReply(post: TicketPost) {
    const isRoomSearch = post.title.toLowerCase().includes('salle') || post.content.toLowerCase().includes('salle');
    const isTechHelp = post.title.toLowerCase().includes('angular') || post.content.toLowerCase().includes('code') || post.content.toLowerCase().includes('erreur');

    if (!isRoomSearch && !isTechHelp) return;

    setTimeout(() => {
      if (this.selectedPost && this.selectedPost.id === post.id) {
        this.isTyping = true;
        this.typingUser = isRoomSearch ? 'Karim Gharbi (Mentor)' : 'Prof. Amin Ben Salem';
      }
    }, 3000);

    setTimeout(() => {
      if (!this.isTyping) return;
      this.isTyping = false;

      const replyContent = isRoomSearch 
        ? "Salut ! Si tu cherches les salles D, traverse la cour centrale du campus Bloc A et entre dans le Bloc D. Monte au 2ème étage, c'est tout au fond du couloir de droite !"
        : "Bonjour. Si vous utilisez standalone: true, n'oubliez pas d'enregistrer provideHttpClient() dans votre app.config.ts pour injecter HttpClient correctement.";

      const simulatedComment: TicketComment = {
        id: 'c_sim',
        content: replyContent,
        isSolution: false,
        ticketPostId: post.id,
        upvotes: 2,
        hasUpvoted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: isRoomSearch ? 'user_karim' : 'user_amin',
          firstName: isRoomSearch ? 'Karim' : 'Prof. Amin',
          lastName: isRoomSearch ? 'Gharbi' : 'Ben Salem',
          email: 'reply@esprit.tn',
          role: isRoomSearch ? UserRole.ETUDIANT : UserRole.ENSEIGNANT,
          status: 'ACTIVE' as any,
          avatarUrl: isRoomSearch ? 'https://i.pravatar.cc/150?img=12' : 'https://i.pravatar.cc/150?img=68'
        }
      };

      post.comments.push(simulatedComment);
    }, 7000);
  }

  // Cleanup active subscriptions on component close
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.activePostSubscriptions.forEach(sub => sub.unsubscribe());
    clearTimeout(this.typingTimeout);
    this.ticketService.disconnect();
  }
}
