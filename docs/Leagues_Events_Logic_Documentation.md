# Leagues & Events Logic Documentation

This document explains how Leagues and Events are designed and implemented across the database (Prisma/PostgreSQL), backend (NestJS), and mobile app (React Native with TypeScript, Zustand, React Navigation). It mirrors the style of the Auth/Messaging docs and is intended to onboard new developers quickly.

---

## 1) Domain Overview

- Leagues: Competitive groups with rules and a points-based leaderboard. Admins can manage members, rules, and points.
- Events: Time-bounded activities that can be standalone or linked to a league. Events have participants, rules, and an event leaderboard. When an event is linked to a league, points assigned in the event contribute to the league leaderboard.
- Invitations: Support inviting non-friends into events via shareable codes/links that can be used after signing up.

---

## 2) Database Models (Prisma)

Key models in `schema.prisma` (abbreviated for clarity):

- League
  - Fields: id, name, description, adminId, isPrivate, inviteCode, createdAt
  - Relations: admins (LeagueAdmin[]), members (LeagueMember[]), rules (LeagueRule[]), events (Event[])
- LeagueAdmin
  - Fields: id, leagueId, userId, grantedBy, grantedAt
  - Unique: (userId, leagueId)
- LeagueMember
  - Fields: id, leagueId, userId, points, rank, joinedAt
  - Unique: (userId, leagueId)
- LeagueRule
  - Fields: id, leagueId, title, description, points, category (PointCategory)
- Event
  - Fields: id, title, description, leagueId?, adminId, startDate, endDate, isPrivate, inviteCode?, hasScoring, createdAt
  - Relations: participants (EventParticipant[]), rules (EventRule[]), invitations (EventInvitation[])
- EventParticipant
  - Fields: id, eventId, userId, points, rank, joinedAt
  - Unique: (eventId, userId)
- EventRule
  - Fields: id, eventId, title, description, points, category (PointCategory)
- EventInvitation
  - Fields: id, eventId, code (unique), email?, phoneNumber?, status (InvitationStatus), expiresAt

Enums:
- PointCategory: WINS | PARTICIPATION | BONUS | PENALTY
- InvitationStatus: PENDING | ACCEPTED | EXPIRED | CANCELLED

Indexes:
- All FK relations are indexed. Composite uniques on membership/participants.

---

## 3) Backend (NestJS)

### 3.1 Modules
- LeaguesModule: Manages leagues, admins, members, rules, points, leaderboard.
- EventsModule: Manages events, participants, rules, points, leaderboard, invitations.

Both use `PrismaService` and `JwtAuthGuard` for DB and auth.

### 3.2 Leagues Service Highlights
- Creation: Creator becomes admin and member automatically.
- Rules: CRUD with validation; categories default to WINS; description <= 200 chars; title min length 1.
- Points Assignment: Admins can assign points (positive/negative). After updates, league rankings are recalculated (order by points desc, joinedAt asc).
- Leaderboard: Returns normalized entries `{ userId, username, avatar, totalPoints, rank }` expected by the app.

### 3.3 Events Service Highlights
- Create Event: Creator becomes admin + participant (ranked later). Supports standalone or linked to league.
- Participants: Admins can add/remove participants; users can join/leave (subject to privacy/invite code rules and capacity).
- Rules: Admins define event rules similar to league rules.
- Assign Points: Updates event participant’s points, recalculates event rankings, and (if linked) updates the league member’s points + recalculates league leaderboard.
- Invitations: Create invitation codes; accept codes; enforce expiry and status transitions.

### 3.4 Controllers (selected endpoints)
- Leagues
  - GET /leagues/:id, GET /leagues/:id/members, GET /leagues/:id/rules
  - POST /leagues (create), POST /leagues/:id/join
  - PUT /leagues/:id/rules/:ruleId (update rule)
  - POST points assignment endpoint (in service exposed via controller)
- Events
  - POST /events (create); GET /events; GET /events/league/:leagueId; GET /events/:id
  - Participants: GET /events/:id/participants, POST /events/:id/participants, DELETE /events/:id/participants/:userId
  - Rules: GET /events/:id/rules, POST /events/:id/rules
  - Points: POST /events/:id/points
  - Leaderboard: GET /events/:id/leaderboard
  - Invitations: POST /events/:id/invitations, POST /events/:id/invitations/use

### 3.5 Validation, Guards, Errors
- Guards: `JwtAuthGuard` on all event/league routes.
- Validation: DTOs enforce title length (>=1), description (<=200), points range (e.g., -1000..1000), enums.
- Errors: `NotFoundException`, `ForbiddenException`, `ConflictException` with clear messages for the app.

---

## 4) Mobile App (React Native)

### 4.1 Navigation
- Tabs: Friends / Leagues / Events
- Leagues: LeaguesList → LeagueDetails (Manage: Members, Admin, Rules, Assign Points, Leaderboard)
- Events: EventsList → EventDetails (Participants, Rules & Assign, Leaderboard)
- InviteCode: Accept friend codes and (guided) event codes. Deep links supported.

### 4.2 API Clients
- `leaguesApi.ts`: get/add/remove members, grant/revoke admin, get/create/update rules, assign points, get leaderboard, create/join league.
- `eventsApi.ts`: create/get events, get/add/remove participants, get/create rules, assign points, leaderboard, create/use invitations.

All calls include auth headers and basic error handling; UI shows alerts/banners on failure.

### 4.3 Screens & UX Patterns
- Leagues
  - LeaguesScreen: Filter chips (All/My/Public), public badge, banner on Public filter, create button.
  - LeagueDetails: Member count and “You’re admin” pill; quick Manage actions (Members/Admin/Rules/Assign/Leaderboard/Create Event in league).
  - LeagueRulesScreen: Admin inline editing, chips for category, validations, Save/Cancel.
  - LeagueRulesReadScreen: Read-only list with ✎ Edit (admin) and ➕ Assign shortcuts.
  - LeagueAssignPointsScreen: Choose member, pick rule or custom points, category chips, reason, submit.
  - LeagueLeaderboardScreen: Rankings with + Assign Points link for admins.
- Events
  - EventsScreen: Filters (All/Standalone/per-league chips), badges per card, create floating action.
  - EventCreateScreen: Standalone vs Link-to-League selector; league chips; validation; privacy/scoring switches.
  - EventDetailsScreen: Linked league badge/link; Participants / Rules & Assign / Leaderboard; 📤 Share/Invite (generate code + share sheet modal).
  - EventParticipantsScreen: List/add/remove participants (admin).
  - EventRulesScreen: Create rules; assign points with participants list and category chips.
  - EventLeaderboardScreen: Rankings; refresh on focus.

### 4.4 Invitations & Deep Links
- Generate: From EventDetails → “Share/Invite” → creates code and opens share sheet.
- Accept: Deep link format `friendsleague://event-invite?eventId=EVENT_ID&code=INVITECODE`
  - App handles link on launch/in-foreground; requires sign-in; then calls `eventsApi.useInvitation` and navigates to `EventDetails`.
- Non-friends must sign up to proceed; login gate enforced before join.

### 4.5 Loading/Empty/Error States
- Pull-to-refresh on primary lists.
- Empty states with clear CTAs (create/browse public/assign points).
- Alerts for errors; consistent styling for chips, cards, headers.

---

## 5) Leaderboard Calculation Rules

- Event leaderboard: Ordered by points desc, then joinedAt asc. Ranks updated after each assignment.
- League leaderboard: Ordered by total points desc, then joinedAt asc. Updated after league points assignment or event-linked updates.

---

## 6) Admin vs Member Permissions

- League
  - Admin: manage members, grant/revoke admin, create/edit rules, assign points, create events in league.
  - Member: view rules, leaderboard; participate.
- Event
  - Admin: add/remove participants, create rules, assign points, create invitations.
  - Participant: view rules, leaderboard; receive points; cannot perform admin actions.

UI hides admin-only actions when the user is not an admin.

---

## 7) Security & Validation

- JWT-based access for all API endpoints.
- Private leagues/events: Hidden unless member/admin. Joining requires a valid invite code.
- Invite codes: Random uppercase alphanumeric; event codes expire and track status.
- Input validation on all DTOs; sanitization on strings.

---

## 8) E2E Scenarios (QA Reference)

- League: Create → add rules → add member → assign points → verify leaderboard & persistence
- Event (standalone): Create → invite non-friend → sign up → accept → assign points → verify leaderboard
- Event (league-linked): Create in league → assign points → verify league leaderboard sync

---

## 9) API Reference (Selected)

- Leagues
  - GET /leagues/:id
  - GET /leagues/:id/members
  - GET /leagues/:id/rules
  - POST /leagues
  - POST /leagues/:id/join
  - PUT /leagues/:id/rules/:ruleId
  - POST /leagues/:id/points (assign)
- Events
  - POST /events
  - GET /events
  - GET /events/league/:leagueId
  - GET /events/:id
  - GET /events/:id/participants
  - POST /events/:id/participants
  - DELETE /events/:id/participants/:userId
  - GET /events/:id/rules
  - POST /events/:id/rules
  - POST /events/:id/points
  - GET /events/:id/leaderboard
  - POST /events/:id/invitations
  - POST /events/:id/invitations/use

Each endpoint uses standard JSON DTOs; see services/DTOs in code for exact fields and constraints.

---

## 10) Future Enhancements

- Realtime updates via Socket.io for participants, rules, and leaderboard.
- Public league discovery service and search.
- Admin transfer on leagues/events; archive/hide past events.
- Push notifications: invites, scoring, reminders.

---

Document updated alongside feature phases 3.A–3.I.

---

## 11) Sequence Flows

### 11.1 Create League → Add Rules → Add Member → Assign Points → Leaderboard
1. Mobile: POST /leagues with { name, description?, isPrivate }
2. Backend: Creator becomes admin + member; league created; returns league
3. Mobile: Navigate to LeagueDetails; show member count and admin pill
4. Mobile: POST /leagues/:id/rules (repeat 2–3x) with { title, description?, points, category }
5. Backend: Rules created; validation enforced; returns rule list
6. Mobile: Add member (admin): POST /leagues/:id/members { userId }
7. Backend: Adds LeagueMember; returns updated members
8. Mobile (admin): Assign points via dedicated screen: POST /leagues/:id/points { userId, points, category, reason?, ruleId? }
9. Backend: Updates league member points; recalculates ranks; returns success
10. Mobile: GET /leagues/:id/leaderboard → UI updates ranks and totals

### 11.2 Create Event (Linked) → Invite Non-friend → Score → League Sync
1. Mobile: POST /events with { title, leagueId, hasScoring, isPrivate? }
2. Backend: Creator becomes admin + participant; returns event
3. Mobile (admin): Generate invite: POST /events/:id/invitations
4. Backend: Creates EventInvitation with code; returns { code }
5. Mobile: Opens share sheet with deep link friendsleague://event-invite?eventId=E&code=C
6. Guest installs/logs in → opens link
7. Mobile: Deep-link handler calls POST /events/:id/invitations/use { code }
8. Backend: Validates invitation and user; joins participant; returns event
9. Mobile (admin): Assign points: POST /events/:id/points { userId, points, category, reason? }
10. Backend: Updates EventParticipant points; recalculates event ranks; if leagueId present, increments LeagueMember points and recalculates league ranks
11. Mobile: GET /events/:id/leaderboard and GET /leagues/:leagueId/leaderboard → both reflect updated totals

### 11.3 Create Event (Standalone) → Invite → Score
1. Mobile: POST /events with { title, hasScoring, isPrivate? }
2. Backend: Returns event; no league linkage
3. Mobile: Invitations/acceptance identical to 11.2 (no league sync)
4. Mobile (admin): Assign points → Event leaderboard updates only

### 11.4 Accept Event Invite Deep Link (Login Gate)
1. User taps link friendsleague://event-invite?eventId=E&code=C
2. Mobile App.tsx Linking handler parses eventId/code
3. If not authenticated → shows sign-in prompt; after login continue
4. Mobile calls POST /events/:id/invitations/use { code }
5. Backend validates invitation; adds participant; returns event
6. Mobile navigates to EventDetails(E)

### 11.5 Admin vs Non-admin UI Gating
1. Mobile fetches members/admins for league/event
2. If current user is admin → show admin-only CTAs (grant/revoke, edit rule, assign points)
3. If not admin → hide admin CTAs; read-only views remain
