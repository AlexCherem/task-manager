'use client';
import { Button, Result } from 'antd';

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
