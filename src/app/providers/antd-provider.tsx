'use client';

import { App as AntdApp, ConfigProvider, theme as antd } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';

import { antdTheme } from '@/shared/config/antd';
import { useHydrated } from '@/shared/lib/use-hydrated';

dayjs.locale('ru');

export function AntdProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const isDark = hydrated && resolvedTheme === 'dark';

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        ...antdTheme,
        cssVar: { key: isDark ? 'task-manager-dark' : 'task-manager-light' },
        algorithm: isDark ? antd.darkAlgorithm : antd.defaultAlgorithm,
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
