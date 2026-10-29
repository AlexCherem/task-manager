'use client';

import { App as AntdApp, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { ReactNode } from 'react';

import { antdTheme } from '@/shared/config/antd';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={ruRU} theme={antdTheme}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
