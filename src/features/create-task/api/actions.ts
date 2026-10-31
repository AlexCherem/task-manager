'use server';

import { revalidatePath } from 'next/cache';

import type { TaskMutationResult } from '@/entities/task';
import { createTask as saveTask } from '@/server/tasks';

export async function createTask(input: unknown): Promise<TaskMutationResult> {
  const result = await saveTask(input);
  if (result.error === null) {
    revalidatePath(`/lists/${result.task.listId}`);
    revalidatePath('/lists');
  }

  return result;
}
