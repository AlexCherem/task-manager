import type { ReactNode } from 'react';

import { requireSession } from '@/server/auth/session';
import { AppHeader } from '@/widgets/app-header';

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();

  return (
    <>
      <AppHeader email={session.email} />
      <main className="workspace-content">{children}</main>
    </>
  );
}
