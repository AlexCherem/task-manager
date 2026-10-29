import { AntdRegistry } from '@ant-design/nextjs-registry';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from './providers';

import 'antd/dist/reset.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'Приложение для управления списками и задачами',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
