import type { Meta, StoryContext, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';

import type { Task } from '@/entities/task';
import { TaskListTasks } from './task-list-tasks';

const base: Task = {
  id: 'new-overdue',
  listId: 'list-id',
  title: 'Проверить требования',
  description: '',
  status: 'new',
  priority: 'medium',
  deadline: '2029-12-31T12:00:00.000Z',
};
const tasks: Task[] = [
  base,
  {
    ...base,
    id: 'active',
    title: 'Подготовить демо',
    status: 'in_progress',
    priority: 'high',
    deadline: '2030-01-01T13:00:00.000Z',
  },
  {
    ...base,
    id: 'done',
    title: 'Настроить проект',
    status: 'done',
    priority: 'high',
    deadline: '2020-01-01T12:00:00.000Z',
  },
  {
    ...base,
    id: 'new-future',
    title: 'Написать инструкцию',
    priority: 'low',
    deadline: '2030-01-04T12:00:00.000Z',
  },
  {
    ...base,
    id: 'working-overdue',
    title: 'Исправить ошибку',
    status: 'in_progress',
    priority: 'high',
    deadline: '2029-12-30T12:00:00.000Z',
  },
];

// The mock supplies refreshed server props after editing; the application reads tasks from PostgreSQL.
function Demo(args: ComponentProps<typeof TaskListTasks>) {
  const [tasks, setTasks] = useState(args.tasks);

  return (
    <TaskListTasks
      {...args}
      tasks={tasks}
      onUpdate={async (input) => {
        const result = await args.onUpdate(input);
        if (result.error === null)
          setTasks((previous) =>
            previous.map((task) =>
              task.id === result.task.id ? result.task : task,
            ),
          );

        return result;
      }}
    />
  );
}
const submit = fn<ComponentProps<typeof TaskListTasks>['onUpdate']>();
const remove = fn<ComponentProps<typeof TaskListTasks>['onDelete']>();

const meta = {
  title: 'Widgets/Tasks/TaskListFilters',
  component: TaskListTasks,
  args: {
    tasks,
    now: '2030-01-01T12:00:00.000Z',
    onUpdate: submit,
    onDelete: remove,
  },
  beforeEach() {
    submit
      .mockReset()
      .mockImplementation(async (input) => ({ task: input, error: null }));
    remove.mockReset().mockResolvedValue({ listId: base.listId, error: null });
  },
  render: (args) => <Demo {...args} />,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TaskListTasks>;
export default meta;
type Story = StoryObj<typeof meta>;

async function choose(context: StoryContext, label: string, option: string) {
  const filters = within(
    context.canvas.getByRole('region', { name: 'Фильтры задач' }),
  );
  await context.userEvent.click(filters.getByRole('combobox', { name: label }));
  await context.userEvent.click(
    await within(context.canvasElement.ownerDocument.body).findByRole(
      'option',
      { name: option },
    ),
  );
}
function titles(context: StoryContext) {
  return context.canvas
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('button')[0].textContent);
}

export const ByStatus: Story = {
  play: async (context) => {
    for (const [label, expected] of [
      ['Новая', ['Проверить требования', 'Написать инструкцию']],
      ['В процессе', ['Исправить ошибку', 'Подготовить демо']],
      ['Выполнена', ['Настроить проект']],
    ] as const) {
      await choose(context, 'Статус', label);
      await waitFor(() => expect(titles(context)).toEqual(expected));
      await expect(context.canvas.getByRole('status')).toHaveTextContent(
        `Показано задач: ${expected.length} из 5`,
      );
    }
    await expect(context.args.onUpdate).not.toHaveBeenCalled();
    await expect(context.args.onDelete).not.toHaveBeenCalled();
  },
};
export const CombinedAndReset: Story = {
  play: async (context) => {
    const reset = context.canvas.getByRole('button', { name: 'Сбросить' });
    await expect(reset).toBeDisabled();
    await choose(context, 'Статус', 'В процессе');
    await choose(context, 'Приоритет', 'Высокий');
    await context.userEvent.click(
      context.canvas.getByRole('checkbox', { name: 'Только просроченные' }),
    );
    await expect(titles(context)).toEqual(['Исправить ошибку']);
    await expect(reset).toBeEnabled();
    await choose(context, 'Приоритет', 'Средний');
    await expect(
      await context.canvas.findByText(
        'По выбранным фильтрам задачи не найдены.',
      ),
    ).toBeVisible();
    await expect(context.canvas.getByRole('status')).toHaveTextContent(
      'Показано задач: 0 из 5',
    );
    await context.userEvent.click(reset);
    await expect(titles(context)).toEqual([
      'Исправить ошибку',
      'Проверить требования',
      'Подготовить демо',
      'Написать инструкцию',
      'Настроить проект',
    ]);
    await expect(reset).toBeDisabled();
    await expect(
      context.canvas.getByRole('checkbox', { name: 'Только просроченные' }),
    ).not.toBeChecked();
  },
};
export const OverdueOnly: Story = {
  play: async (context) => {
    await context.userEvent.click(
      context.canvas.getByRole('checkbox', { name: 'Только просроченные' }),
    );
    await expect(titles(context)).toEqual([
      'Исправить ошибку',
      'Проверить требования',
    ]);
    await expect(context.canvas.getByRole('status')).toHaveTextContent(
      'Показано задач: 2 из 5',
    );
    await expect(
      context.canvas.queryByRole('button', { name: 'Настроить проект' }),
    ).not.toBeInTheDocument();
    await context.userEvent.click(
      context.canvas.getByRole('checkbox', { name: 'Только просроченные' }),
    );
    await expect(context.canvas.getByRole('status')).toHaveTextContent(
      'Показано задач: 5 из 5',
    );
  },
};
export const EmptyList: Story = {
  args: { tasks: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('В этом списке пока нет задач.'),
    ).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Показано задач: 0 из 0',
    );
    await expect(
      canvas.getByRole('button', { name: 'Сбросить' }),
    ).toBeDisabled();
  },
};
export const EditLeavesFilter: Story = {
  play: async (context) => {
    await choose(context, 'Статус', 'Новая');
    await context.userEvent.click(
      context.canvas.getByRole('button', { name: base.title }),
    );
    const body = within(context.canvasElement.ownerDocument.body);
    const dialog = await body.findByRole('dialog', {
      name: 'Редактирование задачи',
    });
    await waitFor(() => expect(dialog).toBeVisible());
    await context.userEvent.click(
      within(dialog).getByRole('combobox', { name: 'Статус' }),
    );
    await context.userEvent.click(
      await body.findByRole('option', { name: 'Выполнена' }),
    );
    await context.userEvent.click(
      within(dialog).getByRole('button', { name: 'Сохранить' }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(titles(context)).toEqual(['Написать инструкцию']);
    await expect(context.canvas.getByRole('status')).toHaveTextContent(
      'Показано задач: 1 из 5',
    );
    await context.userEvent.click(
      context.canvas.getByRole('button', { name: 'Сбросить' }),
    );
    await expect(
      context.canvas.getByRole('button', { name: base.title }),
    ).toBeVisible();
  },
};
export const FilterResetsPagination: Story = {
  args: {
    tasks: Array.from({ length: 13 }, (_, index) => ({
      ...base,
      id: `page-${index}`,
      title: `Задача ${index + 1}`,
      status: index === 12 ? 'done' : 'new',
    })),
  },
  play: async (context) => {
    await context.userEvent.click(context.canvas.getByTitle('2'));
    await expect(
      context.canvas.getByRole('button', { name: 'Задача 13' }),
    ).toBeVisible();
    await choose(context, 'Статус', 'Новая');
    await expect(
      context.canvas.getByRole('button', { name: 'Задача 1' }),
    ).toBeVisible();
    await expect(context.canvas.getByRole('status')).toHaveTextContent(
      'Показано задач: 12 из 13',
    );
    await expect(
      context.canvas.queryByRole('button', { name: 'Задача 13' }),
    ).not.toBeInTheDocument();
  },
};
