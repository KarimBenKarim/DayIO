# Project Roadmap: TaskMaster

## Phase 1: MVP Foundation (Current Phase)
- [x] SQLite database schema and initialization.
- [x] JWT authentication with 6-user limit.
- [x] Task CRUD, subtasks, lists, and tags API.
- [x] Shared TypeScript API Client SDK (`packages/shared`).
- [x] React single-page frontend web app.
- [x] Core automated test suite (Auth, Task isolation, SDK).

## Phase 2: Enhanced Task Workflows & Recurrence
- [ ] Task drag-and-drop reordering.
- [ ] Recurrence execution engine (Cron worker to process daily/weekly task generation).
- [ ] Browser push notifications for task reminders.

## Phase 3: List Sharing & Collaboration
- [ ] Implement `list_shares` permissions (`read`, `write`).
- [ ] Activity stream for shared lists.
