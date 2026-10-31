export type TaskStatus = 'new' | 'in_progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  listId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Valid ISO 8601 timestamp with an explicit time zone. */
  deadline: string;
};

export type TaskDeadlineIndicator = 'none' | 'due_soon' | 'overdue';

export type TaskStats = {
  total: number;
  new: number;
  inProgress: number;
  done: number;
  overdue: number;
  progressPercent: number;
  deadlineIndicator: TaskDeadlineIndicator;
};

const priorityOrder: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const upcomingDeadlineWindow = 48 * 60 * 60 * 1000;

function isOverdue(
  task: Pick<Task, 'status' | 'deadline'>,
  now: number,
): boolean {
  return task.status !== 'done' && Date.parse(task.deadline) < now;
}

export function sortTasks(tasks: readonly Task[], now: Date): Task[] {
  const nowTimestamp = now.getTime();

  return [...tasks].sort((left, right) => {
    const doneOrder =
      Number(left.status === 'done') - Number(right.status === 'done');
    if (doneOrder !== 0) return doneOrder;

    const overdueOrder =
      Number(isOverdue(right, nowTimestamp)) -
      Number(isOverdue(left, nowTimestamp));
    if (overdueOrder !== 0) return overdueOrder;

    const deadlineOrder =
      Date.parse(left.deadline) - Date.parse(right.deadline);
    if (deadlineOrder !== 0) return deadlineOrder;

    return priorityOrder[left.priority] - priorityOrder[right.priority];
  });
}

export function getTaskStats(
  tasks: readonly Pick<Task, 'status' | 'deadline'>[],
  now: Date,
): TaskStats {
  const nowTimestamp = now.getTime();
  let hasUpcomingDeadline = false;
  const stats: TaskStats = {
    total: tasks.length,
    new: 0,
    inProgress: 0,
    done: 0,
    overdue: 0,
    progressPercent: 0,
    deadlineIndicator: 'none',
  };

  for (const task of tasks) {
    if (task.status === 'done') {
      stats.done += 1;
      continue;
    }

    if (task.status === 'new') stats.new += 1;
    else stats.inProgress += 1;

    if (isOverdue(task, nowTimestamp)) {
      stats.overdue += 1;
    } else if (
      Date.parse(task.deadline) - nowTimestamp <=
      upcomingDeadlineWindow
    ) {
      hasUpcomingDeadline = true;
    }
  }

  stats.progressPercent =
    stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);
  stats.deadlineIndicator =
    stats.overdue > 0 ? 'overdue' : hasUpcomingDeadline ? 'due_soon' : 'none';

  return stats;
}
