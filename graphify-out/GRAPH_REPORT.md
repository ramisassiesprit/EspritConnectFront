# Graph Report - .  (2026-05-13)

## Corpus Check
- 119 files · ~90,834 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 303 nodes · 479 edges · 30 communities (9 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]

## God Nodes (most connected - your core abstractions)
1. `ProfileService` - 24 edges
2. `ProfileComponent` - 24 edges
3. `UserService` - 20 edges
4. `AuthService` - 19 edges
5. `NavbarComponent` - 14 edges
6. `User` - 13 edges
7. `UserRole` - 12 edges
8. `ChatService` - 12 edges
9. `GroupCreateComponent` - 9 edges
10. `EncryptionService` - 8 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (30 total, 21 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.0
Nodes (13): AppComponent, appConfig, routes, adminGuard(), etudiantGuard(), authInterceptor(), refreshTokenSubject, AuthRequest (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.0
Nodes (6): ChatListComponent, FindMentorComponent, Message, User, UserStatus, UserService

### Community 2 - "Community 2"
Cohesion: 0.0
Nodes (8): GroupCreateComponent, GroupsComponent, Group, GroupCreateRequest, GroupPrivacy, GroupService, NavItem, SubItem

### Community 3 - "Community 3"
Cohesion: 0.0
Nodes (6): AdminShellComponent, EtudiantShellComponent, NavbarComponent, AdminSidebarComponent, NavItem, SidebarComponent

### Community 4 - "Community 4"
Cohesion: 0.0
Nodes (10): BadgeModalComponent, environment, FacebookWidgetComponent, AiChatResponse, JobsBoardComponent, Badge, MyCommunityComponent, RecentFeedPostsComponent (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.0
Nodes (7): HelpMentoringFormComponent, EspritProfile, OtherEducation, Skill, WillingToHelp, WorkExperience, UserDetailsComponent

### Community 8 - "Community 8"
Cohesion: 0.0
Nodes (5): AcceuilComponent, AiChatBubbleComponent, ChatMessage, GemAiServiceService, JobsComponent

## Knowledge Gaps
- **18 isolated node(s):** `refreshTokenSubject`, `AiChatResponse`, `AdminShellComponent`, `NavItem`, `ChatMessage` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.