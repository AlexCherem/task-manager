import type { Meta, StoryContext, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';

import type { TaskListMutationResult } from '@/entities/task-list';

import {
  RenameListButton,
  type RenameListButtonProps,
} from './rename-list-button';

const list = { id: '00000000-0000-4000-8000-000000000001', title: 'Работа' };
const success: TaskListMutationResult = {
  list: { ...list, title: 'Личные дела' },
  error: null,
};
const submit = fn<RenameListButtonProps['onSubmit']>();
const meta = {
  title: 'Features/Lists/RenameListButton',
  component: RenameListButton,
  args: { list, onSubmit: submit },
  beforeEach() {
    submit.mockReset().mockResolvedValue(success);
  },
} satisfies Meta<typeof RenameListButton>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openDialog({
  canvas,
  canvasElement,
  userEvent,
}: Pick<StoryContext, 'canvas' | 'canvasElement' | 'userEvent'>) {
  await userEvent.click(
    canvas.getByRole('button', { name: /^Переименовать список «/ }),
  );

  return within(canvasElement.ownerDocument.body).findByRole('dialog', {
    name: 'Переименовать список',
  });
}

export const Submit: Story = {
  play: async (context) => {
    const dialog = await openDialog(context);
    const form = within(dialog);
    const input = form.getByRole('textbox', { name: 'Название списка' });
    await expect(input).toHaveValue('Работа');
    await context.userEvent.clear(input);
    await context.userEvent.type(input, 'Личные дела');
    await context.userEvent.click(
      form.getByRole('button', { name: 'Сохранить' }),
    );
    await waitFor(() =>
      expect(context.args.onSubmit).toHaveBeenCalledWith({
        id: list.id,
        title: 'Личные дела',
      }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const RequiredTitle: Story = {
  play: async (context) => {
    const form = within(await openDialog(context));
    await context.userEvent.clear(
      form.getByRole('textbox', { name: 'Название списка' }),
    );
    await context.userEvent.click(
      form.getByRole('button', { name: 'Сохранить' }),
    );
    await waitFor(() =>
      expect(form.getByText('Введите название списка.')).toBeVisible(),
    );
    await expect(context.args.onSubmit).not.toHaveBeenCalled();
  },
};

export const RetryAfterError: Story = {
  play: async (context) => {
    context.args.onSubmit.mockResolvedValueOnce({
      list: null,
      error: 'Список не найден. Возможно, он уже удалён.',
    });
    const dialog = await openDialog(context);
    const form = within(dialog);
    const input = form.getByRole('textbox', { name: 'Название списка' });
    const button = form.getByRole('button', { name: 'Сохранить' });
    await context.userEvent.click(button);
    await expect(await form.findByRole('alert')).toHaveTextContent(
      'Список не найден. Возможно, он уже удалён.',
    );
    await waitFor(() => expect(button).toBeEnabled());
    await context.userEvent.type(input, ' 2');
    await expect(form.queryByRole('alert')).not.toBeInTheDocument();
    await context.userEvent.click(button);
    await waitFor(() => expect(context.args.onSubmit).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const ConnectionError: Story = {
  play: async (context) => {
    context.args.onSubmit.mockRejectedValueOnce(
      new Error('Network unavailable'),
    );
    const form = within(await openDialog(context));
    await context.userEvent.click(
      form.getByRole('button', { name: 'Сохранить' }),
    );
    await expect(await form.findByRole('alert')).toHaveTextContent(
      'Не удалось переименовать список. Попробуйте ещё раз.',
    );
    await expect(
      form.getByRole('textbox', { name: 'Название списка' }),
    ).toHaveValue(list.title);
  },
};

export const CancelAndReopen: Story = {
  play: async (context) => {
    const dialog = await openDialog(context);
    const form = within(dialog);
    const input = form.getByRole('textbox', { name: 'Название списка' });
    await context.userEvent.clear(input);
    await context.userEvent.type(input, 'Черновик');
    await context.userEvent.click(form.getByRole('button', { name: 'Отмена' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const reopened = within(await openDialog(context));
    await expect(
      reopened.getByRole('textbox', { name: 'Название списка' }),
    ).toHaveValue(list.title);
    await expect(context.args.onSubmit).not.toHaveBeenCalled();
  },
};

export const Submitting: Story = {
  play: async (context) => {
    const request = Promise.withResolvers<TaskListMutationResult>();
    context.args.onSubmit.mockReturnValueOnce(request.promise);
    const dialog = await openDialog(context);
    const form = within(dialog);
    const button = form.getByRole('button', { name: 'Сохранить' });
    await context.userEvent.click(button);
    try {
      await waitFor(() => expect(context.args.onSubmit).toHaveBeenCalledOnce());
      await expect(button).toBeDisabled();
      await expect(
        form.getByRole('textbox', { name: 'Название списка' }),
      ).toBeDisabled();
      await expect(form.getByRole('button', { name: 'Отмена' })).toBeDisabled();
      await context.userEvent.keyboard('{Escape}');
      await expect(dialog).toBeInTheDocument();
    } finally {
      request.resolve(success);
    }
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const UpdatedTitleOnReopen: Story = {
  render: function Render(args) {
    const [currentList, setCurrentList] = useState(args.list);

    return (
      <RenameListButton
        list={currentList}
        onSubmit={async (values) => {
          const result = await args.onSubmit(values);
          if (result.error === null) setCurrentList(result.list);

          return result;
        }}
      />
    );
  },
  play: async (context) => {
    const dialog = await openDialog(context);
    await context.userEvent.click(
      within(dialog).getByRole('button', { name: 'Сохранить' }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const reopened = within(await openDialog(context));
    await expect(
      reopened.getByRole('textbox', { name: 'Название списка' }),
    ).toHaveValue('Личные дела');
  },
};
