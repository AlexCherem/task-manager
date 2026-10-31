import type { Meta, StoryContext, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, waitFor, within } from 'storybook/test';

import type { TaskMutationResult } from '@/entities/task';
import {
  CreateTaskButton,
  type CreateTaskButtonProps,
} from './create-task-button';

const listId = '00000000-0000-4000-8000-000000000001';
const localDeadline = '2030-01-15T14:30';
const success: TaskMutationResult = {
  task: {
    id: 'story-task',
    listId,
    title: 'Новая задача',
    description: '',
    status: 'new',
    priority: 'medium',
    deadline: '2030-01-15T14:30:00.000Z',
  },
  error: null,
};
const submit = fn<CreateTaskButtonProps['onSubmit']>();
const meta = {
  title: 'Features/Tasks/CreateTaskButton',
  component: CreateTaskButton,
  args: { listId, onSubmit: submit },
  beforeEach() {
    submit.mockReset().mockResolvedValue(success);
  },
} satisfies Meta<typeof CreateTaskButton>;
export default meta;
type Story = StoryObj<typeof meta>;

async function openDialog({
  canvas,
  canvasElement,
  userEvent,
}: Pick<StoryContext, 'canvas' | 'canvasElement' | 'userEvent'>) {
  await userEvent.click(canvas.getByRole('button', { name: 'Создать задачу' }));

  return within(canvasElement.ownerDocument.body).findByRole('dialog', {
    name: 'Новая задача',
  });
}
async function fillRequired(context: StoryContext) {
  const dialog = await openDialog(context);
  const form = within(dialog);
  await context.userEvent.type(
    form.getByRole('textbox', { name: 'Название задачи' }),
    'Новая задача',
  );
  await context.userEvent.type(
    form.getByLabelText('Дедлайн'),
    '15.01.2030 14:30',
  );
  await context.userEvent.keyboard('{Enter}');
  await expect(context.args.onSubmit).not.toHaveBeenCalled();

  return dialog;
}

export const Submit: Story = {
  play: async (context) => {
    const dialog = await fillRequired(context);
    await context.userEvent.click(
      within(dialog).getByRole('button', { name: 'Создать' }),
    );
    await waitFor(() =>
      expect(context.args.onSubmit).toHaveBeenCalledWith({
        listId,
        title: 'Новая задача',
        description: '',
        status: 'new',
        priority: 'medium',
        deadline: new Date(localDeadline).toISOString(),
      }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};
export const RequiredFields: Story = {
  play: async (context) => {
    const form = within(await openDialog(context));
    await context.userEvent.click(
      form.getByRole('button', { name: 'Создать' }),
    );
    await waitFor(() => {
      expect(form.getByText('Введите название задачи.')).toBeVisible();
      expect(form.getByText('Укажите дедлайн.')).toBeVisible();
    });
    await expect(context.args.onSubmit).not.toHaveBeenCalled();
  },
};
export const RejectedList: Story = {
  play: async (context) => {
    context.args.onSubmit.mockResolvedValueOnce({
      task: null,
      error: 'Список не найден. Возможно, он уже удалён.',
    });
    const form = within(await fillRequired(context));
    await context.userEvent.click(
      form.getByRole('button', { name: 'Создать' }),
    );
    await expect(await form.findByRole('alert')).toHaveTextContent(
      'Список не найден. Возможно, он уже удалён.',
    );
  },
};
export const RetryAfterFailure: Story = {
  play: async (context) => {
    context.args.onSubmit.mockRejectedValueOnce(
      new Error('Network unavailable'),
    );
    const dialog = await fillRequired(context);
    const form = within(dialog);
    const button = form.getByRole('button', { name: 'Создать' });
    await context.userEvent.click(button);
    await expect(await form.findByRole('alert')).toHaveTextContent(
      'Не удалось создать задачу. Попробуйте ещё раз.',
    );
    await waitFor(() => expect(button).toBeEnabled());
    await expect(
      form.getByRole('textbox', { name: 'Название задачи' }),
    ).toHaveValue('Новая задача');
    await context.userEvent.click(button);
    await waitFor(() => expect(context.args.onSubmit).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};
export const CancelAndReopen: Story = {
  play: async (context) => {
    const dialog = await fillRequired(context);
    await context.userEvent.click(
      within(dialog).getByRole('button', { name: 'Отмена' }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const form = within(await openDialog(context));
    await expect(
      form.getByRole('textbox', { name: 'Название задачи' }),
    ).toHaveValue('');
    await expect(form.getByLabelText('Дедлайн')).toHaveValue('');
    await waitFor(() => {
      expect(form.getByText('Новая', { exact: true })).toBeVisible();
      expect(form.getByText('Средний', { exact: true })).toBeVisible();
    });
    await expect(context.args.onSubmit).not.toHaveBeenCalled();
  },
};
export const Submitting: Story = {
  play: async (context) => {
    const request = Promise.withResolvers<TaskMutationResult>();
    context.args.onSubmit.mockReturnValueOnce(request.promise);
    const dialog = await fillRequired(context);
    const form = within(dialog);
    await context.userEvent.click(
      form.getByRole('button', { name: 'Создать' }),
    );
    try {
      await waitFor(() => expect(context.args.onSubmit).toHaveBeenCalledOnce());
      await expect(
        form.getByRole('textbox', { name: 'Название задачи' }),
      ).toBeDisabled();
      await expect(form.getByLabelText('Дедлайн')).toBeDisabled();
      await expect(
        form.getByRole('button', { name: 'Создать' }),
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
