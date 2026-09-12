import { Router } from 'express';
import { db } from '../db/client.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import crypto from 'crypto';

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

function getTaskWithDetails(taskId: string, userId: string) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId) as any;
  if (!task) return null;

  task.completed = Boolean(task.completed);

  const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC').all(taskId).map((s: any) => ({
    ...s,
    completed: Boolean(s.completed),
  }));

  const tags = db.prepare(`
    SELECT t.* FROM tags t
    JOIN task_tags tt ON t.id = tt.tag_id
    WHERE tt.task_id = ?
  `).all(taskId);

  const recurrence = db.prepare('SELECT * FROM recurrences WHERE task_id = ?').get(taskId);
  const reminders = db.prepare('SELECT * FROM reminders WHERE task_id = ?').all(taskId);

  return {
    ...task,
    subtasks,
    tags,
    recurrence,
    reminders,
  };
}

tasksRouter.get('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { view, listId, tagId } = req.query;

  let query = 'SELECT DISTINCT t.* FROM tasks t';
  const conditions = ['t.user_id = ?'];
  const params: any[] = [userId];

  if (tagId) {
    query += ' JOIN task_tags tt ON t.id = tt.task_id';
    conditions.push('tt.tag_id = ?');
    params.push(tagId);
  }

  if (listId) {
    conditions.push('t.list_id = ?');
    params.push(listId);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  if (view === 'today') {
    conditions.push("t.due_date = ? AND t.completed = 0");
    params.push(todayStr);
  } else if (view === 'upcoming') {
    conditions.push("t.due_date > ? AND t.completed = 0");
    params.push(todayStr);
  } else if (view === 'completed') {
    conditions.push("t.completed = 1");
  } else if (view === 'inbox') {
    conditions.push("t.list_id IS NULL AND t.completed = 0");
  }

  query += ` WHERE ${conditions.join(' AND ')} ORDER BY t.completed ASC, t.position ASC, t.created_at DESC`;

  const tasksRows = db.prepare(query).all(...params) as any[];

  const tasks = tasksRows.map((t) => getTaskWithDetails(t.id, userId));

  res.json({ tasks });
});

tasksRouter.post('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { title, notes, list_id, due_date, due_time, priority, tags } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Task title is required' });
    return;
  }

  const taskId = crypto.randomUUID();

  db.prepare(`
    INSERT INTO tasks (id, user_id, list_id, title, notes, due_date, due_time, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(taskId, userId, list_id || null, title, notes || null, due_date || null, due_time || null, priority || 'none');

  if (Array.isArray(tags)) {
    for (const tagName of tags) {
      if (typeof tagName !== 'string') continue;
      let tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?').get(userId, tagName) as any;
      let tagId = tag?.id;
      if (!tagId) {
        tagId = crypto.randomUUID();
        db.prepare('INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)').run(tagId, userId, tagName);
      }
      db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(taskId, tagId);
    }
  }

  const task = getTaskWithDetails(taskId, userId);
  res.status(201).json({ task });
});

tasksRouter.get('/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const taskId = req.params.id as string;
  const task = getTaskWithDetails(taskId, userId);

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({ task });
});

tasksRouter.put('/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const taskId = req.params.id as string;
  const { title, notes, completed, list_id, due_date, due_time, priority, position, tags } = req.body;

  const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const completedVal = completed !== undefined ? (completed ? 1 : 0) : undefined;

  db.prepare(`
    UPDATE tasks
    SET title = COALESCE(?, title),
        notes = COALESCE(?, notes),
        completed = COALESCE(?, completed),
        list_id = COALESCE(?, list_id),
        due_date = COALESCE(?, due_date),
        due_time = COALESCE(?, due_time),
        priority = COALESCE(?, priority),
        position = COALESCE(?, position),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(title, notes, completedVal, list_id, due_date, due_time, priority, position, taskId, userId);

  if (Array.isArray(tags)) {
    db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(taskId);
    for (const tagName of tags) {
      if (typeof tagName !== 'string') continue;
      let tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?').get(userId, tagName) as any;
      let tagId = tag?.id;
      if (!tagId) {
        tagId = crypto.randomUUID();
        db.prepare('INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)').run(tagId, userId, tagName);
      }
      db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(taskId, tagId);
    }
  }

  const task = getTaskWithDetails(taskId, userId);
  res.json({ task });
});

tasksRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const taskId = req.params.id as string;

  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(taskId, userId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({ success: true });
});
