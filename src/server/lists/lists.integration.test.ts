import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { taskListTitleMaxLength, type TaskList } from '@/entities/task-list';

vi.mock('server-only', () => ({}));
vi.mock('../auth/session', () => ({ requireSession: vi.fn() }));

import { requireSession } from '../auth/session';
import { getDb } from '../db';
import {
  createTaskList,
  getTaskLists,
  renameTaskList,
  deleteTaskList,
} from './lists';

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

describe('renaming task lists in PostgreSQL', () => {
  it('updates only the requested title and preserves identity, creation time and tasks', async () => {
    const list = await createFixture('before');
    const other = await createFixture('untouched');
    const [before] =
      await sql`SELECT created_at::text FROM task_lists WHERE id = ${list.id}`;
    const [task] = await sql`
      INSERT INTO tasks (list_id, title, deadline)
      VALUES (${list.id}, 'Task', ${deadline}) RETURNING id
    `;
    const title = `${prefix}После 'переименования'`;
    const result = await renameTaskList(list.id, `  ${title}  `);
    expect(result).toEqual({ list: { id: list.id, title }, error: null });
    const lists = await getTaskLists();
    expect(lists).toContainEqual({ id: list.id, title });
    expect(lists).toContainEqual(other);
    expect(lists).not.toContainEqual(list);
    const [after] =
      await sql`SELECT created_at::text FROM task_lists WHERE id = ${list.id}`;
    expect(after.created_at).toBe(before.created_at);
    expect(await sql`SELECT list_id FROM tasks WHERE id = ${task.id}`).toEqual([
      { list_id: list.id },
    ]);
  });

  it('accepts a normalized title at the maximum length', async () => {
    const list = await createFixture('max-title');
    const title = prefix.padEnd(taskListTitleMaxLength, 'a');
    expect(await renameTaskList(list.id, `  ${title}  `)).toEqual({
      list: { id: list.id, title },
      error: null,
    });
    expect(await getTaskLists()).toContainEqual({ id: list.id, title });
  });

  it('reports a deleted list without creating a replacement', async () => {
    const list = await createFixture('deleted');
    await sql`DELETE FROM task_lists WHERE id = ${list.id}`;
    const result = await renameTaskList(list.id, prefix + 'replacement');
    expect(result.list).toBeNull();
    expect(result.error).toBe('Список не найден. Возможно, он уже удалён.');
    expect(
      (await getTaskLists()).filter((item) => item.title.startsWith(prefix)),
    ).toEqual([]);
  });
});

describe('deleting task lists in PostgreSQL', () => {
  it('removes the selected list and its tasks while preserving another list and its task', async () => {
    const list = await createFixture('delete-selected');
    const other = await createFixture('delete-untouched');
    const deletedTasks = await sql`
      INSERT INTO tasks (list_id, title, deadline)
      VALUES (${list.id}, 'First task', ${deadline}), (${list.id}, 'Second task', ${deadline})
      RETURNING id
    `;
    const [otherTask] = await sql`
      INSERT INTO tasks (list_id, title, deadline)
      VALUES (${other.id}, 'Keep this task', ${deadline}) RETURNING id
    `;
    expect(await deleteTaskList(list.id)).toEqual({ error: null });
    const lists = await getTaskLists();
    expect(lists).not.toContainEqual(list);
    expect(lists).toContainEqual(other);
    expect(
      await sql`SELECT id FROM tasks WHERE id IN (${deletedTasks[0].id}, ${deletedTasks[1].id})`,
    ).toEqual([]);
    expect(await sql`SELECT id FROM tasks WHERE id = ${otherTask.id}`).toEqual([
      { id: otherTask.id },
    ]);
  });

  it('allows repeated deletion without affecting remaining lists', async () => {
    const list = await createFixture('delete-twice');
    const other = await createFixture('delete-keep');
    expect(await deleteTaskList(list.id)).toEqual({ error: null });
    expect(await deleteTaskList(list.id)).toEqual({ error: null });
    expect(
      (await getTaskLists()).filter((item) => item.title.startsWith(prefix)),
    ).toEqual([other]);
  });
});

describe('searching task lists in PostgreSQL', () => {
  it('matches part of a title without case sensitivity, including Cyrillic', async () => {
    const first = await createFixture('Работа Alpha');
    const second = await createFixture('Личное Beta');
    expect(
      (await getTaskLists('  оТА aLpHa  ')).filter((list) =>
        list.title.startsWith(prefix),
      ),
    ).toEqual([first]);
    expect(
      (await getTaskLists('ЛИЧНОЕ')).filter((list) =>
        list.title.startsWith(prefix),
      ),
    ).toEqual([second]);
  });

  it('treats percent, underscore, backslash and quotes as literal text', async () => {
    const list = await createFixture("Символы %_\\' в названии");
    await createFixture('Символы abc в названии');
    expect(
      (await getTaskLists("%_\\'")).filter((item) =>
        item.title.startsWith(prefix),
      ),
    ).toEqual([list]);
  });

  it('returns all fixture lists for an empty query', async () => {
    const first = await createFixture('search-all-first');
    const second = await createFixture('search-all-second');
    expect(
      (await getTaskLists('   ')).filter((list) =>
        list.title.startsWith(prefix),
      ),
    ).toEqual([second, first]);
  });

  it('returns no matches for an unknown title', async () => {
    await createFixture('search-existing');
    expect(await getTaskLists(prefix + 'missing')).toEqual([]);
  });

  it('reflects creation, renaming and deletion in filtered results', async () => {
    const query = prefix + 'search-active';
    expect(await getTaskLists(query)).toEqual([]);
    const result = await createTaskList(query);
    if (result.error !== null) throw new Error(result.error);
    const list = result.list;
    expect(await getTaskLists(query)).toEqual([list]);
    const title = prefix + 'search-renamed';
    expect((await renameTaskList(list.id, title)).error).toBeNull();
    expect(await getTaskLists(query)).toEqual([]);
    expect(await getTaskLists(title)).toEqual([{ id: list.id, title }]);
    expect((await deleteTaskList(list.id)).error).toBeNull();
    expect(await getTaskLists(title)).toEqual([]);
  });
});
