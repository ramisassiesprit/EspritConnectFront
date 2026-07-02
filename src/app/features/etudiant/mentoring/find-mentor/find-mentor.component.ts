import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MentorMatch, MentorshipService } from '../../../../core/services/mentorship.service';
import { UserService } from '../../../../core/services/User.service';

@Component({
  selector: 'app-find-mentor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './find-mentor.component.html',
  styleUrls: ['./find-mentor.component.css']
})
export class FindMentorComponent implements OnInit {
  categories: { name: string, count: number, users: any[] }[] = [];
  selectedCategory: any = null;
  filteredUsers: any[] = [];

  recommendations: MentorMatch[] = [];
  suggestedMentors: MentorMatch[] = [];
  isSuggestionsLoading = true;

  searchQuery = '';
  filterFirstName = '';
  filterLastName = '';
  filterAffiliation = '';
  
  isLoading = true;
  
  private authService = inject(AuthService);
  private mentorshipService = inject(MentorshipService);
  private userService = inject(UserService);

  ngOnInit() {
    this.loadMentorsBySpeciality();
    this.loadSuggestions();
  }

  private loadSuggestions() {
    const userId = this.authService.currentUser()?.userId;

    if (!userId) {
      this.recommendations = [];
      this.suggestedMentors = [];
      this.isSuggestionsLoading = false;
      return;
    }

    this.mentorshipService.getRecommendedMentors(userId).subscribe({
      next: (recommendations) => {
        this.recommendations = recommendations ?? [];
        const ranked = [...this.recommendations]
          .filter(match => (match.matchPercentage ?? 0) > 0)
          .sort((a, b) => (b.matchPercentage ?? 0) - (a.matchPercentage ?? 0))
          .slice(0, 10);

        this.suggestedMentors = ranked;

        this.isSuggestionsLoading = false;
      },
      error: (error) => {
        console.error('Failed to load mentor recommendations', error);
        this.recommendations = [];
        this.suggestedMentors = [];
        this.isSuggestionsLoading = false;
      }
    });
  }

  private loadMentorsBySpeciality() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        const mentors = users.filter(u =>
          u.willingToHelps?.some(w => w.offerMentor && w.offerMentor.trim() !== '')
        );

        if (mentors.length === 0) {
          this.categories = [];
          this.isLoading = false;
          return;
        }

        const groups = mentors.reduce((acc: any, user: any) => {
          const espritProfile = user.espritProfile;
          const field = espritProfile?.fieldOfStudy || user.jobFunction || user.industry || 'General';
          if (!acc[field]) acc[field] = [];
          acc[field].push({ user, profile: espritProfile });
          return acc;
        }, {} as Record<string, any[]>);

        this.categories = Object.keys(groups).map(key => ({
          name: key,
          count: groups[key].length,
          users: groups[key]
        })).sort((a, b) => b.count - a.count);

        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  selectCategory(cat: any) {
    this.selectedCategory = cat;
    this.applyFilters();
  }

  backToCategories() {
    this.selectedCategory = null;
    this.searchQuery = '';
    this.filterFirstName = '';
    this.filterLastName = '';
    this.filterAffiliation = '';
  }

  applyFilters() {
    if (!this.selectedCategory) return;
    
    this.filteredUsers = this.selectedCategory.users.filter((m: any) => {
      let match = true;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const fullName = (m.user.firstName + ' ' + m.user.lastName).toLowerCase();
        if (!fullName.includes(q)) match = false;
      }
      if (this.filterFirstName && !m.user.firstName.toLowerCase().includes(this.filterFirstName.toLowerCase())) match = false;
      if (this.filterLastName && !m.user.lastName.toLowerCase().includes(this.filterLastName.toLowerCase())) match = false;
      return match;
    });
  }

  resetFilters() {
    this.backToCategories();
  }

}

