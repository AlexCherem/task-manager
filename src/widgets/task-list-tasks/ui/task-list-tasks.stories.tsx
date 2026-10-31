import type { Meta, StoryContext, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';

import type { Task, TaskMutationResult } from '@/entities/task';
import { TaskListTasks } from './task-list-tasks';

const task: Task = {
  id: '00000000-0000-4000-8000-000000000003',
  listId: '00000000-0000-4000-8000-000000000001',
  title: 'Проверить требования',
  description: 'Сверить готовые сценарии.',
  status: 'new',
  priority: 'medium',
  deadline: '2029-12-31T12:00:00.000Z',
};
const other: Task = {
  ...task,
  id: '00000000-0000-4000-8000-000000000004',
  title: 'Подготовить демо',
  status: 'in_progress',
  deadline: '2030-01-02T12:00:00.000Z',
};
const submit = fn<ComponentProps<typeof TaskListTasks>['onUpdate']>();
const remove = fn<ComponentProps<typeof TaskListTasks>['onDelete']>();

// Simulates refreshed server props after a successful action; persistence is tested in PostgreSQL.
function Demo(args: ComponentProps<typeof TaskListTasks>) {
  const [tasks, setTasks] = useState(args.tasks);

  return (
    <TaskListTasks
      {...args}
      tasks={tasks}
      onDelete={async (input) => {
        const result = await args.onDelete(input);
        if (result.error === null)
          setTasks((previous) =>
            previous.filter((item) => item.id !== input.id),
          );

        return result;
      }}
      onUpdate={async (input) => {
        const result = await args.onUpdate(input);
        if (result.error === null)
          setTasks((previous) =>
            previous.map((item) =>
              item.id === result.task.id ? result.task : item,
            ),
          );

        return result;
      }}
    />
  );
}
const meta = {
  title: 'Widgets/Tasks/TaskListTasks',
  component: TaskListTasks,
  args: {
    tasks: [task, other],
    now: '2030-01-01T12:00:00.000Z',
    onUpdate: submit,
    onDelete: remove,
  },
  render: (args) => <Demo {...args} />,
  parameters: { layout: 'padded' },
  beforeEach() {
    remove.mockReset().mockResolvedValue({ listId: task.listId, error: null });
    submit
      .mockReset()
      .mockImplementation(async (input) => ({ task: input, error: null }));
  },
} satisfies Meta<typeof TaskListTasks>;
export default meta;
type Story = StoryObj<typeof meta>;

async function openDialog(context: StoryContext, title = task.title) {
  await context.userEvent.click(
    context.canvas.getByRole('button', { name: title }),
  );

  const dialog = await within(
    context.canvasElement.ownerDocument.body,
  ).findByRole('dialog', {
    name: 'Редактирование задачи',
  });
  await waitFor(() => expect(dialog).toBeVisible());

  return dialog;
}
async function select(
  context: StoryContext,
  dialog: HTMLElement,
  label: string,
  option: string,
) {
  await context.userEvent.click(
    within(dialog).getByRole('combobox', { name: label }),
  );
  const body = within(context.canvasElement.ownerDocument.body);
  await context.userEvent.click(
    await body.findByRole('option', { name: option }),
  );
}
async function save(context: StoryContext, dialog: HTMLElement) {
  await context.userEvent.click(
    within(dialog).getByRole('button', { name: 'Сохранить' }),
  );
}

export const ChangeStatus: Story = {
  play: async (context) => {
    const dialog = await openDialog(context);
    await expect(
      within(dialog).getByRole('textbox', { name: 'Название задачи' }),
    ).toHaveValue(task.title);
    await expect(
      within(dialog).getByRole('textbox', { name: 'Описание' }),
    ).toHaveValue(task.description);
    await select(context, dialog, 'Статус', 'Выполнена');
    await save(context, dialog);
    await waitFor(() =>
      expect(context.args.onUpdate).toHaveBeenCalledWith({
        ...task,
        status: 'done',
      }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(
      context.canvas.getByText('Выполнена', { exact: true }),
    ).toBeVisible();
    await expect(
      context.canvas.queryByText('Просрочена', { exact: true }),
    ).not.toBeInTheDocument();
    const rows = context.canvas.getAllByRole('row').slice(1);
    await expect(rows[0]).toHaveTextContent(other.title);
    await expect(rows[1]).toHaveTextContent(task.title);
    const reopened = await openDialog(context);
    await expect(
      within(reopened).getByText('Выполнена', { exact: true }),
    ).toBeVisible();
  },
};
export const EditFields: Story = {
  play: async (context) => {
    const dialog = await openDialog(context);
    const form = within(dialog);
    await context.userEvent.clear(
      form.getByRole('textbox', { name: 'Название задачи' }),
    );
    await context.userEvent.type(
      form.getByRole('textbox', { name: 'Название задачи' }),
      'Обновлённая задача',
    );
    await context.userEvent.clear(
      form.getByRole('textbox', { name: 'Описание' }),
    );
    await context.userEvent.type(
      form.getByRole('textbox', { name: 'Описание' }),
      'Новое описание',
    );
    await select(context, dialog, 'Приоритет', 'Высокий');
    await context.userEvent.clear(form.getByLabelText('Дедлайн'));
    await context.userEvent.type(
      form.getByLabelText('Дедлайн'),
      '16.01.2030 16:45',
    );
    await context.userEvent.keyboard('{Enter}');
    await expect(context.args.onUpdate).not.toHaveBeenCalled();
    await save(context, dialog);
    await waitFor(() =>
      expect(context.args.onUpdate).toHaveBeenCalledWith({
        ...task,
        title: 'Обновлённая задача',
        description: 'Новое описание',
        priority: 'high',
        deadline: new Date('2030-01-16T16:45').toISOString(),
      }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(
      context.canvas.getByRole('button', {
        name: 'Обновлённая задача',
      }),
    ).toBeVisible();
    await expect(
      context.canvas.getByText('Новое описание', { exact: true }),
    ).toBeVisible();
    await expect(
      context.canvas.getByText('Высокий', { exact: true }),
    ).toBeVisible();
  },
};
export const Validation: Story = {
  play: async (context) => {
    const dialog = await openDialog(context);
    const form = within(dialog);
    await context.userEvent.clear(
      form.getByRole('textbox', { name: 'Название задачи' }),
    );
    await context.userEvent.click(form.getByLabelText('Дедлайн'));
    await context.userEvent.click(
      form.getByRole('button', { name: 'Очистить' }),
    );
    await save(context, dialog);
    await waitFor(() => {
      expect(form.getByText('Введите название задачи.')).toBeVisible();
      expect(form.getByText('Укажите дедлайн.')).toBeVisible();
    });
    await expect(context.args.onUpdate).not.toHaveBeenCalled();
  },
};
export const CancelAndReopen: Story = {
  play: async (context) => {
    const dialog = await openDialog(context);
    await context.userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Название задачи' }),
      ' Черновик',
    );
    await context.userEvent.click(
      within(dialog).getByRole('button', { name: 'Отмена' }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const reopened = await openDialog(context);
    await expect(
      within(reopened).getByRole('textbox', { name: 'Название задачи' }),
    ).toHaveValue(task.title);
    await context.userEvent.keyboard('{Escape}');
    await waitFor(() => expect(reopened).not.toBeInTheDocument());
    const second = await openDialog(context, other.title);
    await expect(
      within(second).getByRole('textbox', { name: 'Название задачи' }),
    ).toHaveValue(other.title);
    await expect(context.args.onUpdate).not.toHaveBeenCalled();
  },
};
export const MissingTask: Story = {
  play: async (context) => {
    context.args.onUpdate.mockResolvedValueOnce({
      task: null,
      error: 'Задача не найдена. Возможно, она уже удалена.',
    });
    const dialog = await openDialog(context);
    await save(context, dialog);
    await expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Задача не найдена. Возможно, она уже удалена.',
    );
    await expect(dialog).toBeVisible();
  },
};
export const RetryAfterFailure: Story = {
  play: async (context) => {
    context.args.onUpdate.mockRejectedValueOnce(
      new Error('Network unavailable'),
    );
    const dialog = await openDialog(context);
    await context.userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Описание' }),
      ' Дополнение',
    );
    await save(context, dialog);
    await expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Не удалось сохранить задачу. Попробуйте ещё раз.',
    );
    await expect(
      within(dialog).getByRole('textbox', { name: 'Описание' }),
    ).toHaveValue(task.description + ' Дополнение');
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Сохранить' }),
      ).toBeEnabled(),
    );
    await save(context, dialog);
    await waitFor(() => expect(context.args.onUpdate).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};
export const Submitting: Story = {
  play: async (context) => {
    const request = Promise.withResolvers<TaskMutationResult>();
    context.args.onUpdate.mockReturnValueOnce(request.promise);
    const dialog = await openDialog(context);
    await save(context, dialog);
    try {
      await waitFor(() => expect(context.args.onUpdate).toHaveBeenCalledOnce());
      const form = within(dialog);
      await expect(
        form.getByRole('textbox', { name: 'Название задачи' }),
      ).toBeDisabled();
      await expect(form.getByLabelText('Дедлайн')).toBeDisabled();
      await expect(
        form.getByRole('button', { name: 'Сохранить' }),
      ).toBeDisabled();
      await expect(form.getByRole('button', { name: 'Отмена' })).toBeDisabled();
      await context.userEvent.keyboard('{Escape}');
      await expect(dialog).toBeInTheDocument();
    } finally {
      request.resolve({ task, error: null });
    }
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const DeleteSelectedTask: Story = {
  play: async (context) => {
    await expect(
      context.canvas.getByRole('columnheader', { name: 'Действия' }),
    ).toBeVisible();
    await context.userEvent.click(
      context.canvas.getByRole('button', {
        name: `Удалить задачу «${task.title}»`,
      }),
    );
    const dialog = await within(
      context.canvasElement.ownerDocument.body,
    ).findByRole('dialog', { name: 'Удалить задачу?' });
    await context.userEvent.click(
      within(dialog).getByRole('button', { name: 'Удалить задачу' }),
    );
    await waitFor(() =>
      expect(
        context.canvas.queryByRole('button', { name: task.title }),
      ).not.toBeInTheDocument(),
    );
    await expect(context.args.onDelete).toHaveBeenCalledOnce();
    await expect(context.args.onDelete).toHaveBeenCalledWith({
      id: task.id,
      listId: task.listId,
    });
    await expect(
      context.canvas.getByRole('button', { name: other.title }),
    ).toBeVisible();
    await expect(context.args.onUpdate).not.toHaveBeenCalled();
  },
};
export const DeleteLastTask: Story = {
  args: { tasks: [task] },
  play: async (context) => {
    await context.userEvent.click(
      context.canvas.getByRole('button', {
        name: `Удалить задачу «${task.title}»`,
      }),
    );
    const dialog = await within(
      context.canvasElement.ownerDocument.body,
    ).findByRole('dialog', { name: 'Удалить задачу?' });
    await context.userEvent.click(
      within(dialog).getByRole('button', { name: 'Удалить задачу' }),
    );
    await expect(
      await context.canvas.findByText('В этом списке пока нет задач.'),
    ).toBeVisible();
    await expect(context.args.onDelete).toHaveBeenCalledOnce();
  },
};
