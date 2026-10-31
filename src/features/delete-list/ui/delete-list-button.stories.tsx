import type { Meta, StoryContext, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, waitFor, within } from 'storybook/test';

import type { DeleteTaskListResult } from '@/entities/task-list';

import {
  DeleteListButton,
  type DeleteListButtonProps,
} from './delete-list-button';

const list = { id: '00000000-0000-4000-8000-000000000001', title: 'Работа' };
const remove = fn<DeleteListButtonProps['onDelete']>();
const meta = {
  title: 'Features/Lists/DeleteListButton',
  component: DeleteListButton,
  args: { list, onDelete: remove },
  beforeEach() {
    remove.mockReset().mockResolvedValue({ error: null });
  },
} satisfies Meta<typeof DeleteListButton>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openDialog({
  canvas,
  canvasElement,
  userEvent,
}: Pick<StoryContext, 'canvas' | 'canvasElement' | 'userEvent'>) {
  await userEvent.click(
    canvas.getByRole('button', { name: 'Удалить список «Работа»' }),
  );

  return within(canvasElement.ownerDocument.body).findByRole('dialog', {
    name: 'Удалить список?',
  });
}

export const WarnAndCancel: Story = {
  play: async (context) => {
    const dialog = await openDialog(context);
    const content = within(dialog);
    await waitFor(() =>
      expect(content.getByText('Работа', { exact: true })).toBeVisible(),
    );
    await expect(
      content.getByText(/и все его задачи будут удалены/),
    ).toBeVisible();
    await expect(
      content.getByText('Восстановить данные будет нельзя.'),
    ).toBeVisible();
    await expect(context.args.onDelete).not.toHaveBeenCalled();
    await context.userEvent.click(
      content.getByRole('button', { name: 'Отмена' }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(context.args.onDelete).not.toHaveBeenCalled();
  },
};

export const Confirm: Story = {
  play: async (context) => {
    const dialog = await openDialog(context);
    await context.userEvent.click(
      within(dialog).getByRole('button', { name: 'Удалить список' }),
    );
    await waitFor(() => expect(context.args.onDelete).toHaveBeenCalledOnce());
    await expect(context.args.onDelete).toHaveBeenCalledWith({ id: list.id });
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const RetryAfterError: Story = {
  play: async (context) => {
    context.args.onDelete.mockResolvedValueOnce({
      error: 'Удаление недоступно.',
    });
    const dialog = await openDialog(context);
    const content = within(dialog);
    const button = content.getByRole('button', { name: 'Удалить список' });
    await context.userEvent.click(button);
    await expect(await content.findByRole('alert')).toHaveTextContent(
      'Удаление недоступно.',
    );
    await waitFor(() => expect(button).toBeEnabled());
    await context.userEvent.click(button);
    await waitFor(() => expect(context.args.onDelete).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const ConnectionError: Story = {
  play: async (context) => {
    context.args.onDelete.mockRejectedValueOnce(
      new Error('Network unavailable'),
    );
    const content = within(await openDialog(context));
    await context.userEvent.click(
      content.getByRole('button', { name: 'Удалить список' }),
    );
    await expect(await content.findByRole('alert')).toHaveTextContent(
      'Не удалось удалить список. Попробуйте ещё раз.',
    );
  },
};

export const Submitting: Story = {
  play: async (context) => {
    const request = Promise.withResolvers<DeleteTaskListResult>();
    context.args.onDelete.mockReturnValueOnce(request.promise);
    const dialog = await openDialog(context);
    const content = within(dialog);
    const button = content.getByRole('button', { name: 'Удалить список' });
    await context.userEvent.click(button);
    try {
      await waitFor(() => expect(context.args.onDelete).toHaveBeenCalledOnce());
      await expect(button).toBeDisabled();
      await expect(
        content.getByRole('button', { name: 'Отмена' }),
      ).toBeDisabled();
      await expect(
        content.queryByRole('button', { name: 'Закрыть' }),
      ).not.toBeInTheDocument();
      await context.userEvent.keyboard('{Escape}');
      await expect(dialog).toBeInTheDocument();
      await expect(context.args.onDelete).toHaveBeenCalledOnce();
    } finally {
      request.resolve({ error: null });
    }
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const ReopenClearsError: Story = {
  play: async (context) => {
    context.args.onDelete.mockResolvedValueOnce({
      error: 'Удаление недоступно.',
    });
    const dialog = await openDialog(context);
    const content = within(dialog);
    await context.userEvent.click(
      content.getByRole('button', { name: 'Удалить список' }),
    );
    await content.findByRole('alert');
    const cancel = content.getByRole('button', { name: 'Отмена' });
    await waitFor(() => expect(cancel).toBeEnabled());
    await context.userEvent.click(cancel);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const reopened = within(await openDialog(context));
    await expect(reopened.queryByRole('alert')).not.toBeInTheDocument();
    await expect(context.args.onDelete).toHaveBeenCalledOnce();
  },
};
