# Architecture Overview: TaskMaster

## 1. System Overview
TaskMaster is built as a lightweight, single-process monorepo application using Express and React, backed by SQLite, with a native React Native / Expo mobile client foundation.

```
+------------------------------------+    +------------------------------------+
|           React Web SPA            |    |     React Native Android Client    |
+------------------------------------+    +------------------------------------+
                   \                                 /
                    \  REST APIs via @do-task-manager/shared
                     \                             /
                      v                           v
+------------------------------------------------------------------------------+
|                                Express Server                                |
|  - JWT Auth Middleware                     - REST Routes (Auth, Tasks...)     |
+------------------------------------------------------------------------------+
                                       | better-sqlite3
                                       v
+------------------------------------------------------------------------------+
|                               SQLite Database                                |
+------------------------------------------------------------------------------+
```

---

## 2. Frontend & Mobile Architecture
* **Web Client (`src/client`)**: React 19 + TypeScript, Tailwind CSS v4, Lucide React, Vite.
* **Android Client (`apps/android`)**: React Native, Expo SDK 52, `expo-secure-store` for hardware-backed JWT storage.
* **Shared SDK (`packages/shared`)**: Platform-agnostic domain types, `TaskFlowApiClient` abstraction, and date utilities (`getLocalDateString`).

---

## 3. Backend Architecture
* **Runtime**: Node.js + Express.
* **Database**: SQLite (`better-sqlite3`) in WAL mode with foreign key enforcement.
* **Authentication**: JWT tokens with bcrypt password hashing.

---

## 4. Security & Data Isolation
* Strict SQL user isolation (`WHERE user_id = ?`).
* List and Tag ownership validation prevents unauthorized foreign list associations.
* Passwords hashed using `bcryptjs` (cost factor 10).
* Hard-coded 6-user registration limit for private deployment.
