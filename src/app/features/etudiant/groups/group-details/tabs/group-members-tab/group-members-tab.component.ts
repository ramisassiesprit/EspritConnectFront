import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Search, Users, Info, ChevronRight, Filter, Building, Briefcase, ChevronDown, User } from 'lucide-angular';
import { GroupService } from '../../../../../../core/services/group.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  isOnline?: boolean;
  role: string;
}

@Component({
  selector: 'app-group-members-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './group-members-tab.component.html',
  styleUrls: ['./group-members-tab.component.css']
})
export class GroupMembersTabComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);

  groupId = '';
  onlineMembers: GroupMember[] = [];
  filteredMembers: GroupMember[] = [];

  // Filters & Sorting state
  searchQuery = '';
  filterFirstName = '';
  filterLastName = '';
  filterAffiliation = '';
  sortOption = 'Alphabetically';

  readonly Search = Search;
  readonly Users = Users;
  readonly Info = Info;
  readonly ChevronRight = ChevronRight;
  readonly Filter = Filter;
  readonly Building = Building;
  readonly Briefcase = Briefcase;
  readonly ChevronDown = ChevronDown;
  readonly User = User;

  private stompClient: any = null;

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.groupId = params.get('id') || '';
      if (this.groupId) {
        this.loadMembers();
        this.connectWebSocket();
      }
    });
  }

  loadMembers() {
    this.groupService.getGroupMembers(this.groupId).subscribe({
      next: (data) => {
        this.onlineMembers = data.map(m => ({
          id: m.userId,
          firstName: m.firstName || m.userFullName?.split(' ')[0] || '',
          lastName: m.lastName || m.userFullName?.split(' ')[1] || '',
          avatarUrl: m.avatarUrl || '',
          isOnline: m.isOnline || false,
          role: m.userRole || 'ETUDIANT'
        }));
        this.applyFiltersAndSorting();
      },
      error: (err) => {
        console.error('Failed to load group members initially', err);
      }
    });
  }

  connectWebSocket() {
    const socket = new SockJS('http://localhost:8086/EspritConnect/ws-chat');
    this.stompClient = Stomp.over(socket);

    // Disable log spew in console
    this.stompClient.debug = () => {};

    const currentUser = this.authService.currentUser();
    this.stompClient.connectHeaders = {
      userId: currentUser ? currentUser.userId : ''
    };

    this.stompClient.onConnect = (frame: any) => {
      console.log('Connected to group members WebSocket for group:', this.groupId);
      this.stompClient.subscribe(`/topic/group/${this.groupId}/members`, (message: { body: string }) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          this.onlineMembers = data.map((m: any) => ({
            id: m.userId,
            firstName: m.firstName || m.userFullName?.split(' ')[0] || '',
            lastName: m.lastName || m.userFullName?.split(' ')[1] || '',
            avatarUrl: m.avatarUrl || '',
            isOnline: m.isOnline || false,
            role: m.userRole || 'ETUDIANT'
          }));
          this.applyFiltersAndSorting();
        }
      });
    };

    this.stompClient.onStompError = (frame: any) => {
      console.error('Group members WebSocket error:', frame);
    };

    this.stompClient.activate();
  }

  applyFiltersAndSorting() {
    let temp = [...this.onlineMembers];

    // Search query filter (matches full name)
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(m => 
        (m.firstName + ' ' + m.lastName).toLowerCase().includes(q)
      );
    }

    // First name filter
    if (this.filterFirstName.trim()) {
      const fn = this.filterFirstName.toLowerCase();
      temp = temp.filter(m => m.firstName.toLowerCase().includes(fn));
    }

    // Last name filter
    if (this.filterLastName.trim()) {
      const ln = this.filterLastName.toLowerCase();
      temp = temp.filter(m => m.lastName.toLowerCase().includes(ln));
    }

    // Sorting
    if (this.sortOption === 'Alphabetically') {
      temp.sort((a, b) => (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName));
    } else if (this.sortOption === 'Recently online') {
      // Sort online users first
      temp.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
    }

    this.filteredMembers = temp;
  }

  resetFilters() {
    this.searchQuery = '';
    this.filterFirstName = '';
    this.filterLastName = '';
    this.filterAffiliation = '';
    this.sortOption = 'Alphabetically';
    this.applyFiltersAndSorting();
  }

  disconnectWebSocket() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log('Disconnected group members WebSocket');
    }
  }

  ngOnDestroy() {
    this.disconnectWebSocket();
  }
}
