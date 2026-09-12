import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/server/app';
import { initializeDatabase } from '@/server/db/schema';
import { db } from '@/server/db/client';

describe('Authentication API', () => {
  beforeEach(() => {
    initializeDatabase();
    db.prepare('DELETE FROM users').run();
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user1@example.com',
        password: 'password123',
        name: 'Alice User',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toEqual({
      id: expect.any(String),
      email: 'user1@example.com',
      name: 'Alice User',
    });
  });

  it('should prevent registering duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user1@example.com',
        password: 'password123',
        name: 'Alice User',
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user1@example.com',
        password: 'differentpassword',
        name: 'Alice Duplicate',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already exists');
  });

  it('should login an existing user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user2@example.com',
        password: 'password123',
        name: 'Bob User',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user2@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('user2@example.com');
  });

  it('should fail login with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user3@example.com',
        password: 'password123',
        name: 'Charlie User',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user3@example.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });

  it('should retrieve current user via /api/auth/me', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user4@example.com',
        password: 'password123',
        name: 'Dave User',
      });

    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('user4@example.com');
  });

  it('should enforce max 6 users limit', async () => {
    for (let i = 1; i <= 6; i++) {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `user${i}@test.com`,
          password: 'password123',
          name: `User ${i}`,
        });
      expect(res.status).toBe(201);
    }

    const extraRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user7@test.com',
        password: 'password123',
        name: 'User 7',
      });

    expect(extraRes.status).toBe(403);
    expect(extraRes.body.error).toContain('Maximum user limit');
  });
});
