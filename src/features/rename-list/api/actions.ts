'use server';

import { revalidatePath } from 'next/cache';

import type { TaskListMutationResult } from '@/entities/task-list';
import { renameTaskList } from '@/server/lists';

export async function renameList(
  input: unknown,
): Promise<TaskListMutationResult> {
  const id =
    typeof input === 'object' && input !== null && 'id' in input
      ? input.id
      : undefined;
  const title =
    typeof input === 'object' && input !== null && 'title' in input
      ? input.title
      : undefined;
  const result = await renameTaskList(id, title);
  if (result.error === null) revalidatePath('/lists');

  return result;
}
