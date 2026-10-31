'use server';

import { revalidatePath } from 'next/cache';

import type { DeleteTaskResult } from '@/entities/task';
import { deleteTask as removeTask } from '@/server/tasks';

export async function deleteTask(input: unknown): Promise<DeleteTaskResult> {
  const result = await removeTask(input);
  if (result.error === null) {
    revalidatePath(`/lists/${result.listId}`);
    revalidatePath('/lists');
  }

  return result;
}
