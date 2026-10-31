import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { taskListTitleMaxLength, type TaskList } from '@/entities/task-list';

vi.mock('server-only', () => ({}));
vi.mock('../auth/session', () => ({ requireSession: vi.fn() }));

import { requireSession } from '../auth/session';
import { getDb } from '../db';
import { createTaskList, getTaskLists } from './lists';

const sql = getDb();
const prefix = `integration-${randomUUID()}:`;
const deadline = '2026-11-01T12:00:00Z';

async function createFixture(suffix: string): Promise<TaskList> {
  const result = await createTaskList(prefix + suffix);
  if (result.error !== null) throw new Error(result.error);

  return result.list;
}

beforeEach(() => {
  vi.mocked(requireSession).mockResolvedValue({
    id: 'demo-admin',
    email: 'admin@example.com',
  });
});

afterEach(async () => {
  await sql`DELETE FROM task_lists WHERE starts_with(title, ${prefix})`;
});

describe('task lists in PostgreSQL', () => {
  it('persists a normalized title and reads it through a new database call', async () => {
    const title = `${prefix}Список 'работа'`;
    const result = await createTaskList(`  ${title}  `);
    expect(result.error).toBeNull();
    expect(result.list).toEqual({ id: expect.any(String), title });
    expect(await getTaskLists()).toContainEqual(result.list);
  });

  it('accepts the maximum title length in both the data layer and database', async () => {
    const title = prefix.padEnd(taskListTitleMaxLength, 'a');
    const result = await createTaskList(title);
    expect(result.error).toBeNull();
    expect(await getTaskLists()).toContainEqual(result.list);
  });

  it('sorts by creation time and uses the id to break ties', async () => {
    const older = await createFixture('older');
    const first = await createFixture('first');
    const second = await createFixture('second');
    await sql`
      UPDATE task_lists
      SET created_at = CASE WHEN id = ${older.id}::uuid
        THEN '2020-01-01T00:00:00Z'::timestamptz
        ELSE '2020-01-02T00:00:00Z'::timestamptz END
      WHERE starts_with(title, ${prefix})
    `;
    const actual = (await getTaskLists())
      .filter((list) => list.title.startsWith(prefix))
      .map((list) => list.id);
    expect(actual).toEqual([
      ...[first.id, second.id].sort().reverse(),
      older.id,
    ]);
  });

  it('removes tasks when their list is deleted', async () => {
    const list = await createFixture('cascade');
    const [task] = await sql`
      INSERT INTO tasks (list_id, title, deadline)
      VALUES (${list.id}, 'Task', ${deadline})
      RETURNING id, status, priority, description
    `;
    expect(task).toMatchObject({
      status: 'new',
      priority: 'medium',
      description: '',
    });
    await sql`DELETE FROM task_lists WHERE id = ${list.id}`;
    expect(await sql`SELECT id FROM tasks WHERE id = ${task.id}`).toEqual([]);
  });

  it('rejects a task linked to a missing list', async () => {
    const taskId = randomUUID();
    try {
      await expect(sql`
        INSERT INTO tasks (id, list_id, title, deadline)
        VALUES (${taskId}, ${randomUUID()}, 'Task', ${deadline})
      `).rejects.toMatchObject({ code: '23503' });
    } finally {
      await sql`DELETE FROM tasks WHERE id = ${taskId}`;
    }
  });

  it.each([
    ['computed overdue status', 'overdue', 'medium', deadline, '23514'],
    ['unknown priority', 'new', 'urgent', deadline, '23514'],
    ['missing deadline', 'new', 'medium', null, '23502'],
    ['infinite deadline', 'new', 'medium', 'infinity', '23514'],
  ])(
    'rejects %s at the database boundary',
    async (name, status, priority, dueAt, code) => {
      const list = await createFixture(String(name));
      await expect(sql`
      INSERT INTO tasks (list_id, title, status, priority, deadline)
      VALUES (${list.id}, 'Task', ${status}, ${priority}, ${dueAt})
    `).rejects.toMatchObject({ code });
    },
  );

  it('rejects a blank task title at the database boundary', async () => {
    const list = await createFixture('blank-task-title');
    await expect(sql`
      INSERT INTO tasks (list_id, title, deadline)
      VALUES (${list.id}, '   ', ${deadline})
    `).rejects.toMatchObject({ code: '23514' });
  });
});
