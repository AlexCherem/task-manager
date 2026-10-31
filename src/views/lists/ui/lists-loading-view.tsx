import { Card, Skeleton } from 'antd';

export function ListsLoadingView() {
  return (
    <Card>
      <Skeleton active paragraph={{ rows: 2 }} />
    </Card>
  );
}
