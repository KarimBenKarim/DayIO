import { Router } from 'express';
import { db } from '../db/client.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import crypto from 'crypto';

export const tagsRouter = Router();
tagsRouter.use(requireAuth);

tagsRouter.get('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const tags = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC').all(userId);
  res.json({ tags });
});

tagsRouter.post('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { name, color } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Tag name is required' });
    return;
  }

  const existing = db.prepare('SELECT * FROM tags WHERE user_id = ? AND name = ?').get(userId, name);
  if (existing) {
    res.json({ tag: existing });
    return;
  }

  const tagId = crypto.randomUUID();
  db.prepare('INSERT INTO tags (id, user_id, name, color) VALUES (?, ?, ?, ?)').run(tagId, userId, name, color || '#6b7280');

  const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
  res.status(201).json({ tag });
});
