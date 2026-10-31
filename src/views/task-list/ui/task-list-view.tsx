import Link from 'next/link';

import type { Task } from '@/entities/task';
import type { TaskList } from '@/entities/task-list';
import { CreateTaskButton } from '@/features/create-task';
import { createTask } from '@/features/create-task/api';
import { deleteTask } from '@/features/delete-task/api';
import { updateTask } from '@/features/edit-task/api';
import { TaskListTasks } from '@/widgets/task-list-tasks';

import styles from './task-list-view.module.css';

export function TaskListView({
  list,
  tasks,
  now,
}: {
  list: TaskList;
  tasks: Task[];
  now: string;
}) {
  return (
    <section aria-labelledby="task-list-title">
      <Link href="/lists" className={styles.backLink}>
        Все списки
      </Link>
      <div className={styles.heading}>
        <div>
          <h1 id="task-list-title" className={styles.title}>
            {list.title}
          </h1>
          <p className="page-description">Всего задач: {tasks.length}</p>
        </div>
        <CreateTaskButton listId={list.id} onSubmit={createTask} />
      </div>
      <TaskListTasks
        tasks={tasks}
        now={now}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />
    </section>
  );
}
