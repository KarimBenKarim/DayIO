# Product Specification: TaskMaster MVP

## 1. Application Purpose & Scope
TaskMaster is a private task-management web application inspired by core workflows of modern task management tools (such as Any.do). It prioritizes rapid task entry, high usability, minimal visual friction, and strict user data isolation.

**Scope Constraint:** Personal/private deployment designed for up to **6 users total**.

---

## 2. Target Users
* Primary: Individual user managing personal day-to-day tasks, errands, and work projects.
* Secondary: Up to 5 trusted friends/family members running on the same private instance.

---

## 3. Core Domain Entities
1. **User**: Authentication credentials, name, and profile.
2. **List / Project**: Custom container for organizing tasks (e.g., Work, Shopping).
3. **Task**: Primary task entity supporting title, notes, completion status, due date/time, priority, position, list assignment.
4. **Subtask**: Checklist item belonging to a task.
5. **Tag**: Micro-categorization label (e.g., #urgent, #errands).
6. **Reminder**: Scheduled notification trigger (future integration).
7. **Recurrence**: Pattern specification for recurring tasks.

---

## 4. MVP Functionality
* **Auth**: Secure JWT registration and login (capped at 6 users max).
* **Task Management**: Create, view, edit notes/due date/priority, complete/uncomplete, and delete tasks.
* **Views**: Today, Upcoming, Inbox, Completed, Custom Lists, and Tag filtering.
* **Subtasks**: Add and toggle checklist subtasks per task.
* **User Isolation**: SQL-level data scoping (`WHERE user_id = ?`).

---

## 5. Future Functionality
* Multi-user list sharing (`list_shares`).
* Real-time push notifications / browser notifications.
* Recurring task automated generation.
* Mobile app client integration.

---

## 6. UX Decisions
* **Fast Task Entry**: Fixed top QuickAdd input bar supporting inline priority, date, and tag selection.
* **Contextual Drawer**: Clicking a task opens a details drawer without losing page context.
* **Minimalist Aesthetic**: Dark-mode primary theme with responsive layout.
