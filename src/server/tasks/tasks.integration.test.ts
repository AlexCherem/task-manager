import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreateTaskInput } from '@/entities/task';

vi.mock('server-only', () => ({}));
vi.mock('../auth/session', () => ({ requireSession: vi.fn() }));
import { requireSession } from '../auth/session';
import { getDb } from '../db';
import { createTaskList, getTaskList } from '../lists';
import { createTask, getTasksByList } from './tasks';

const sql = getDb();
const prefix = `task-integration-${randomUUID()}:`;
const fields = {
  title: 'Task',
  description: 'Details',
  status: 'new',
  priority: 'medium',
  deadline: '2030-01-01T12:00:00.000Z',
} as const;

async function makeList(suffix: string) {
  const result = await createTaskList(prefix + suffix);
  if (result.error !== null) throw new Error(result.error);

  return result.list;
}
async function saveTask(
  listId: string,
  overrides: Partial<CreateTaskInput> = {},
) {
  const result = await createTask({ listId, ...fields, ...overrides });
  if (result.error !== null) throw new Error(result.error);

  return result.task;
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

describe('tasks in PostgreSQL', () => {
  it('creates, normalizes and reads a task only within its own list', async () => {
    const first = await makeList('first');
    const second = await makeList('second');
    expect(await getTaskList(first.id)).toEqual(first);
    const task = await saveTask(first.id, {
      title: "  Задача 'новая'  ",
      description: '  Details  ',
    });
    const other = await saveTask(second.id);
    expect(task).toMatchObject({
      listId: first.id,
      title: "Задача 'новая'",
      description: 'Details',
      deadline: fields.deadline,
    });
    expect(await getTasksByList(first.id)).toEqual([task]);
    expect(await getTasksByList(second.id)).toEqual([other]);
  });
  it('preserves every supported status and priority', async () => {
    const list = await makeList('states');
    const tasks = [];
    for (const [status, priority] of [
      ['new', 'low'],
      ['in_progress', 'medium'],
      ['done', 'high'],
    ] as const) {
      tasks.push(await saveTask(list.id, { status, priority }));
    }
    expect(await getTasksByList(list.id)).toEqual(tasks);
  });
  it('accepts a past deadline and a title at the maximum length', async () => {
    const list = await makeList('boundaries');
    const task = await saveTask(list.id, {
      title: 'a'.repeat(200),
      deadline: '2020-01-01T12:00:00.000Z',
    });
    expect(await getTasksByList(list.id)).toEqual([task]);
  });
  it('returns an expected error for an absent list', async () => {
    const listId = randomUUID();
    expect(await getTaskList(listId)).toBeNull();
    expect(await createTask({ listId, ...fields })).toEqual({
      task: null,
      error: 'Список не найден. Возможно, он уже удалён.',
    });
    expect(await sql`SELECT id FROM tasks WHERE list_id = ${listId}`).toEqual(
      [],
    );
  });
  it('does not create a task when its parent list has been deleted', async () => {
    const list = await makeList('deleted');
    await sql`DELETE FROM task_lists WHERE id=${list.id}`;
    expect((await createTask({ listId: list.id, ...fields })).error).toBe(
      'Список не найден. Возможно, он уже удалён.',
    );
    expect(await getTasksByList(list.id)).toEqual([]);
  });
});
