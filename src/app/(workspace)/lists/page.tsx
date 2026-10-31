import type { Metadata } from 'next';

import { getTaskLists } from '@/server/lists';
import { ListsView } from '@/views/lists';

export const metadata: Metadata = { title: 'Списки — Task Manager' };

export default async function ListsPage() {
  const lists = await getTaskLists();

  return <ListsView lists={lists} />;
}
