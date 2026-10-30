import type { Metadata } from 'next';

import { requireSession } from '@/server/auth/session';
import { ListsView } from '@/views/lists';

export const metadata: Metadata = { title: 'Списки — Task Manager' };

export default async function ListsPage() {
  const session = await requireSession();

  return <ListsView email={session.email} />;
}
