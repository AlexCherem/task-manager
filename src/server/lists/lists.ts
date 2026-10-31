import 'server-only';

import {
  taskListTitleMaxLength,
  type CreateTaskListResult,
  type TaskList,
} from '@/entities/task-list';

import { requireSession } from '../auth/session';
import { getDb } from '../db';

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
): Promise<CreateTaskListResult> {
  await requireSession();
  if (typeof title !== 'string' || title.trim().length === 0) {
    return { list: null, error: 'Введите название списка.' };
  }

  const normalizedTitle = title.trim();
  if (normalizedTitle.length > taskListTitleMaxLength) {
    return {
      list: null,
      error: `Название списка не должно превышать ${taskListTitleMaxLength} символов.`,
    };
  }

  const sql = getDb();
  const [row] = await sql`
    INSERT INTO task_lists (title)
    VALUES (${normalizedTitle})
    RETURNING id, title
  `;
  if (!row) {
    throw new Error('PostgreSQL did not return the created task list.');
  }

  return { list: { id: row.id, title: row.title }, error: null };
}
