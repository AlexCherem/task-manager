import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreateTaskInput } from '@/entities/task';

vi.mock('server-only', () => ({}));
vi.mock('../auth/session', () => ({ requireSession: vi.fn() }));
import { requireSession } from '../auth/session';
import { getDb } from '../db';
import { createTaskList, getTaskList } from '../lists';
import {
  createTask,
  getTasksByList,
  getTaskListStats,
  updateTask,
  deleteTask,
} from './tasks';

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

describe('task list statistics in PostgreSQL', () => {
  const now = new Date('2030-01-01T12:00:00.000Z');

  it('reads counters from saved tasks, keeps lists isolated and reflects new tasks', async () => {
    const first = await makeList('stats-first');
    const second = await makeList('stats-second');
    const empty = await makeList('stats-empty');
    await saveTask(first.id, { deadline: '2029-12-31T12:00:00.000Z' });
    await saveTask(first.id, {
      status: 'in_progress',
      deadline: '2030-01-02T12:00:00.000Z',
    });
    await saveTask(first.id, {
      status: 'done',
      deadline: '2020-01-01T12:00:00.000Z',
    });
    await saveTask(second.id, { deadline: '2030-01-03T12:00:00.000Z' });
    const stats = await getTaskListStats([first.id, second.id, empty.id], now);
    expect(stats[first.id]).toEqual({
      total: 3,
      new: 1,
      inProgress: 1,
      done: 1,
      overdue: 1,
      progressPercent: 33,
      deadlineIndicator: 'overdue',
    });
    expect(stats[second.id]).toEqual({
      total: 1,
      new: 1,
      inProgress: 0,
      done: 0,
      overdue: 0,
      progressPercent: 0,
      deadlineIndicator: 'due_soon',
    });
    expect(stats[empty.id]).toEqual({
      total: 0,
      new: 0,
      inProgress: 0,
      done: 0,
      overdue: 0,
      progressPercent: 0,
      deadlineIndicator: 'none',
    });
    await saveTask(first.id, { status: 'done' });
    expect((await getTaskListStats([first.id], now))[first.id]).toMatchObject({
      total: 4,
      done: 2,
      progressPercent: 50,
    });
  });
});

describe('updating tasks in PostgreSQL', () => {
  it('saves every field, preserves task identity and list, and leaves another task untouched', async () => {
    const list = await makeList('edit');
    const otherList = await makeList('edit-other');
    const task = await saveTask(list.id);
    const other = await saveTask(otherList.id);
    const [before] =
      await sql`SELECT created_at::text FROM tasks WHERE id = ${task.id}`;
    const input = {
      ...task,
      title: "  Обновлённая 'задача'  ",
      description: '  Новое описание  ',
      status: 'in_progress' as const,
      priority: 'high' as const,
      deadline: '2031-01-16T13:45:12.345Z',
    };
    const expected = {
      ...input,
      title: "Обновлённая 'задача'",
      description: 'Новое описание',
    };
    expect(await updateTask(input)).toEqual({ task: expected, error: null });
    expect(await getTasksByList(list.id)).toEqual([expected]);
    expect(await getTasksByList(otherList.id)).toEqual([other]);
    const [after] =
      await sql`SELECT created_at::text FROM tasks WHERE id = ${task.id}`;
    expect(after.created_at).toBe(before.created_at);
  });
  it('cannot update a task through a different list', async () => {
    const list = await makeList('edit-scope');
    const otherList = await makeList('edit-wrong-list');
    const task = await saveTask(list.id);
    expect(
      (
        await updateTask({
          ...task,
          listId: otherList.id,
          title: 'Should not change',
        })
      ).error,
    ).not.toBeNull();
    expect(await getTasksByList(list.id)).toEqual([task]);
    expect(await getTasksByList(otherList.id)).toEqual([]);
  });
  it('reports a deleted task without creating a replacement', async () => {
    const list = await makeList('edit-deleted');
    const task = await saveTask(list.id);
    await sql`DELETE FROM tasks WHERE id = ${task.id}`;
    expect((await updateTask(task)).error).toBe(
      'Задача не найдена. Возможно, она уже удалена.',
    );
    expect(await getTasksByList(list.id)).toEqual([]);
  });
  it('recalculates statistics when an overdue task is completed and reopened', async () => {
    const list = await makeList('edit-stats');
    const task = await saveTask(list.id, {
      deadline: '2020-01-01T12:00:00.000Z',
    });
    const now = new Date('2030-01-01T12:00:00.000Z');
    for (const status of ['done', 'in_progress', 'new'] as const) {
      expect((await updateTask({ ...task, status })).error).toBeNull();
      const stats = (await getTaskListStats([list.id], now))[list.id];
      expect(stats).toEqual({
        total: 1,
        new: Number(status === 'new'),
        inProgress: Number(status === 'in_progress'),
        done: Number(status === 'done'),
        overdue: Number(status !== 'done'),
        progressPercent: status === 'done' ? 100 : 0,
        deadlineIndicator: status === 'done' ? 'none' : 'overdue',
      });
    }
  });
});

describe('deleting tasks in PostgreSQL', () => {
  it('deletes only the requested task, preserves lists and recalculates statistics', async () => {
    const list = await makeList('delete');
    const otherList = await makeList('delete-other');
    const overdue = await saveTask(list.id, {
      deadline: '2020-01-01T12:00:00.000Z',
    });
    const done = await saveTask(list.id, { status: 'done' });
    const other = await saveTask(otherList.id);
    const now = new Date('2030-01-01T12:00:00.000Z');
    expect((await getTaskListStats([list.id], now))[list.id]).toMatchObject({
      total: 2,
      overdue: 1,
      progressPercent: 50,
    });
    expect(await deleteTask({ id: overdue.id, listId: list.id })).toEqual({
      listId: list.id,
      error: null,
    });
    expect(await getTasksByList(list.id)).toEqual([done]);
    expect(await getTasksByList(otherList.id)).toEqual([other]);
    expect(await getTaskList(list.id)).toEqual(list);
    expect((await getTaskListStats([list.id], now))[list.id]).toEqual({
      total: 1,
      new: 0,
      inProgress: 0,
      done: 1,
      overdue: 0,
      progressPercent: 100,
      deadlineIndicator: 'none',
    });
    expect(
      (await deleteTask({ id: done.id, listId: list.id })).error,
    ).toBeNull();
    expect(await getTasksByList(list.id)).toEqual([]);
    expect((await getTaskListStats([list.id], now))[list.id]).toEqual({
      total: 0,
      new: 0,
      inProgress: 0,
      done: 0,
      overdue: 0,
      progressPercent: 0,
      deadlineIndicator: 'none',
    });
  });
  it('does not delete a task through another list', async () => {
    const list = await makeList('delete-scope');
    const otherList = await makeList('delete-wrong-list');
    const task = await saveTask(list.id);
    expect(
      (await deleteTask({ id: task.id, listId: otherList.id })).error,
    ).toBeNull();
    expect(await getTasksByList(list.id)).toEqual([task]);
    expect(await getTasksByList(otherList.id)).toEqual([]);
  });
  it('allows repeated deletion and deletion after the parent list is removed', async () => {
    const list = await makeList('delete-twice');
    const otherList = await makeList('delete-keep');
    const task = await saveTask(list.id);
    const other = await saveTask(otherList.id);
    const input = { id: task.id, listId: list.id };
    expect((await deleteTask(input)).error).toBeNull();
    expect((await deleteTask(input)).error).toBeNull();
    await sql`DELETE FROM task_lists WHERE id = ${list.id}`;
    expect((await deleteTask(input)).error).toBeNull();
    expect(await getTasksByList(otherList.id)).toEqual([other]);
  });
});
