import { Router } from 'express';
import { db } from '../db/client.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import crypto from 'crypto';

export const subtasksRouter = Router();
subtasksRouter.use(requireAuth);

subtasksRouter.post('/tasks/:taskId/subtasks', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const taskId = req.params.taskId as string;
  const { title } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Subtask title is required' });
    return;
  }

  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const subtaskId = crypto.randomUUID();
  db.prepare('INSERT INTO subtasks (id, task_id, title) VALUES (?, ?, ?)').run(subtaskId, taskId, title);

  const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId) as any;
  subtask.completed = Boolean(subtask.completed);
  res.status(201).json({ subtask });
});

subtasksRouter.put('/subtasks/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const { title, completed, position } = req.body;

  const subtaskRow = db.prepare(`
    SELECT s.* FROM subtasks s
    JOIN tasks t ON s.task_id = t.id
    WHERE s.id = ? AND t.user_id = ?
  `).get(id, userId);

  if (!subtaskRow) {
    res.status(404).json({ error: 'Subtask not found' });
    return;
  }

  const completedVal = completed !== undefined ? (completed ? 1 : 0) : undefined;

  db.prepare(`
    UPDATE subtasks
    SET title = COALESCE(?, title),
        completed = COALESCE(?, completed),
        position = COALESCE(?, position)
    WHERE id = ?
  `).run(title, completedVal, position, id);

  const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as any;
  subtask.completed = Boolean(subtask.completed);
  res.json({ subtask });
});

subtasksRouter.delete('/subtasks/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const subtaskRow = db.prepare(`
    SELECT s.* FROM subtasks s
    JOIN tasks t ON s.task_id = t.id
    WHERE s.id = ? AND t.user_id = ?
  `).get(id, userId);

  if (!subtaskRow) {
    res.status(404).json({ error: 'Subtask not found' });
    return;
  }

  db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
  res.json({ success: true });
});
