# Architecture Overview: TaskMaster

## 1. System Overview
TaskMaster is built as a lightweight, single-process monorepo application using Express and React, backed by SQLite.

```
+-------------------------------------------------------------+
|                      React Web SPA                          |
+-------------------------------------------------------------+
                              | REST APIs
                              v
+-------------------------------------------------------------+
|                      Express Server                         |
|  - JWT Auth Middleware      - REST Routes (Auth, Tasks...) |
+-------------------------------------------------------------+
                              | better-sqlite3
                              v
+-------------------------------------------------------------+
|                      SQLite Database                        |
+-------------------------------------------------------------+
```

---

## 2. Frontend Architecture
* **Framework**: React 19 + TypeScript.
* **Styling**: Tailwind CSS v4.
* **Icons**: Lucide React.
* **State Management**: React Context (`AuthContext`, `TaskContext`).
* **Client SDK**: Shared `TaskFlowApiClient` (`packages/shared`).

---

## 3. Backend Architecture
* **Runtime**: Node.js + Express.
* **Database**: SQLite (`better-sqlite3`) in WAL mode with foreign key enforcement.
* **Authentication**: JWT tokens with bcrypt password hashing.

---

## 4. Security & Data Isolation
* Users cannot query or mutate data belonging to other users. Every query filters explicitly by `user_id`.
* Passwords are salted and hashed using `bcryptjs` (cost factor 10).
* Registration is capped at 6 users maximum.
