import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from '@/app/providers';

import 'antd/dist/reset.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'Приложение для управления списками и задачами',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
