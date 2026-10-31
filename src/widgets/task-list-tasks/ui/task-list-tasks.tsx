'use client';

import { useState } from 'react';

import type {
  Task,
  TaskMutationResult,
  UpdateTaskInput,
  DeleteTaskInput,
  DeleteTaskResult,
} from '@/entities/task';
import { TaskTable } from '@/entities/task/ui';
import { DeleteTaskButton } from '@/features/delete-task';
import { EditTaskModal } from '@/features/edit-task';

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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  return (
    <>
      <TaskTable
        tasks={tasks}
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
