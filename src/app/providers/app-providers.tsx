'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

import { AntdProvider } from './antd-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <ThemeProvider
        attribute="data-theme"
        storageKey="task-manager-theme"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AntdProvider>{children}</AntdProvider>
      </ThemeProvider>
    </AntdRegistry>
  );
}
