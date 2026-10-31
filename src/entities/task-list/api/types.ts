import type { TaskList } from '../model/task-list';

export type TaskListMutationResult =
  { list: TaskList; error: null } | { list: null; error: string };
