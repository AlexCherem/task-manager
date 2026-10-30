import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getSession } from '@/server/auth/session';
import { LoginView } from '@/views/login';

export const metadata: Metadata = { title: 'Вход — Task Manager' };

export default async function LoginPage() {
  if (await getSession()) redirect('/lists');

  return <LoginView />;
}
