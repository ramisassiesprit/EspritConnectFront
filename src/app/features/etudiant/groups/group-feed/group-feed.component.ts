import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-group-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-feed.component.html',
  styleUrls: ['./group-feed.component.css']
})
export class GroupFeedComponent {
  private route = inject(ActivatedRoute);
  groupId = this.route.snapshot.paramMap.get('id');
}
