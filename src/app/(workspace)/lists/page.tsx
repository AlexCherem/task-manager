import type { Metadata } from 'next';

import { ListsView } from '@/views/lists';

export const metadata: Metadata = { title: 'Списки — Task Manager' };

export default function ListsPage() {
  return <ListsView />;
}
