'use server';

import { revalidatePath } from 'next/cache';

import type { CreateTaskListResult } from '@/entities/task-list';
import { createTaskList } from '@/server/lists';

export async function createList(
  input: unknown,
): Promise<CreateTaskListResult> {
  const title =
    typeof input === 'object' && input !== null && 'title' in input
      ? input.title
      : undefined;
  const result = await createTaskList(title);
  if (result.error === null) revalidatePath('/lists');

  return result;
}
