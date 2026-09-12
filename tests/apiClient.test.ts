import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { app } from '@/server/app';
import { initializeDatabase } from '@/server/db/schema';
import { db } from '@/server/db/client';
import { TaskFlowApiClient } from '../packages/shared/src/apiClient';

describe('Shared TaskFlowApiClient Integration', () => {
  let server: any;
  let client: TaskFlowApiClient;
  let port: number;

  beforeEach(async () => {
    initializeDatabase();
    db.prepare('DELETE FROM task_tags').run();
    db.prepare('DELETE FROM tags').run();
    db.prepare('DELETE FROM subtasks').run();
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM lists').run();
    db.prepare('DELETE FROM users').run();

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        client = new TaskFlowApiClient(`http://localhost:${port}/api`);
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('should authenticate and execute full task workflow via sharedApiClient', async () => {
    // 1. Register
    const auth = await client.register('clientuser@test.com', 'password123', 'Client User');
    expect(auth.user.email).toBe('clientuser@test.com');
    expect(client.getToken()).toBe(auth.token);

    // 2. Get Me
    const me = await client.getCurrentUser();
    expect(me.user.name).toBe('Client User');

    // 3. Create List
    const listRes = await client.createList('Personal', '#3b82f6');
    expect(listRes.list.name).toBe('Personal');

    // 4. Create Task
    const taskRes = await client.createTask({
      title: 'Cross-platform task',
      list_id: listRes.list.id,
      priority: 'high',
    });
    expect(taskRes.task.title).toBe('Cross-platform task');

    // 5. Add Subtask
    const subRes = await client.addSubtask(taskRes.task.id, 'Shared subtask');
    expect(subRes.subtask.title).toBe('Shared subtask');

    // 6. Complete Task
    const updateRes = await client.updateTask(taskRes.task.id, { completed: true });
    expect(updateRes.task.completed).toBe(true);

    // 7. Get Tasks List
    const tasksList = await client.getTasks({ view: 'completed' });
    expect(tasksList.tasks.length).toBe(1);
    expect(tasksList.tasks[0].id).toBe(taskRes.task.id);
  });
});
