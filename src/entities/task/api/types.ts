import type { Task, TaskPriority, TaskStatus } from '../model/task';

export type CreateTaskInput = {
  listId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Canonical ISO 8601 timestamp in UTC. */
  deadline: string;
};

export type UpdateTaskInput = CreateTaskInput & { id: string };

export type TaskMutationResult =
  { task: Task; error: null } | { task: null; error: string };

export type DeleteTaskInput = Pick<Task, 'id' | 'listId'>;

export type DeleteTaskResult =
  { listId: string; error: null } | { listId: null; error: string };
