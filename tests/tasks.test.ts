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
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'User 1 Private Task' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'User 2 Private Task' });

    const res1 = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.tasks.length).toBe(1);
    expect(res1.body.tasks[0].title).toBe('User 1 Private Task');

    const res2 = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res2.status).toBe(200);
    expect(res2.body.tasks.length).toBe(1);
    expect(res2.body.tasks[0].title).toBe('User 2 Private Task');
  });

  it('should strictly isolate updates and prevent user 2 from reading/modifying user 1 task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Top Secret Task' });

    const taskId = createRes.body.task.id;

    const getRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(getRes.status).toBe(404);

    const updateRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'Hacked Title' });
    expect(updateRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(deleteRes.status).toBe(404);

    const verifyRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(verifyRes.body.task.title).toBe('Top Secret Task');
  });

  it('should reject associating a task with another user list ID', async () => {
    // User 2 creates a list
    const listRes = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'User 2 Private List' });
    const foreignListId = listRes.body.list.id;

    // User 1 tries to create task in User 2 list
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Unauthorized Task', list_id: foreignListId });
    expect(createRes.status).toBe(403);

    // User 1 creates task, then tries to update list_id to User 2 list
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'User 1 Task' });
    const taskId = taskRes.body.task.id;

    const updateRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ list_id: foreignListId });
    expect(updateRes.status).toBe(403);
  });

  it('should support explicit clearing of nullable task attributes', async () => {
    // Create task with notes and due_date
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Task with details',
        notes: 'Initial notes',
        due_date: '2025-12-31',
      });
    const taskId = createRes.body.task.id;

    // Explicitly update notes and due_date to null
    const updateRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        notes: null,
        due_date: null,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.task.notes).toBeNull();
    expect(updateRes.body.task.due_date).toBeNull();
  });

  it('should prevent User 2 from updating or deleting User 1 lists or subtasks', async () => {
    // User 1 creates list & task & subtask
    const listRes = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'User 1 List' });
    const listId = listRes.body.list.id;

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'User 1 Task', list_id: listId });
    const taskId = taskRes.body.task.id;

    const subRes = await request(app)
      .post(`/api/tasks/${taskId}/subtasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'User 1 Subtask' });
    const subtaskId = subRes.body.subtask.id;

    // User 2 attempts list update/delete
    const listPutRes = await request(app)
      .put(`/api/lists/${listId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Hacked List' });
    expect(listPutRes.status).toBe(404);

    const listDelRes = await request(app)
      .delete(`/api/lists/${listId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(listDelRes.status).toBe(404);

    // User 2 attempts subtask update/delete
    const subPutRes = await request(app)
      .put(`/api/subtasks/${subtaskId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'Hacked Subtask' });
    expect(subPutRes.status).toBe(404);

    const subDelRes = await request(app)
      .delete(`/api/subtasks/${subtaskId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(subDelRes.status).toBe(404);
  });
});
