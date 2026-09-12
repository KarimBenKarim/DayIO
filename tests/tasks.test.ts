import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/server/app';
import { initializeDatabase } from '@/server/db/schema';
import { db } from '@/server/db/client';

describe('Tasks API & User Isolation', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;

  beforeEach(async () => {
    initializeDatabase();
    db.prepare('DELETE FROM task_tags').run();
    db.prepare('DELETE FROM tags').run();
    db.prepare('DELETE FROM subtasks').run();
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM lists').run();
    db.prepare('DELETE FROM users').run();

    // Register User 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user1@test.com', password: 'password123', name: 'User 1' });
    user1Token = res1.body.token;
    user1Id = res1.body.user.id;

    // Register User 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user2@test.com', password: 'password123', name: 'User 2' });
    user2Token = res2.body.token;
  });

  it('should create a task for authenticated user', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Buy groceries',
        notes: 'Milk, Eggs, Bread',
        priority: 'high',
        due_date: '2025-12-31',
        tags: ['shopping', 'errands'],
      });

    expect(res.status).toBe(201);
    expect(res.body.task).toMatchObject({
      title: 'Buy groceries',
      notes: 'Milk, Eggs, Bread',
      priority: 'high',
      due_date: '2025-12-31',
      completed: false,
    });
    expect(res.body.task.tags.map((t: any) => t.name)).toEqual(expect.arrayContaining(['shopping', 'errands']));
  });

  it('should list tasks belonging only to the authenticated user', async () => {
    // User 1 creates a task
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'User 1 Private Task' });

    // User 2 creates a task
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'User 2 Private Task' });

    // User 1 fetches tasks
    const res1 = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.tasks.length).toBe(1);
    expect(res1.body.tasks[0].title).toBe('User 1 Private Task');

    // User 2 fetches tasks
    const res2 = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res2.status).toBe(200);
    expect(res2.body.tasks.length).toBe(1);
    expect(res2.body.tasks[0].title).toBe('User 2 Private Task');
  });

  it('should strictly isolate updates and prevent user 2 from reading/modifying user 1 task', async () => {
    // User 1 creates task
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Top Secret Task' });

    const taskId = createRes.body.task.id;

    // User 2 attempts GET user 1 task
    const getRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(getRes.status).toBe(404);

    // User 2 attempts PUT user 1 task
    const updateRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'Hacked Title' });
    expect(updateRes.status).toBe(404);

    // User 2 attempts DELETE user 1 task
    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(deleteRes.status).toBe(404);

    // Verify task unchanged
    const verifyRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(verifyRes.body.task.title).toBe('Top Secret Task');
  });

  it('should manage subtasks on a task', async () => {
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Project Planning' });

    const taskId = taskRes.body.task.id;

    // Add subtask
    const subRes = await request(app)
      .post(`/api/tasks/${taskId}/subtasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Research requirements' });

    expect(subRes.status).toBe(201);
    const subtaskId = subRes.body.subtask.id;

    // Toggle subtask completed
    const toggleRes = await request(app)
      .put(`/api/subtasks/${subtaskId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ completed: true });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.subtask.completed).toBe(true);

    // Fetch full task to verify subtask list
    const fullTaskRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(fullTaskRes.body.task.subtasks.length).toBe(1);
    expect(fullTaskRes.body.task.subtasks[0].completed).toBe(true);
  });

  it('should manage custom lists and list filtering', async () => {
    // Create list
    const listRes = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Work Project', color: '#ff0000' });

    const listId = listRes.body.list.id;

    // Create task in list
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Work Task', list_id: listId });

    // Filter tasks by list
    const filterRes = await request(app)
      .get(`/api/tasks?listId=${listId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.tasks.length).toBe(1);
    expect(filterRes.body.tasks[0].list_id).toBe(listId);
  });
});
