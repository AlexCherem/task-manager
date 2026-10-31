import type { Meta, StoryContext, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, waitFor, within } from 'storybook/test';

import type { TaskListMutationResult } from '@/entities/task-list';

import {
  CreateListButton,
  type CreateListButtonProps,
} from './create-list-button';

const success: TaskListMutationResult = {
  list: { id: 'storybook-list', title: 'Работа' },
  error: null,
};
const submit = fn<CreateListButtonProps['onSubmit']>();
const meta = {
  title: 'Features/Lists/CreateListButton',
  component: CreateListButton,
  args: { onSubmit: submit },
  beforeEach() {
    submit.mockReset().mockResolvedValue(success);
  },
} satisfies Meta<typeof CreateListButton>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openDialog({
  canvas,
  canvasElement,
  userEvent,
}: Pick<StoryContext, 'canvas' | 'canvasElement' | 'userEvent'>) {
  await userEvent.click(canvas.getByRole('button', { name: 'Создать список' }));

  return within(canvasElement.ownerDocument.body).findByRole('dialog', {
    name: 'Новый список',
  });
}

export const Submit: Story = {
  play: async (context) => {
    const dialog = await openDialog(context);
    const form = within(dialog);
    await context.userEvent.type(
      form.getByRole('textbox', { name: 'Название списка' }),
      'Работа',
    );
    await context.userEvent.click(
      form.getByRole('button', { name: 'Создать' }),
    );
    await waitFor(() =>
      expect(context.args.onSubmit).toHaveBeenCalledWith({ title: 'Работа' }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const RequiredTitle: Story = {
  play: async (context) => {
    const form = within(await openDialog(context));
    await context.userEvent.click(
      form.getByRole('button', { name: 'Создать' }),
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
      error: 'Ошибка сохранения.',
    });
    const dialog = await openDialog(context);
    const form = within(dialog);
    const input = form.getByRole('textbox', { name: 'Название списка' });
    const button = form.getByRole('button', { name: 'Создать' });
    await context.userEvent.type(input, 'Работа');
    await context.userEvent.click(button);
    await expect(await form.findByRole('alert')).toHaveTextContent(
      'Ошибка сохранения.',
    );
    await waitFor(() => expect(button).toBeEnabled());
    await context.userEvent.type(input, ' 2');
    await expect(form.queryByRole('alert')).not.toBeInTheDocument();
    await context.userEvent.click(button);
    await waitFor(() => expect(context.args.onSubmit).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const CancelAndReopen: Story = {
  play: async (context) => {
    const dialog = await openDialog(context);
    const form = within(dialog);
    await context.userEvent.type(
      form.getByRole('textbox', { name: 'Название списка' }),
      'Черновик',
    );
    await context.userEvent.click(form.getByRole('button', { name: 'Отмена' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const reopened = within(await openDialog(context));
    await expect(
      reopened.getByRole('textbox', { name: 'Название списка' }),
    ).toHaveValue('');
    await expect(context.args.onSubmit).not.toHaveBeenCalled();
  },
};

export const Submitting: Story = {
  play: async (context) => {
    const request = Promise.withResolvers<TaskListMutationResult>();
    context.args.onSubmit.mockReturnValueOnce(request.promise);
    const dialog = await openDialog(context);
    const form = within(dialog);
    const input = form.getByRole('textbox', { name: 'Название списка' });
    await context.userEvent.type(input, 'Работа');
    await context.userEvent.click(
      form.getByRole('button', { name: 'Создать' }),
    );
    try {
      await waitFor(() => expect(context.args.onSubmit).toHaveBeenCalledOnce());
      await expect(input).toBeDisabled();
      await expect(
        form.getByRole('button', { name: 'Создать' }),
      ).toBeDisabled();
      await expect(form.getByRole('button', { name: 'Отмена' })).toBeDisabled();
    } finally {
      request.resolve(success);
    }
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};
