# TaskMaster - Any.do-Inspired Private Task Manager

TaskMaster is a fast, responsive, private task management application built with Node.js, Express, SQLite, React 19, and Tailwind CSS, featuring a native React Native / Expo mobile client foundation.

## Features
- **Fast Task Entry**: QuickAdd bar with date, priority, and tag pickers.
- **Task Organization**: Today, Upcoming, Inbox, Completed, Custom Lists, and Tags.
- **Subtasks & Details**: Contextual task detail drawer with subtask checklist and note editing.
- **User Isolation**: Private tasks per user with strict SQL-level authorization.
- **Capped Instance**: Hard-coded 6-user maximum registration limit for private use.
- **Cross-Platform**: Web Single Page App + Native React Native Android Client (`apps/android`) using `expo-secure-store`.

---

## Setup & Running

### Prerequisites
- Node.js >= 18
- npm

### Installation
```bash
npm install
```

### Database Setup
Initialize SQLite database schema (`data/taskmaster.db`):
```bash
npm run db:init
```

### Running Development Servers

Terminal 1 (Backend API on port 3000):
```bash
npm run dev
```

Terminal 2 (Frontend Dev Server on port 5173):
```bash
npm run dev:client
```

### Running Android Client

```bash
# Set EXPO_PUBLIC_API_URL (defaults to http://10.0.2.2:3000/api for Android emulator)
cd apps/android
npm start
```

### Running Production Build
```bash
npm run build
npm start
```

### Running Tests
```bash
npm test
```
