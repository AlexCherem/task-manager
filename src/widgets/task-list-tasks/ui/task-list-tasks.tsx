'use client';

import { useState } from 'react';

import { filterTasks, defaultTaskFilters } from '@/entities/task';
import type {
  Task,
  TaskMutationResult,
  UpdateTaskInput,
  DeleteTaskInput,
  DeleteTaskResult,
  TaskFilters,
} from '@/entities/task';
import { TaskTable } from '@/entities/task/ui';
import { DeleteTaskButton } from '@/features/delete-task';
import { EditTaskModal } from '@/features/edit-task';
import { TaskFiltersBar } from '@/features/filter-tasks';

import styles from './task-list-tasks.module.css';

export function TaskListTasks({
  tasks,
  now,
  onUpdate,
  onDelete,
}: {
  tasks: Task[];
  now: string;
  onUpdate: (input: UpdateTaskInput) => Promise<TaskMutationResult>;
  onDelete: (input: DeleteTaskInput) => Promise<DeleteTaskResult>;
}) {
  const [filters, setFilters] = useState<TaskFilters>(defaultTaskFilters);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  const filteredTasks = filterTasks(tasks, filters, new Date(now));

  return (
    <>
      <TaskFiltersBar
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultTaskFilters)}
      />
      <p className={styles.count} role="status">
        Показано задач: {filteredTasks.length} из {tasks.length}
      </p>
      <TaskTable
        key={`${filters.status}-${filters.priority}-${filters.overdueOnly}`}
        tasks={filteredTasks}
        emptyText={
          tasks.length > 0
            ? 'По выбранным фильтрам задачи не найдены.'
            : undefined
        }
        now={now}
        onTaskSelect={(task) => setSelectedTaskId(task.id)}
        renderActions={(task) => (
          <DeleteTaskButton task={task} onDelete={onDelete} />
        )}
      />
      {selectedTask && (
        <EditTaskModal
          key={selectedTask.id}
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onSubmit={onUpdate}
        />
      )}
    </>
  );
}
