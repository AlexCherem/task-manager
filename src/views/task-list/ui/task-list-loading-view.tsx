import { Card, Skeleton } from 'antd';

export function TaskListLoadingView() {
  return (
    <Card>
      <Skeleton active paragraph={{ rows: 4 }} />
    </Card>
  );
}
