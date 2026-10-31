import 'server-only';

import {
  taskListTitleMaxLength,
  type TaskListMutationResult,
  type TaskList,
} from '@/entities/task-list';

import { requireSession } from '../auth/session';
import { getDb } from '../db';

function normalizeTaskListTitle(
  title: unknown,
): { title: string; error: null } | { title: null; error: string } {
  if (typeof title !== 'string' || title.trim().length === 0) {
    return { title: null, error: 'Введите название списка.' };
  }

  const normalizedTitle = title.trim();
  if (normalizedTitle.length > taskListTitleMaxLength) {
    return {
      title: null,
      error: `Название списка не должно превышать ${taskListTitleMaxLength} символов.`,
    };
  }

  return { title: normalizedTitle, error: null };
}

export async function getTaskLists(): Promise<TaskList[]> {
  await requireSession();
  const sql = getDb();
  const rows = await sql`
    SELECT id, title
    FROM task_lists
    ORDER BY created_at DESC, id DESC
  `;

  return rows.map((row): TaskList => ({ id: row.id, title: row.title }));
}

export async function createTaskList(
  title: unknown,
): Promise<TaskListMutationResult> {
  await requireSession();
  const parsed = normalizeTaskListTitle(title);
  if (parsed.error !== null) return { list: null, error: parsed.error };

  const sql = getDb();
  const [row] = await sql`
    INSERT INTO task_lists (title)
    VALUES (${parsed.title})
    RETURNING id, title
  `;
  if (!row) {
    throw new Error('PostgreSQL did not return the created task list.');
  }

  return { list: { id: row.id, title: row.title }, error: null };
}

export async function renameTaskList(
  id: unknown,
  title: unknown,
): Promise<TaskListMutationResult> {
  await requireSession();
  if (
    typeof id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return { list: null, error: 'Некорректный идентификатор списка.' };
  }

  const parsed = normalizeTaskListTitle(title);
  if (parsed.error !== null) return { list: null, error: parsed.error };

  const sql = getDb();
  const [row] = await sql`
    UPDATE task_lists
    SET title = ${parsed.title}
    WHERE id = ${id}
    RETURNING id, title
  `;
  if (!row) {
    return { list: null, error: 'Список не найден. Возможно, он уже удалён.' };
  }

  return { list: { id: row.id, title: row.title }, error: null };
}
