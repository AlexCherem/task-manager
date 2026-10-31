import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card } from 'antd';
import { expect, within } from 'storybook/test';

import { getTaskStats, type Task } from '../model/task';
import { TaskStatsSummary } from './task-stats-summary';

const now = new Date('2030-01-01T12:00:00.000Z');
const overdue: Pick<Task, 'status' | 'deadline'> = {
  status: 'new',
  deadline: '2029-12-31T12:00:00.000Z',
};
const soon: Pick<Task, 'status' | 'deadline'> = {
  status: 'in_progress',
  deadline: '2030-01-03T12:00:00.000Z',
};
const done = { ...overdue, status: 'done' } as const;

const meta = {
  title: 'Entities/Task/TaskStatsSummary',
  component: TaskStatsSummary,
  decorators: [
    (Story) => (
      <Card style={{ width: 'min(100%, 340px)' }}>
        <h2>Тестовое задание</h2>
        <Story />
      </Card>
    ),
  ],
  args: {
    stats: getTaskStats([overdue, soon, done, { ...soon, status: 'new' }], now),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TaskStatsSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Overdue: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Всего задач: 4')).toBeVisible();
    for (const [label, count] of [
      ['Новые', '2'],
      ['В процессе', '1'],
      ['Выполнены', '1'],
      ['Просрочены', '1'],
    ]) {
      const counter = canvas.getByText(label).parentElement!;
      await expect(
        within(counter).getByText(count, { exact: true }),
      ).toBeVisible();
    }
    await expect(canvas.getByText('Выполнено: 25%')).toBeVisible();
    await expect(
      canvas.getByRole('progressbar', { name: 'Прогресс выполнения задач' }),
    ).toHaveAttribute('aria-valuenow', '25');
    await expect(canvas.getByText('Есть просроченные задачи')).toBeVisible();
    await expect(
      canvas.queryByText('Дедлайн в ближайшие 48 часов'),
    ).not.toBeInTheDocument();
  },
};
export const DueSoon: Story = {
  args: { stats: getTaskStats([soon, done], now) },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Дедлайн в ближайшие 48 часов'),
    ).toBeVisible();
    await expect(
      canvas.queryByText('Есть просроченные задачи'),
    ).not.toBeInTheDocument();
    await expect(canvas.getByText('Выполнено: 50%')).toBeVisible();
  },
};
export const Empty: Story = {
  args: { stats: getTaskStats([], now) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Всего задач: 0')).toBeVisible();
    await expect(canvas.getByText('Выполнено: 0%')).toBeVisible();
    await expect(canvas.getByText('Нет срочных дедлайнов')).toBeVisible();
  },
};
export const AllDone: Story = {
  args: { stats: getTaskStats([done], now) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Выполнено: 100%')).toBeVisible();
    await expect(canvas.getByText('Нет срочных дедлайнов')).toBeVisible();
    await expect(
      canvas.queryByText('Есть просроченные задачи'),
    ).not.toBeInTheDocument();
  },
};
