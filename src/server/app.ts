import express from 'express';
import cors from 'cors';
import path from 'path';
import { authRouter } from './routes/auth.js';
import { listsRouter } from './routes/lists.js';
import { tasksRouter } from './routes/tasks.js';
import { subtasksRouter } from './routes/subtasks.js';
import { tagsRouter } from './routes/tags.js';

export const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/lists', listsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api', subtasksRouter);
app.use('/api/tags', tagsRouter);

// Serve static frontend in production
const distClientPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distClientPath));

app.get('{*path}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }
  res.sendFile(path.resolve(distClientPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend not built yet. Run npm run build.');
    }
  });
});
