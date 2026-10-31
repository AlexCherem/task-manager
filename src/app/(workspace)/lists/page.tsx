import type { Metadata } from 'next';

import { getTaskLists } from '@/server/lists';
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

  return <ListsView lists={lists} query={query} />;
}
