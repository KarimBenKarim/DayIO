import { Router } from 'express';
import { db } from '../db/client.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import crypto from 'crypto';

export const listsRouter = Router();
listsRouter.use(requireAuth);

listsRouter.get('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const lists = db.prepare('SELECT * FROM lists WHERE user_id = ? ORDER BY position ASC, created_at ASC').all(userId);
  res.json({ lists });
});

listsRouter.post('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { name, color, icon } = req.body;

  if (!name) {
    res.status(400).json({ error: 'List name is required' });
    return;
  }

  const listId = crypto.randomUUID();
  db.prepare('INSERT INTO lists (id, user_id, name, color, icon) VALUES (?, ?, ?, ?, ?)').run(
    listId,
    userId,
    name,
    color || '#3b82f6',
    icon || null
  );

  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(listId);
  res.status(201).json({ list });
});

listsRouter.put('/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { name, color, icon, position } = req.body;

  const existing = db.prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  db.prepare(`
    UPDATE lists
    SET name = COALESCE(?, name),
        color = COALESCE(?, color),
        icon = COALESCE(?, icon),
        position = COALESCE(?, position)
    WHERE id = ? AND user_id = ?
  `).run(name, color, icon, position, id, userId);

  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(id);
  res.json({ list });
});

listsRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const result = db.prepare('DELETE FROM lists WHERE id = ? AND user_id = ?').run(id, userId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  res.json({ success: true });
});
