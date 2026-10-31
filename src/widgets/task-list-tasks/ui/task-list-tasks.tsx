'use client';

import { useState } from 'react';

import type {
  Task,
  TaskMutationResult,
  UpdateTaskInput,
} from '@/entities/task';
import { TaskTable } from '@/entities/task/ui';
import { EditTaskModal } from '@/features/edit-task';

export function TaskListTasks({
  tasks,
  now,
  onUpdate,
}: {
  tasks: Task[];
  now: string;
  onUpdate: (input: UpdateTaskInput) => Promise<TaskMutationResult>;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  return (
    <>
      <TaskTable
        tasks={tasks}
        now={now}
        onTaskSelect={(task) => setSelectedTaskId(task.id)}
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
