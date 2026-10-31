import { beforeEach, describe, expect, it, vi } from 'vitest';

const { deleteTaskList, revalidatePath } = vi.hoisted(() => ({
  deleteTaskList: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/server/lists', () => ({ deleteTaskList }));
vi.mock('next/cache', () => ({ revalidatePath }));

import { deleteList } from './actions';

beforeEach(() => vi.resetAllMocks());

describe('delete list action', () => {
  it('refreshes lists after successful deletion', async () => {
    deleteTaskList.mockResolvedValue({ error: null });
    expect(await deleteList({ id: 'list-id' })).toEqual({ error: null });
    expect(deleteTaskList).toHaveBeenCalledExactlyOnceWith('list-id');
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/lists');
  });

  it('does not refresh when server validation rejects the operation', async () => {
    const result = { error: 'Некорректный идентификатор списка.' };
    deleteTaskList.mockResolvedValue(result);
    expect(await deleteList({ id: 'invalid' })).toEqual(result);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each([undefined, null, 'invalid'])(
    'passes malformed external input to server validation: %j',
    async (input) => {
      deleteTaskList.mockResolvedValue({
        error: 'Некорректный идентификатор списка.',
      });
      await deleteList(input);
      expect(deleteTaskList).toHaveBeenCalledWith(undefined);
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it('propagates authorization redirects and technical errors without refreshing', async () => {
    const error = new Error('NEXT_REDIRECT');
    deleteTaskList.mockRejectedValue(error);
    await expect(deleteList({ id: 'list-id' })).rejects.toBe(error);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
