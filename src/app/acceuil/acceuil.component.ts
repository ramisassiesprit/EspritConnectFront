import { Component, ViewChild } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { JobsComponent } from "./jobs/jobs.component";

@Component({
  selector: 'app-acceuil',
  standalone: true,
  imports: [NavbarComponent, JobsComponent],
  templateUrl: './acceuil.component.html',
  styleUrl: './acceuil.component.css'
})
export class AcceuilComponent {
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

  onGetStarted() {
    if (this.navbar) {
      this.navbar.toggleJoinModal();
    }
  }
}
