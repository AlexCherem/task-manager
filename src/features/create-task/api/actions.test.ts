import { beforeEach, describe, expect, it, vi } from 'vitest';

const { saveTask, revalidatePath } = vi.hoisted(() => ({
  saveTask: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/server/tasks', () => ({ createTask: saveTask }));
vi.mock('next/cache', () => ({ revalidatePath }));
import { createTask } from './actions';
beforeEach(() => vi.resetAllMocks());

describe('create task action', () => {
  it('refreshes the task page and list cards after saving', async () => {
    const result = {
      task: { id: 'task-id', listId: 'saved-list-id' },
      error: null,
    };
    saveTask.mockResolvedValue(result);
    const input = { listId: 'untrusted-input-id' };
    expect(await createTask(input)).toEqual(result);
    expect(saveTask).toHaveBeenCalledWith(input);
    expect(revalidatePath.mock.calls).toEqual([
      ['/lists/saved-list-id'],
      ['/lists'],
    ]);
  });
  it('does not refresh on an expected validation error', async () => {
    const result = { task: null, error: 'Введите название задачи.' };
    saveTask.mockResolvedValue(result);
    expect(await createTask(null)).toEqual(result);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it('does not swallow redirects or technical errors', async () => {
    const error = new Error('NEXT_REDIRECT');
    saveTask.mockRejectedValue(error);
    await expect(createTask({})).rejects.toBe(error);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
