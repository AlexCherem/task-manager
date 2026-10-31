'use client';

import { Button, Result } from 'antd';

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
