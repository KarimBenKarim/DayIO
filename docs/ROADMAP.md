# Project Roadmap: TaskMaster

## Phase 1: MVP Foundation & Parity (Current Phase)
- [x] SQLite database schema and initialization.
- [x] JWT authentication with 6-user limit.
- [x] Task CRUD, subtasks, lists, and tags API.
- [x] Shared TypeScript API Client SDK (`packages/shared`).
- [x] React single-page frontend web app.
- [x] Native React Native / Expo Android client (`apps/android`).
- [x] Web & Android feature parity for core task workflows (Today, Upcoming, Inbox, Lists, Tags, Subtasks).
- [x] Automated test suite (Auth, Task isolation, SDK, Date utilities).

## Phase 2: Enhanced Task Workflows & Recurrence
- [ ] Task drag-and-drop reordering.
- [ ] Recurrence execution engine (Cron worker to process daily/weekly task generation).
- [ ] Mobile and browser push notifications for task reminders.

## Phase 3: List Sharing & Collaboration
- [ ] Implement `list_shares` permissions (`read`, `write`).
- [ ] Activity stream for shared lists.
