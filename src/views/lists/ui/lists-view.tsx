import { Card, Empty } from 'antd';

import type { TaskList } from '@/entities/task-list';
import { CreateListButton } from '@/features/create-list';
import { createList } from '@/features/create-list/api';
import { DeleteListButton } from '@/features/delete-list';
import { deleteList } from '@/features/delete-list/api';
import { RenameListButton } from '@/features/rename-list';
import { renameList } from '@/features/rename-list/api';
import { SearchListsForm } from '@/features/search-lists';

import styles from './lists-view.module.css';

export function ListsView({
  lists,
  query = '',
}: {
  lists: TaskList[];
  query?: string;
}) {
  return (
    <section aria-labelledby="lists-title">
      <div className={styles.heading}>
        <div>
          <h1 id="lists-title" className={styles.title}>
            Списки задач
          </h1>
          <p className="page-description">
            {query ? 'Найдено списков' : 'Всего списков'}: {lists.length}
          </p>
        </div>
        <CreateListButton onSubmit={createList} />
      </div>
      <SearchListsForm key={query} query={query} />
      {lists.length === 0 ? (
        <Card>
          <Empty
            description={
              query
                ? 'По вашему запросу списки не найдены. Измените запрос или сбросьте поиск.'
                : 'Списков пока нет'
            }
          />
        </Card>
      ) : (
        <div className={styles.grid}>
          {lists.map((list) => (
            <Card key={list.id}>
              <h2 className={styles.listTitle}>{list.title}</h2>
              <div className={styles.listActions}>
                <RenameListButton list={list} onSubmit={renameList} />
                <DeleteListButton list={list} onDelete={deleteList} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
