import { Result } from 'antd';
import Link from 'next/link';

import styles from './task-list-view.module.css';

export function TaskListNotFoundView() {
  return (
    <Result
      status="404"
      title="Список не найден"
      subTitle="Возможно, он был удалён."
      extra={
        <Link href="/lists" className={styles.backLink}>
          Вернуться к спискам
        </Link>
      }
    />
  );
}
