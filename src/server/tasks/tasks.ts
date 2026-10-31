import 'server-only';

import type { QueryRows } from '@neondatabase/serverless';

import {
  taskTitleMaxLength,
  taskStatusLabels,
  taskPriorityLabels,
  type Task,
  type TaskMutationResult,
} from '@/entities/task';
import { isUuid } from '@/shared/lib/is-uuid';

import { requireSession } from '../auth/session';
import { getDb } from '../db';

function toTask(row: QueryRows<false>[number]): Task {
  return {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    deadline: new Date(row.deadline).toISOString(),
  };
}

export async function getTasksByList(listId: unknown): Promise<Task[]> {
  await requireSession();
  if (!isUuid(listId)) return [];

  const sql = getDb();
  const rows = await sql`
    SELECT id, list_id, title, description, status, priority, deadline
    FROM tasks WHERE list_id = ${listId}
    ORDER BY created_at ASC, id ASC
  `;

  return rows.map(toTask);
}

export async function createTask(input: unknown): Promise<TaskMutationResult> {
  await requireSession();
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { task: null, error: 'Некорректные данные задачи.' };
  }

  const { listId, title, description, status, priority, deadline } =
    input as Record<string, unknown>;
  if (!isUuid(listId))
    return { task: null, error: 'Некорректный идентификатор списка.' };
  if (typeof title !== 'string' || title.trim().length === 0) {
    return { task: null, error: 'Введите название задачи.' };
  }
  if (title.trim().length > taskTitleMaxLength) {
    return {
      task: null,
      error: `Название задачи не должно превышать ${taskTitleMaxLength} символов.`,
    };
  }
  if (typeof description !== 'string')
    return { task: null, error: 'Описание должно быть текстом.' };
  if (typeof status !== 'string' || !Object.hasOwn(taskStatusLabels, status)) {
    return { task: null, error: 'Выберите корректный статус.' };
  }
  if (
    typeof priority !== 'string' ||
    !Object.hasOwn(taskPriorityLabels, priority)
  ) {
    return { task: null, error: 'Выберите корректный приоритет.' };
  }
  if (
    typeof deadline !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(deadline) ||
    !Number.isFinite(Date.parse(deadline)) ||
    new Date(deadline).toISOString() !== deadline
  ) {
    return { task: null, error: 'Укажите корректные дату и время дедлайна.' };
  }

  const sql = getDb();
  const [row] = await sql`
    INSERT INTO tasks (list_id, title, description, status, priority, deadline)
    SELECT id, ${title.trim()}, ${description.trim()}, ${status}, ${priority}, ${deadline}
    FROM task_lists WHERE id = ${listId}
    RETURNING id, list_id, title, description, status, priority, deadline
  `;
  if (!row)
    return { task: null, error: 'Список не найден. Возможно, он уже удалён.' };

  return { task: toTask(row), error: null };
}
