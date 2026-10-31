import { beforeEach, describe, expect, it, vi } from 'vitest';

import { taskListTitleMaxLength } from '@/entities/task-list';

const { sql, requireSession } = vi.hoisted(() => ({
  sql: vi.fn(),
  requireSession: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('../auth/session', () => ({ requireSession }));
vi.mock('../db', () => ({ getDb: () => sql }));

import { createTaskList, getTaskLists, renameTaskList } from './lists';

const listId = '00000000-0000-4000-8000-000000000001';

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
    ['rename', () => renameTaskList(listId, 'Work')],
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

describe('renaming task lists', () => {
  it.each([undefined, null, 42, {}, '', 'not-a-uuid', "' OR true --"])(
    'rejects an invalid identifier without querying: %j',
    async (id) => {
      const result = await renameTaskList(id, 'Work');
      expect(result.list).toBeNull();
      expect(result.error).toBe('Некорректный идентификатор списка.');
      expect(sql).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, null, 42, {}, [], '', '   '])(
    'rejects an invalid new title without querying: %j',
    async (title) => {
      await expect(renameTaskList(listId, title)).resolves.toEqual({
        list: null,
        error: 'Введите название списка.',
      });
      expect(sql).not.toHaveBeenCalled();
    },
  );

  it('rejects a title beyond the maximum length', async () => {
    const result = await renameTaskList(
      listId,
      'a'.repeat(taskListTitleMaxLength + 1),
    );
    expect(result.list).toBeNull();
    expect(result.error).toContain(String(taskListTitleMaxLength));
    expect(sql).not.toHaveBeenCalled();
  });

  it('normalizes the title and passes both title and id as SQL parameters', async () => {
    const title = "Работа 'новая'";
    const list = { id: listId, title };
    sql.mockResolvedValue([list]);
    await expect(renameTaskList(listId, `  ${title}  `)).resolves.toEqual({
      list,
      error: null,
    });
    const [strings, ...parameters] = sql.mock.calls[0];
    expect(strings.join('')).not.toContain(title);
    expect(strings.join('')).not.toContain(listId);
    expect(parameters).toEqual([title, listId]);
  });

  it('reports a list that no longer exists', async () => {
    await expect(renameTaskList(listId, 'Work')).resolves.toEqual({
      list: null,
      error: 'Список не найден. Возможно, он уже удалён.',
    });
  });

  it('preserves a database failure', async () => {
    const error = new Error('Database unavailable');
    sql.mockRejectedValue(error);
    await expect(renameTaskList(listId, 'Work')).rejects.toBe(error);
  });
});
