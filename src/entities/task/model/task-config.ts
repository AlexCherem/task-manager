import type { TaskPriority, TaskStatus } from './task';

export const taskTitleMaxLength = 200;

export const taskStatusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В процессе',
  done: 'Выполнена',
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};
