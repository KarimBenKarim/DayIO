# TaskMaster - Any.do-Inspired Private Task Manager

TaskMaster is a fast, responsive, private task management application built with Node.js, Express, SQLite, React 19, and Tailwind CSS.

## Features
- **Fast Task Entry**: QuickAdd bar with date, priority, and tag pickers.
- **Task Organization**: Today, Upcoming, Inbox, Completed, Custom Lists, and Tags.
- **Subtasks & Details**: Contextual task detail drawer with subtask checklist and note editing.
- **User Isolation**: Private tasks per user with strict SQL-level authorization.
- **Capped Instance**: Hard-coded 6-user maximum registration limit for private use.

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

### Running Development Server
```bash
# Start backend server in dev mode
npm run dev

# In another terminal, start Vite frontend dev server
npm run dev:client
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
