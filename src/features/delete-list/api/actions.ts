'use server';

import { revalidatePath } from 'next/cache';

import type { DeleteTaskListResult } from '@/entities/task-list';
import { deleteTaskList } from '@/server/lists';

export async function deleteList(
  input: unknown,
): Promise<DeleteTaskListResult> {
  const id =
    typeof input === 'object' && input !== null && 'id' in input
      ? input.id
      : undefined;
  const result = await deleteTaskList(id);
  if (result.error === null) revalidatePath('/lists');

  return result;
}
