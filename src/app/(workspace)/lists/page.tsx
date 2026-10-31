import type { Metadata } from 'next';

import { getTaskLists } from '@/server/lists';
import { getTaskListStats } from '@/server/tasks';
import { ListsView } from '@/views/lists';

export const metadata: Metadata = { title: 'Списки — Task Manager' };

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? '';
  const lists = await getTaskLists(query);

  const statsByList = await getTaskListStats(lists.map((list) => list.id));

  return <ListsView lists={lists} statsByList={statsByList} query={query} />;
}
