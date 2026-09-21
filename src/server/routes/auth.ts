import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/client.js';
import { generateToken } from '../auth/jwt.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import crypto from 'crypto';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password, and name are required' });
    return;
  }

  // Enforce 6 users limit
  const countRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (countRow.count >= 6) {
    res.status(403).json({ error: 'Maximum user limit (6 users) reached for this private instance' });
    return;
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    res.status(400).json({ error: 'User with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
    userId,
    email,
    passwordHash,
    name
  );

  const token = generateToken({ userId, email });
  res.status(201).json({
    token,
    user: { id: userId, email, name },
  });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = generateToken({ userId: user.id, email: user.email });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});
