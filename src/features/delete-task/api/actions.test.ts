import { beforeEach, describe, expect, it, vi } from 'vitest';

const { removeTask, revalidatePath } = vi.hoisted(() => ({
  removeTask: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/server/tasks', () => ({ deleteTask: removeTask }));
vi.mock('next/cache', () => ({ revalidatePath }));
import { deleteTask } from './actions';

beforeEach(() => vi.resetAllMocks());

describe('delete task action', () => {
  it('refreshes tasks and cards using the validated list id from the server', async () => {
    const result = { listId: 'validated-list-id', error: null };
    const input = { id: 'task-id', listId: 'untrusted-input-id' };
    removeTask.mockResolvedValue(result);
    expect(await deleteTask(input)).toEqual(result);
    expect(removeTask).toHaveBeenCalledExactlyOnceWith(input);
    expect(revalidatePath.mock.calls).toEqual([
      ['/lists/validated-list-id'],
      ['/lists'],
    ]);
  });
  it.each([undefined, null, 'invalid', { id: 'invalid' }])(
    'passes malformed input to validation without refreshing: %j',
    async (input) => {
      const result = {
        listId: null,
        error: 'Некорректный идентификатор задачи.',
      };
      removeTask.mockResolvedValue(result);
      expect(await deleteTask(input)).toEqual(result);
      expect(removeTask).toHaveBeenCalledExactlyOnceWith(input);
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );
  it('preserves authorization redirects and technical failures', async () => {
    const error = new Error('NEXT_REDIRECT');
    removeTask.mockRejectedValue(error);
    await expect(deleteTask({})).rejects.toBe(error);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
