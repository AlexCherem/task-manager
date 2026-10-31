import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

import type { Task } from '../model/task';
import { TaskTable } from './task-table';

const now = '2030-01-01T12:00:00.000Z';
const base = {
  listId: 'list-id',
  description: '',
  status: 'new',
  priority: 'medium',
} as const;
const tasks: Task[] = [
  {
    ...base,
    id: 'done',
    title: 'Выполненная задача',
    status: 'done',
    deadline: '2020-01-01T12:00:00.000Z',
  },
  {
    ...base,
    id: 'later',
    title: 'Поздняя задача',
    deadline: '2030-01-03T12:00:00.000Z',
  },
  {
    ...base,
    id: 'overdue',
    title: 'Просроченная задача',
    priority: 'low',
    deadline: '2030-01-01T11:00:00.000Z',
  },
  {
    ...base,
    id: 'near',
    title: 'Ближайшая задача',
    status: 'in_progress',
    priority: 'high',
    deadline: '2030-01-02T12:00:00.000Z',
  },
];
const meta = {
  title: 'Entities/Task/TaskTable',
  component: TaskTable,
  args: { tasks, now },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TaskTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SortedTasks: Story = {
  play: async ({ canvas }) => {
    const rows = canvas.getAllByRole('row').slice(1);
    await expect(rows).toHaveLength(4);
    for (const [index, title] of [
      'Просроченная задача',
      'Ближайшая задача',
      'Поздняя задача',
      'Выполненная задача',
    ].entries()) {
      await expect(rows[index]).toHaveTextContent(title);
    }
    await expect(
      canvas.getAllByText('Просрочена', { exact: true }),
    ).toHaveLength(1);
    await expect(canvas.getByText('Выполнена', { exact: true })).toBeVisible();
  },
};
export const Empty: Story = {
  args: { tasks: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('В этом списке пока нет задач.'),
    ).toBeVisible();
  },
};
