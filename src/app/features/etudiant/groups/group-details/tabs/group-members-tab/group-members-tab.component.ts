import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Search, Users, Info, ChevronRight, Filter, Building, Briefcase, ChevronDown } from 'lucide-angular';

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
export class GroupMembersTabComponent implements OnInit {
  private route = inject(ActivatedRoute);

  groupId = '';
  onlineMembers: GroupMember[] = [];

  readonly Search = Search;
  readonly Users = Users;
  readonly Info = Info;
  readonly ChevronRight = ChevronRight;
  readonly Filter = Filter;
  readonly Building = Building;
  readonly Briefcase = Briefcase;
  readonly ChevronDown = ChevronDown;

  mockOnlineMembers: GroupMember[] = [
    { id: '1', firstName: 'Hichem', lastName: 'Abbassi', avatarUrl: 'https://via.placeholder.com/80', isOnline: true, role: 'STUDENT' },
    { id: '2', firstName: 'Mohamed amin', lastName: 'Abbassi', avatarUrl: 'https://via.placeholder.com/80', isOnline: true, role: 'STUDENT' },
    { id: '3', firstName: 'MohamedKarim', lastName: 'Abbassi', avatarUrl: 'https://via.placeholder.com/80', isOnline: false, role: 'ALUMNI' },
    { id: '4', firstName: 'Nader', lastName: 'ABBASSI', avatarUrl: 'https://via.placeholder.com/80', isOnline: false, role: 'STUDENT' },
    { id: '5', firstName: 'Nadhem', lastName: 'ABBASSI', avatarUrl: 'https://via.placeholder.com/80', isOnline: false, role: 'STUDENT' },
    { id: '6', firstName: 'Nourelhouda', lastName: 'Abbassi', avatarUrl: 'https://via.placeholder.com/80', isOnline: true, role: 'STUDENT' }
  ];

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.groupId = params.get('id') || '';
      this.loadMembers();
    });
  }

  loadMembers() {
    this.onlineMembers = this.mockOnlineMembers;
  }
}
