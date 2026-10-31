import { Card, Empty } from 'antd';

import type { TaskList } from '@/entities/task-list';
import { CreateListButton } from '@/features/create-list';
import { createList } from '@/features/create-list/api';

import styles from './lists-view.module.css';

export function ListsView({ lists }: { lists: TaskList[] }) {
  return (
    <section aria-labelledby="lists-title">
      <div className={styles.heading}>
        <div>
          <h1 id="lists-title" className={styles.title}>
            Списки задач
          </h1>
          <p className="page-description">Всего списков: {lists.length}</p>
        </div>
        <CreateListButton onSubmit={createList} />
      </div>
      {lists.length === 0 ? (
        <Card>
          <Empty description="Списков пока нет" />
        </Card>
      ) : (
        <div className={styles.grid}>
          {lists.map((list) => (
            <Card key={list.id}>
              <h2 className={styles.listTitle}>{list.title}</h2>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
