import { beforeEach, describe, expect, it, vi } from 'vitest';

const { renameTaskList, revalidatePath } = vi.hoisted(() => ({
  renameTaskList: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/server/lists', () => ({ renameTaskList }));
vi.mock('next/cache', () => ({ revalidatePath }));

import { renameList } from './actions';

beforeEach(() => vi.resetAllMocks());

describe('rename list action', () => {
  it('refreshes lists after a successful update', async () => {
    const list = { id: 'list-id', title: 'Работа' };
    const result = { list, error: null };
    renameTaskList.mockResolvedValue(result);
    expect(await renameList(list)).toEqual(result);
    expect(renameTaskList).toHaveBeenCalledWith(list.id, list.title);
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/lists');
  });

  it('returns an expected error without refreshing', async () => {
    const result = { list: null, error: 'Список не найден.' };
    renameTaskList.mockResolvedValue(result);
    expect(await renameList({ id: 'list-id', title: 'Работа' })).toEqual(
      result,
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each([undefined, null, 'invalid'])(
    'passes malformed external input through server validation: %j',
    async (input) => {
      renameTaskList.mockResolvedValue({
        list: null,
        error: 'Некорректные данные.',
      });
      await renameList(input);
      expect(renameTaskList).toHaveBeenCalledWith(undefined, undefined);
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it('does not catch an authorization redirect or technical failure', async () => {
    const error = new Error('NEXT_REDIRECT');
    renameTaskList.mockRejectedValue(error);
    await expect(renameList({ id: 'list-id', title: 'Работа' })).rejects.toBe(
      error,
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
