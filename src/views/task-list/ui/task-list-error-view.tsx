'use client';
import { Result } from 'antd';
import { Button } from '@/shared/ui/button';

export function TaskListErrorView({ reset }: { reset: () => void }) {
  return (
    <Result
      status="error"
      title="Не удалось загрузить задачи"
      subTitle="Попробуйте ещё раз."
      extra={<Button onClick={reset}>Повторить</Button>}
    />
  );
}
