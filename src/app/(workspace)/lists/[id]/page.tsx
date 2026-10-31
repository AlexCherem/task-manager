import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getTaskList } from '@/server/lists';
import { getTasksByList } from '@/server/tasks';
import { TaskListView } from '@/views/task-list';

export const metadata: Metadata = { title: 'Задачи — Task Manager' };

export default async function TaskListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = await getTaskList(id);
  if (!list) notFound();
  const tasks = await getTasksByList(list.id);

  return (
    <TaskListView list={list} tasks={tasks} now={new Date().toISOString()} />
  );
}
