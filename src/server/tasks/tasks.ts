import 'server-only';

import type { QueryRows } from '@neondatabase/serverless';

import {
  getTaskStats,
  taskTitleMaxLength,
  taskStatusLabels,
  taskPriorityLabels,
  type Task,
  type TaskMutationResult,
  type CreateTaskInput,
  type TaskStats,
  type DeleteTaskResult,
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

function normalizeTaskInput(
  input: unknown,
): { data: CreateTaskInput; error: null } | { data: null; error: string } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { data: null, error: 'Некорректные данные задачи.' };
  }

  const { listId, title, description, status, priority, deadline } =
    input as Record<string, unknown>;
  if (!isUuid(listId))
    return { data: null, error: 'Некорректный идентификатор списка.' };
  if (typeof title !== 'string' || title.trim().length === 0) {
    return { data: null, error: 'Введите название задачи.' };
  }
  if (title.trim().length > taskTitleMaxLength) {
    return {
      data: null,
      error: `Название задачи не должно превышать ${taskTitleMaxLength} символов.`,
    };
  }
  if (typeof description !== 'string')
    return { data: null, error: 'Описание должно быть текстом.' };
  if (typeof status !== 'string' || !Object.hasOwn(taskStatusLabels, status)) {
    return { data: null, error: 'Выберите корректный статус.' };
  }
  if (
    typeof priority !== 'string' ||
    !Object.hasOwn(taskPriorityLabels, priority)
  ) {
    return { data: null, error: 'Выберите корректный приоритет.' };
  }
  if (
    typeof deadline !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(deadline) ||
    !Number.isFinite(Date.parse(deadline)) ||
    new Date(deadline).toISOString() !== deadline
  ) {
    return { data: null, error: 'Укажите корректные дату и время дедлайна.' };
  }

  return {
    data: {
      listId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      deadline,
    } as CreateTaskInput,
    error: null,
  };
}

export async function createTask(input: unknown): Promise<TaskMutationResult> {
  await requireSession();
  const parsed = normalizeTaskInput(input);
  if (parsed.error !== null) return { task: null, error: parsed.error };

  const { listId, title, description, status, priority, deadline } =
    parsed.data;
  const sql = getDb();
  const [row] = await sql`
    INSERT INTO tasks (list_id, title, description, status, priority, deadline)
    SELECT id, ${title}, ${description}, ${status}, ${priority}, ${deadline}
    FROM task_lists WHERE id = ${listId}
    RETURNING id, list_id, title, description, status, priority, deadline
  `;
  if (!row)
    return { task: null, error: 'Список не найден. Возможно, он уже удалён.' };

  return { task: toTask(row), error: null };
}

export async function updateTask(input: unknown): Promise<TaskMutationResult> {
  await requireSession();
  if (
    typeof input !== 'object' ||
    input === null ||
    !('id' in input) ||
    !isUuid(input.id)
  ) {
    return { task: null, error: 'Некорректный идентификатор задачи.' };
  }
  const parsed = normalizeTaskInput(input);
  if (parsed.error !== null) return { task: null, error: parsed.error };

  const { listId, title, description, status, priority, deadline } =
    parsed.data;
  const sql = getDb();
  const [row] = await sql`
    UPDATE tasks
    SET title = ${title}, description = ${description}, status = ${status},
        priority = ${priority}, deadline = ${deadline}
    WHERE id = ${input.id} AND list_id = ${listId}
    RETURNING id, list_id, title, description, status, priority, deadline
  `;
  if (!row)
    return {
      task: null,
      error: 'Задача не найдена. Возможно, она уже удалена.',
    };

  return { task: toTask(row), error: null };
}

export async function getTaskListStats(
  listIds: unknown,
  now: Date = new Date(),
): Promise<Record<string, TaskStats>> {
  await requireSession();
  if (!Array.isArray(listIds) || !listIds.every(isUuid)) {
    throw new Error('Invalid task list identifiers.');
  }
  if (listIds.length === 0) return {};

  const tasksByList = new Map<string, Pick<Task, 'status' | 'deadline'>[]>(
    listIds.map((id) => [id, []]),
  );
  const sql = getDb();
  const rows = await sql`
    SELECT list_id, status, deadline
    FROM tasks WHERE list_id = ANY(${listIds}::uuid[])
  `;
  for (const row of rows) {
    tasksByList.get(row.list_id)?.push({
      status: row.status,
      deadline: new Date(row.deadline).toISOString(),
    });
  }

  return Object.fromEntries(
    [...tasksByList].map(([id, tasks]) => [id, getTaskStats(tasks, now)]),
  );
}

export async function deleteTask(input: unknown): Promise<DeleteTaskResult> {
  await requireSession();
  if (
    typeof input !== 'object' ||
    input === null ||
    !('id' in input) ||
    !isUuid(input.id)
  ) {
    return { listId: null, error: 'Некорректный идентификатор задачи.' };
  }
  if (!('listId' in input) || !isUuid(input.listId)) {
    return { listId: null, error: 'Некорректный идентификатор списка.' };
  }

  const sql = getDb();
  await sql`DELETE FROM tasks WHERE id = ${input.id} AND list_id = ${input.listId}`;

  return { listId: input.listId, error: null };
}
