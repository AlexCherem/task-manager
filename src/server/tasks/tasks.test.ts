import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sql, requireSession } = vi.hoisted(() => ({
  sql: vi.fn(),
  requireSession: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('../auth/session', () => ({ requireSession }));
vi.mock('../db', () => ({ getDb: () => sql }));

import {
  createTask,
  getTasksByList,
  getTaskListStats,
  updateTask,
} from './tasks';

const listId = '00000000-0000-4000-8000-000000000001';
const taskId = '00000000-0000-4000-8000-000000000003';
const input = {
  listId,
  title: 'Task',
  description: 'Details',
  status: 'new',
  priority: 'medium',
  deadline: '2030-01-01T12:00:00.000Z',
};
const row = {
  id: 'task-id',
  list_id: listId,
  title: input.title,
  description: input.description,
  status: input.status,
  priority: input.priority,
  deadline: new Date(input.deadline),
};

beforeEach(() => {
  vi.resetAllMocks();
  requireSession.mockResolvedValue({
    id: 'demo-admin',
    email: 'admin@example.com',
  });
  sql.mockResolvedValue([]);
});

describe('task data access', () => {
  it.each([
    ['read', () => getTasksByList(listId)],
    ['statistics', () => getTaskListStats([listId])],
    ['create', () => createTask(input)],
    ['update', () => updateTask({ ...input, id: taskId })],
  ] as const)('requires a session before %s', async (_, operation) => {
    const error = new Error('Session required');
    requireSession.mockRejectedValue(error);
    await expect(operation()).rejects.toBe(error);
    expect(sql).not.toHaveBeenCalled();
  });
  it.each([null, 'invalid', 42])(
    'does not query tasks for an invalid list id: %j',
    async (id) => {
      expect(await getTasksByList(id)).toEqual([]);
      expect(sql).not.toHaveBeenCalled();
    },
  );
  it('maps database timestamps to UTC strings and keeps the list relation', async () => {
    sql.mockResolvedValue([row]);
    expect(await getTasksByList(listId)).toEqual([{ id: row.id, ...input }]);
    expect(sql.mock.calls[0].slice(1)).toEqual([listId]);
  });
  it.each([null, undefined, 42, [], {}])(
    'rejects malformed task input: %j',
    async (value) => {
      expect((await createTask(value)).error).not.toBeNull();
      expect(sql).not.toHaveBeenCalled();
    },
  );
  it.each([
    ['listId', 'invalid'],
    ['title', null],
    ['title', '   '],
    ['title', 'a'.repeat(201)],
    ['description', 42],
    ['status', 'overdue'],
    ['status', 'toString'],
    ['priority', 'urgent'],
    ['priority', 'constructor'],
    ['deadline', ''],
    ['deadline', 'infinity'],
    ['deadline', '2030-02-30T12:00:00.000Z'],
    ['deadline', '2030-01-01T12:00'],
    ['deadline', null],
  ])('rejects invalid %s: %j', async (key, value) => {
    const result = await createTask({ ...input, [key]: value });
    expect(result.task).toBeNull();
    expect(result.error).not.toBeNull();
    expect(
      (await updateTask({ ...input, id: taskId, [key]: value })).error,
    ).not.toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });
  it('normalizes text and parameterizes all values', async () => {
    const title = "Задача 'новая'";
    sql.mockResolvedValue([{ ...row, title }]);
    const result = await createTask({
      ...input,
      title: `  ${title}  `,
      description: '  Details  ',
    });
    expect(result).toEqual({
      task: { id: row.id, ...input, title },
      error: null,
    });
    const [strings, ...parameters] = sql.mock.calls[0];
    expect(strings.join('')).not.toContain(title);
    expect(parameters).toEqual([
      title,
      'Details',
      'new',
      'medium',
      input.deadline,
      listId,
    ]);
  });
  it('reports a deleted or missing parent list', async () => {
    expect(await createTask(input)).toEqual({
      task: null,
      error: 'Список не найден. Возможно, он уже удалён.',
    });
  });
  it('accepts a title at the maximum length', async () => {
    sql.mockResolvedValue([{ ...row, title: 'a'.repeat(200) }]);
    expect(
      (await createTask({ ...input, title: 'a'.repeat(200) })).error,
    ).toBeNull();
  });
  it.each([
    ['read', () => getTasksByList(listId)],
    ['statistics', () => getTaskListStats([listId])],
    ['create', () => createTask(input)],
    ['update', () => updateTask({ ...input, id: taskId })],
  ] as const)('preserves database errors during %s', async (_, operation) => {
    const error = new Error('Database unavailable');
    sql.mockRejectedValue(error);
    await expect(operation()).rejects.toBe(error);
  });
});

describe('task list statistics', () => {
  const now = new Date('2030-01-01T12:00:00.000Z');
  const otherId = '00000000-0000-4000-8000-000000000002';

  it('does not query the database when no lists are displayed', async () => {
    expect(await getTaskListStats([], now)).toEqual({});
    expect(requireSession).toHaveBeenCalledOnce();
    expect(sql).not.toHaveBeenCalled();
  });
  it.each([null, 'invalid', [listId, 'invalid'], [42]])(
    'rejects invalid identifiers before querying: %j',
    async (ids) => {
      await expect(getTaskListStats(ids, now)).rejects.toThrow(
        'Invalid task list identifiers.',
      );
      expect(sql).not.toHaveBeenCalled();
    },
  );
  it('groups tasks by list, counts overdue tasks and includes empty lists', async () => {
    sql.mockResolvedValue([
      {
        list_id: listId,
        status: 'new',
        deadline: new Date('2029-12-31T12:00:00Z'),
      },
      {
        list_id: listId,
        status: 'in_progress',
        deadline: new Date('2030-01-02T12:00:00Z'),
      },
      {
        list_id: listId,
        status: 'done',
        deadline: new Date('2020-01-01T12:00:00Z'),
      },
    ]);
    expect(await getTaskListStats([listId, otherId], now)).toEqual({
      [listId]: {
        total: 3,
        new: 1,
        inProgress: 1,
        done: 1,
        overdue: 1,
        progressPercent: 33,
        deadlineIndicator: 'overdue',
      },
      [otherId]: {
        total: 0,
        new: 0,
        inProgress: 0,
        done: 0,
        overdue: 0,
        progressPercent: 0,
        deadlineIndicator: 'none',
      },
    });
    expect(sql).toHaveBeenCalledOnce();
    const [strings, ...parameters] = sql.mock.calls[0];
    expect(strings.join('')).not.toContain(listId);
    expect(parameters).toEqual([[listId, otherId]]);
  });
});

describe('updating tasks', () => {
  it.each([
    null,
    undefined,
    42,
    {},
    [],
    { ...input },
    { ...input, id: 'invalid' },
  ])('rejects an invalid task identifier: %j', async (value) => {
    expect(await updateTask(value)).toEqual({
      task: null,
      error: 'Некорректный идентификатор задачи.',
    });
    expect(sql).not.toHaveBeenCalled();
  });
  it('normalizes all fields and scopes the update to task and list', async () => {
    const title = "Задача 'обновлена'";
    sql.mockResolvedValue([
      { ...row, id: taskId, title, status: 'done', priority: 'high' },
    ]);
    expect(
      await updateTask({
        ...input,
        id: taskId,
        title: `  ${title}  `,
        description: '  Details  ',
        status: 'done',
        priority: 'high',
      }),
    ).toEqual({
      task: { ...input, id: taskId, title, status: 'done', priority: 'high' },
      error: null,
    });
    const [strings, ...parameters] = sql.mock.calls[0];
    expect(strings.join('')).not.toContain(title);
    expect(parameters).toEqual([
      title,
      'Details',
      'done',
      'high',
      input.deadline,
      taskId,
      listId,
    ]);
  });
  it('reports a deleted task or mismatching list without success', async () => {
    expect(await updateTask({ ...input, id: taskId })).toEqual({
      task: null,
      error: 'Задача не найдена. Возможно, она уже удалена.',
    });
  });
});
