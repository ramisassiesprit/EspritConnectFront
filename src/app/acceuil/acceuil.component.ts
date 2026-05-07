import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { JobsComponent } from "./jobs/jobs.component";

@Component({
  selector: 'app-acceuil',
  imports: [NavbarComponent, JobsComponent],
  templateUrl: './acceuil.component.html',
  styleUrl: './acceuil.component.css'
})
export class AcceuilComponent {

}
