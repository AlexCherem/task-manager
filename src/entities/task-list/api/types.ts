import type { TaskList } from '../model/task-list';

export type CreateTaskListResult =
  { list: TaskList; error: null } | { list: null; error: string };
