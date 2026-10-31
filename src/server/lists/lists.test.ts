import { beforeEach, describe, expect, it, vi } from 'vitest';

import { taskListTitleMaxLength } from '@/entities/task-list';

const { sql, requireSession } = vi.hoisted(() => ({
  sql: vi.fn(),
  requireSession: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('../auth/session', () => ({ requireSession }));
vi.mock('../db', () => ({ getDb: () => sql }));

import { createTaskList, getTaskLists } from './lists';

beforeEach(() => {
  vi.resetAllMocks();
  requireSession.mockResolvedValue({
    id: 'demo-admin',
    email: 'admin@example.com',
  });
  sql.mockResolvedValue([]);
});

describe('task list data access', () => {
  it.each([
    ['read', () => getTaskLists()],
    ['create', () => createTaskList('Work')],
  ] as const)(
    'requires a session before %s reaches the database',
    async (_, operation) => {
      const error = new Error('Session required');
      requireSession.mockRejectedValue(error);
      await expect(operation()).rejects.toBe(error);
      expect(sql).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, null, 42, {}, [], '', '   '])(
    'rejects invalid titles without writing: %j',
    async (title) => {
      await expect(createTaskList(title)).resolves.toEqual({
        list: null,
        error: 'Введите название списка.',
      });
      expect(requireSession).toHaveBeenCalledOnce();
      expect(sql).not.toHaveBeenCalled();
    },
  );

  it('rejects a title beyond the maximum length before writing', async () => {
    const result = await createTaskList('a'.repeat(taskListTitleMaxLength + 1));
    expect(result.list).toBeNull();
    expect(result.error).toContain(String(taskListTitleMaxLength));
    expect(sql).not.toHaveBeenCalled();
  });

  it('trims the title and sends quoted text as a SQL parameter', async () => {
    const title = "Список 'работа'";
    const list = { id: 'test-list', title };
    sql.mockResolvedValue([list]);
    await expect(createTaskList(`  ${title}  `)).resolves.toEqual({
      list,
      error: null,
    });
    const [strings, ...parameters] = sql.mock.calls[0];
    expect(strings.join('')).not.toContain(title);
    expect(parameters).toEqual([title]);
  });

  it('accepts a title at the maximum length', async () => {
    const list = { id: 'test-list', title: 'a'.repeat(taskListTitleMaxLength) };
    sql.mockResolvedValue([list]);
    await expect(createTaskList(list.title)).resolves.toEqual({
      list,
      error: null,
    });
  });

  it('preserves database failures for handling at the action boundary', async () => {
    const error = new Error('Database unavailable');
    sql.mockRejectedValue(error);
    await expect(createTaskList('Work')).rejects.toBe(error);
  });
});
