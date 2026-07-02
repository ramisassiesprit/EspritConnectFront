import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminMailingService } from '../../../../../core/services/admin-mailing.service';
import { UserService } from '../../../../../core/services/User.service';

@Component({
  selector: 'app-mailing-compose',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mailing-compose.component.html',
  styleUrls: ['./mailing-compose.component.css']
})
export class MailingComposeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private mailingService = inject(AdminMailingService);
  private userService = inject(UserService);

  mailForm!: FormGroup;
  users: any[] = [];
  filteredUsers: any[] = [];
  loading = false;
  sending = false;
  successMessage = '';
  errorMessage = '';

  selectAll = false;

  ngOnInit() {
    this.mailForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      searchUser: ['']
    });

    this.loadUsers();

    this.mailForm.get('searchUser')?.valueChanges.subscribe(value => {
      this.filterUsers(value);
    });
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data.map(u => ({ ...u, selected: false }));
        this.filteredUsers = [...this.users];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching users', err);
        this.errorMessage = 'Erreur lors du chargement des utilisateurs.';
        this.loading = false;
      }
    });
  }

  filterUsers(searchTerm: string) {
    if (!searchTerm) {
      this.filteredUsers = [...this.users];
      return;
    }
    const lowerTerm = searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u => 
      (u.firstName && u.firstName.toLowerCase().includes(lowerTerm)) ||
      (u.lastName && u.lastName.toLowerCase().includes(lowerTerm)) ||
      (u.email && u.email.toLowerCase().includes(lowerTerm))
    );
  }

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    this.filteredUsers.forEach(u => u.selected = this.selectAll);
  }

  toggleUserSelection(user: any) {
    user.selected = !user.selected;
    this.updateSelectAllStatus();
  }

  updateSelectAllStatus() {
    this.selectAll = this.filteredUsers.length > 0 && this.filteredUsers.every(u => u.selected);
  }

  getSelectedEmails(): string[] {
    return this.users.filter(u => u.selected).map(u => u.email);
  }

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';
    
    if (this.mailForm.invalid) {
      this.mailForm.markAllAsTouched();
      return;
    }

    const selectedEmails = this.getSelectedEmails();
    if (selectedEmails.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins un destinataire.';
      return;
    }

    this.sending = true;
    const request = {
      emails: selectedEmails,
      subject: this.mailForm.get('subject')?.value,
      message: this.mailForm.get('message')?.value
    };

    this.mailingService.sendAdminMail(request).subscribe({
      next: () => {
        this.sending = false;
        this.successMessage = 'Email envoyé avec succès !';
        this.mailForm.reset({ searchUser: '' });
        this.users.forEach(u => u.selected = false);
        this.selectAll = false;
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        console.error('Error sending mail', err);
        this.sending = false;
        this.errorMessage = 'Erreur lors d\'envoi de l\'email.';
      }
    });
  }
}
