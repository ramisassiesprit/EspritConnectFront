import { Component } from '@angular/core';
import { MyCommunityComponent } from './my-community/my-community.component';
import { JobsBoardComponent } from './jobs-board/jobs-board.component';
import { ResourcesWidgetComponent } from './resources-widget/resources-widget.component';
import { RecentFeedPostsComponent } from './recent-feed-posts/recent-feed-posts.component';
import { FacebookWidgetComponent } from './facebook-widget/facebook-widget.component';

@Component({
  selector: 'app-home',
  imports: [
    MyCommunityComponent,
    JobsBoardComponent,
    ResourcesWidgetComponent,
    RecentFeedPostsComponent,
    FacebookWidgetComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

}
