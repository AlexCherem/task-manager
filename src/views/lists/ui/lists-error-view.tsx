'use client';

import { Result } from 'antd';
import { Button } from '@/shared/ui/button';

export function ListsErrorView({ reset }: { reset: () => void }) {
  return (
    <Result
      status="error"
      title="Не удалось загрузить списки"
      subTitle="Попробуйте ещё раз."
      extra={<Button onClick={reset}>Повторить</Button>}
    />
  );
}
