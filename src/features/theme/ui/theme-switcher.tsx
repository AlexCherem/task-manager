'use client';

import { Segmented } from 'antd';
import { useTheme } from 'next-themes';

import { useHydrated } from '@/shared/lib/use-hydrated';

const options = [
  { label: 'Светлая', value: 'light' },
  { label: 'Тёмная', value: 'dark' },
  { label: 'Системная', value: 'system' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  return (
    <Segmented<string>
      aria-label="Тема оформления"
      options={options}
      value={hydrated ? theme : 'system'}
      onChange={setTheme}
      disabled={!hydrated}
    />
  );
}
