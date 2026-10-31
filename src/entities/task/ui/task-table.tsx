'use client';

import { Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';

import { useHydrated } from '@/shared/lib/use-hydrated';

import { sortTasks, type Task } from '../model/task';
import { taskStatusLabels, taskPriorityLabels } from '../model/task-config';
import styles from './task-table.module.css';

export function TaskTable({ tasks, now }: { tasks: Task[]; now: string }) {
  const hydrated = useHydrated();
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: hydrated ? undefined : 'UTC',
  });
  const columns: TableColumnsType<Task> = [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (_, task) => (
        <div>
          <span className={styles.title}>{task.title}</span>
          {task.description && (
            <p className={styles.description}>{task.description}</p>
          )}
        </div>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (value: Task['status']) => (
        <Tag
          color={
            value === 'done'
              ? 'green'
              : value === 'in_progress'
                ? 'blue'
                : undefined
          }
        >
          {taskStatusLabels[value]}
        </Tag>
      ),
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (value: Task['priority']) => (
        <Tag
          color={
            value === 'high' ? 'red' : value === 'medium' ? 'gold' : undefined
          }
        >
          {taskPriorityLabels[value]}
        </Tag>
      ),
    },
    {
      title: 'Дедлайн',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 190,
      render: (_, task) => (
        <div>
          <time dateTime={task.deadline}>
            {formatter.format(new Date(task.deadline))}
          </time>
          {task.status !== 'done' &&
            Date.parse(task.deadline) < Date.parse(now) && (
              <div>
                <Tag color="red">Просрочена</Tag>
              </div>
            )}
        </div>
      ),
    },
  ];

  return (
    <Table<Task>
      rowKey="id"
      columns={columns}
      dataSource={sortTasks(tasks, new Date(now))}
      pagination={{
        pageSize: 10,
        hideOnSinglePage: true,
        showSizeChanger: false,
      }}
      scroll={{ x: 740 }}
      locale={{ emptyText: 'В этом списке пока нет задач.' }}
    />
  );
}
