import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../core/services/User.service';
import { UserRole } from '../../../../core/models/user-role.enum';
import { forkJoin } from 'rxjs';

interface AffiliationRow {
  name: string;
  role: UserRole;
  members: number;
  viewPages: string;
  postContent: string;
  message: string;
  contactDetails: string;
  directory: string;
  hasClass: boolean;
}

@Component({
  selector: 'app-admin-affiliations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './affiliations.component.html',
  styleUrl: './affiliations.component.css'
})
export class AffiliationsComponent implements OnInit {
  private userService = inject(UserService);

  loading = true;
  exportLoading = false;
  exportRole: string = 'ALL';

  rows: AffiliationRow[] = [
    { name: 'Student', role: UserRole.ETUDIANT, members: 0, viewPages: 'Some', postContent: 'Some', message: 'All', contactDetails: 'All', directory: 'All', hasClass: true },
    { name: 'Alumni', role: UserRole.ALUMNI, members: 0, viewPages: 'Some', postContent: 'Some', message: 'All', contactDetails: 'All', directory: 'All', hasClass: true },
    { name: 'Company', role: UserRole.ENTREPRISE, members: 0, viewPages: 'Some', postContent: 'Some', message: 'All', contactDetails: 'All', directory: 'All', hasClass: false },
    { name: 'Teacher/Staff', role: UserRole.ENSEIGNANT, members: 0, viewPages: 'Some', postContent: 'All', message: 'All', contactDetails: 'All', directory: 'All', hasClass: false }
  ];

  ngOnInit() {
    const requests = this.rows.map(row => this.userService.getUsersByRole(row.role));
    
    forkJoin(requests).subscribe({
      next: (results) => {
        this.rows.forEach((row, index) => {
          row.members = results[index].length;
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading members count', err);
        this.loading = false;
      }
    });
  }

  toggleHasClass(row: AffiliationRow) {
    row.hasClass = !row.hasClass;
  }

  exportUsers() {
    this.exportLoading = true;
    const request = this.exportRole === 'ALL' 
      ? this.userService.getAllUsers()
      : this.userService.getUsersByRole(this.exportRole as UserRole);

    request.subscribe({
      next: (users) => {
        this.downloadCSV(users);
        this.exportLoading = false;
      },
      error: (err) => {
        console.error('Error exporting users', err);
        this.exportLoading = false;
        alert("Une erreur s'est produite lors de l'exportation.");
      }
    });
  }

  private downloadCSV(users: any[]) {
    if (!users || users.length === 0) {
      alert("Aucun utilisateur à exporter.");
      return;
    }

    const headers = ['Code', 'Nom', 'Prénom', 'Email', 'Rôle', 'Statut'];
    const csvRows = [headers.join(',')];

    users.forEach(u => {
      // Escape quotes and fields containing commas
      const lastName = u.lastName ? `"${u.lastName.replace(/"/g, '""')}"` : '';
      const firstName = u.firstName ? `"${u.firstName.replace(/"/g, '""')}"` : '';
      const email = u.email ? `"${u.email.replace(/"/g, '""')}"` : '';

      const row = [
        u.code || '',
        lastName,
        firstName,
        email,
        u.role || '',
        u.status || ''
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_utilisateurs_${this.exportRole}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
