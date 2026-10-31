import { describe, expect, it } from 'vitest';

import {
  getTaskStats,
  sortTasks,
  filterTasks,
  defaultTaskFilters,
  type Task,
} from './task';

const now = new Date('2026-10-29T09:00:00.000Z');
const hour = 60 * 60 * 1000;

function deadlineIn(milliseconds: number): string {
  return new Date(now.getTime() + milliseconds).toISOString();
}

function makeTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    listId: 'list-1',
    title: `Задача ${id}`,
    description: '',
    status: 'new',
    priority: 'medium',
    deadline: deadlineIn(72 * hour),
    ...overrides,
  };
}

describe('sortTasks', () => {
  it('returns an empty array for an empty list', () => {
    expect(sortTasks([], now)).toEqual([]);
  });

  it('puts unfinished overdue tasks before upcoming tasks regardless of priority', () => {
    const tasks = [
      makeTask('upcoming', { priority: 'high', deadline: deadlineIn(hour) }),
      makeTask('overdue', { priority: 'low', deadline: deadlineIn(-1) }),
    ];

    expect(sortTasks(tasks, now).map((task) => task.id)).toEqual([
      'overdue',
      'upcoming',
    ]);
  });

  it('puts an earlier deadline before a higher priority', () => {
    const tasks = [
      makeTask('later', { priority: 'high', deadline: deadlineIn(2 * hour) }),
      makeTask('earlier', { priority: 'low', deadline: deadlineIn(hour) }),
    ];

    expect(sortTasks(tasks, now).map((task) => task.id)).toEqual([
      'earlier',
      'later',
    ]);
  });

  it('orders equal deadlines by high, medium and low priority', () => {
    const tasks = [
      makeTask('low', { priority: 'low' }),
      makeTask('high', { priority: 'high' }),
      makeTask('medium', { priority: 'medium' }),
    ];

    expect(sortTasks(tasks, now).map((task) => task.id)).toEqual([
      'high',
      'medium',
      'low',
    ]);
  });

  it('puts completed tasks last even when their deadline has passed', () => {
    const tasks = [
      makeTask('done', { status: 'done', deadline: deadlineIn(-24 * hour) }),
      makeTask('future', {
        status: 'in_progress',
        deadline: deadlineIn(72 * hour),
      }),
      makeTask('overdue', { deadline: deadlineIn(-hour) }),
    ];

    expect(sortTasks(tasks, now).map((task) => task.id)).toEqual([
      'overdue',
      'future',
      'done',
    ]);
  });

  it('orders completed tasks by deadline and then priority within the final group', () => {
    const tasks = [
      makeTask('later', { status: 'done', deadline: deadlineIn(hour) }),
      makeTask('low', {
        status: 'done',
        priority: 'low',
        deadline: deadlineIn(-hour),
      }),
      makeTask('high', {
        status: 'done',
        priority: 'high',
        deadline: deadlineIn(-hour),
      }),
    ];

    expect(sortTasks(tasks, now).map((task) => task.id)).toEqual([
      'high',
      'low',
      'later',
    ]);
  });

  it('compares timestamps as instants rather than sorting their string representations', () => {
    const tasks = [
      makeTask('low', {
        priority: 'low',
        deadline: '2026-10-29T13:00:00+03:00',
      }),
      makeTask('high', { priority: 'high', deadline: '2026-10-29T10:00:00Z' }),
    ];

    expect(sortTasks(tasks, now).map((task) => task.id)).toEqual([
      'high',
      'low',
    ]);
  });

  it('preserves input order when all sort criteria are equal', () => {
    const tasks = [makeTask('second'), makeTask('first')];

    expect(sortTasks(tasks, now).map((task) => task.id)).toEqual([
      'second',
      'first',
    ]);
  });

  it('returns a new array without changing the original array or its tasks', () => {
    const tasks = Object.freeze([
      Object.freeze(makeTask('later', { deadline: deadlineIn(2 * hour) })),
      Object.freeze(makeTask('earlier', { deadline: deadlineIn(hour) })),
    ]);
    const original = structuredClone(tasks);

    const result = sortTasks(tasks, now);

    expect(result).not.toBe(tasks);
    expect(result.map((task) => task.id)).toEqual(['earlier', 'later']);
    expect(tasks).toEqual(original);
  });
});

describe('getTaskStats', () => {
  it('returns zero counters, zero progress and no indicator for an empty list', () => {
    expect(getTaskStats([], now)).toEqual({
      total: 0,
      new: 0,
      inProgress: 0,
      done: 0,
      overdue: 0,
      progressPercent: 0,
      deadlineIndicator: 'none',
    });
  });

  it('counts every main status and counts overdue tasks as an additional subset', () => {
    const tasks = [
      makeTask('new-overdue', { deadline: deadlineIn(-hour) }),
      makeTask('working-overdue', {
        status: 'in_progress',
        deadline: deadlineIn(-1),
      }),
      makeTask('new-upcoming', { deadline: deadlineIn(hour) }),
      makeTask('done-past', {
        status: 'done',
        deadline: deadlineIn(-24 * hour),
      }),
      makeTask('done-future', { status: 'done' }),
      makeTask('working-future', { status: 'in_progress' }),
    ];

    const stats = getTaskStats(tasks, now);

    expect(stats).toEqual({
      total: 6,
      new: 2,
      inProgress: 2,
      done: 2,
      overdue: 2,
      progressPercent: 33,
      deadlineIndicator: 'overdue',
    });
    expect(stats.new + stats.inProgress + stats.done).toBe(stats.total);
  });

  it('excludes completed overdue tasks from the overdue counter and indicator', () => {
    const tasks = [
      makeTask('done', { status: 'done', deadline: deadlineIn(-hour) }),
      makeTask('future'),
    ];

    expect(getTaskStats(tasks, now)).toMatchObject({
      done: 1,
      overdue: 0,
      progressPercent: 50,
      deadlineIndicator: 'none',
    });
  });

  it.each([
    {
      label: 'one millisecond before now',
      offset: -1,
      overdue: 1,
      indicator: 'overdue',
    },
    { label: 'exactly now', offset: 0, overdue: 0, indicator: 'due_soon' },
    {
      label: 'one millisecond after now',
      offset: 1,
      overdue: 0,
      indicator: 'due_soon',
    },
    {
      label: 'just before 48 hours',
      offset: 48 * hour - 1,
      overdue: 0,
      indicator: 'due_soon',
    },
    {
      label: 'exactly 48 hours',
      offset: 48 * hour,
      overdue: 0,
      indicator: 'due_soon',
    },
    {
      label: 'just after 48 hours',
      offset: 48 * hour + 1,
      overdue: 0,
      indicator: 'none',
    },
  ])('handles a deadline $label', ({ offset, overdue, indicator }) => {
    const task = makeTask('boundary', { deadline: deadlineIn(offset) });

    expect(getTaskStats([task], now)).toMatchObject({
      new: 1,
      overdue,
      deadlineIndicator: indicator,
    });
  });

  it.each(['overdue-first', 'upcoming-first'])(
    'prioritizes overdue indication with %s',
    (order) => {
      const overdue = makeTask('overdue', { deadline: deadlineIn(-hour) });
      const upcoming = makeTask('upcoming', { deadline: deadlineIn(hour) });
      const tasks =
        order === 'overdue-first' ? [overdue, upcoming] : [upcoming, overdue];

      expect(getTaskStats(tasks, now).deadlineIndicator).toBe('overdue');
    },
  );

  it.each([
    { completed: 0, expected: 0 },
    { completed: 1, expected: 33 },
    { completed: 2, expected: 67 },
    { completed: 3, expected: 100 },
  ])(
    'returns $expected percent for $completed of 3 completed tasks',
    ({ completed, expected }) => {
      const tasks = Array.from({ length: 3 }, (_, index) =>
        makeTask(String(index), { status: index < completed ? 'done' : 'new' }),
      );

      expect(getTaskStats(tasks, now).progressPercent).toBe(expected);
    },
  );

  it('does not flag any deadlines when all tasks are completed', () => {
    const tasks = [
      makeTask('past', { status: 'done', deadline: deadlineIn(-hour) }),
      makeTask('soon', { status: 'done', deadline: deadlineIn(hour) }),
    ];

    expect(getTaskStats(tasks, now)).toMatchObject({
      done: 2,
      overdue: 0,
      progressPercent: 100,
      deadlineIndicator: 'none',
    });
  });

  it('uses the time zone offset when comparing a deadline to now', () => {
    const tasks = [
      makeTask('now', { deadline: '2026-10-29T12:00:00+03:00' }),
      makeTask('past', { deadline: '2026-10-29T11:00:00+03:00' }),
    ];

    expect(getTaskStats(tasks, now)).toMatchObject({
      new: 2,
      overdue: 1,
      deadlineIndicator: 'overdue',
    });
  });
});

describe('filterTasks', () => {
  const tasks = [
    makeTask('overdue-new', { deadline: deadlineIn(-1), priority: 'low' }),
    makeTask('working', { status: 'in_progress', priority: 'high' }),
    makeTask('done', { status: 'done', deadline: deadlineIn(-hour) }),
    makeTask('new-future'),
  ];

  it('shows all tasks in their input order by default', () => {
    expect(filterTasks(tasks, defaultTaskFilters, now)).toEqual(tasks);
  });
  it.each([
    ['new', ['overdue-new', 'new-future']],
    ['in_progress', ['working']],
    ['done', ['done']],
  ] as const)('filters status %s', (status, ids) => {
    expect(
      filterTasks(tasks, { ...defaultTaskFilters, status }, now).map(
        (task) => task.id,
      ),
    ).toEqual(ids);
  });
  it.each([
    ['low', ['overdue-new']],
    ['medium', ['done', 'new-future']],
    ['high', ['working']],
  ] as const)('filters priority %s', (priority, ids) => {
    expect(
      filterTasks(tasks, { ...defaultTaskFilters, priority }, now).map(
        (task) => task.id,
      ),
    ).toEqual(ids);
  });
  it('combines filters as an intersection', () => {
    expect(
      filterTasks(
        tasks,
        { status: 'new', priority: 'low', overdueOnly: true },
        now,
      ).map((task) => task.id),
    ).toEqual(['overdue-new']);
    expect(
      filterTasks(
        tasks,
        { status: 'done', priority: 'all', overdueOnly: true },
        now,
      ),
    ).toEqual([]);
  });
  it('excludes completed tasks and deadlines exactly at now from overdue results', () => {
    const tasks = [
      makeTask('past', { status: 'in_progress', deadline: deadlineIn(-1) }),
      makeTask('now', { deadline: deadlineIn(0) }),
      makeTask('future', { deadline: deadlineIn(1) }),
      makeTask('done', { status: 'done', deadline: deadlineIn(-hour) }),
    ];
    expect(
      filterTasks(tasks, { ...defaultTaskFilters, overdueOnly: true }, now).map(
        (task) => task.id,
      ),
    ).toEqual(['past']);
  });
  it('compares overdue deadlines as instants with time zones', () => {
    const tasks = [
      makeTask('now', { deadline: '2026-10-29T12:00:00+03:00' }),
      makeTask('past', { deadline: '2026-10-29T11:59:59+03:00' }),
    ];
    expect(
      filterTasks(tasks, { ...defaultTaskFilters, overdueOnly: true }, now).map(
        (task) => task.id,
      ),
    ).toEqual(['past']);
  });
  it('handles empty lists and combinations with no matches', () => {
    expect(filterTasks([], defaultTaskFilters, now)).toEqual([]);
    expect(
      filterTasks(
        tasks,
        { ...defaultTaskFilters, status: 'done', priority: 'low' },
        now,
      ),
    ).toEqual([]);
  });
  it('keeps the existing sort rules and does not mutate source tasks or filters', () => {
    const source = Object.freeze(
      [...tasks].reverse().map((task) => Object.freeze({ ...task })),
    );
    const before = structuredClone(source);
    const filters = Object.freeze({
      ...defaultTaskFilters,
      status: 'new' as const,
    });
    const result = filterTasks(source, filters, now);
    expect(sortTasks(result, now).map((task) => task.id)).toEqual([
      'overdue-new',
      'new-future',
    ]);
    expect(source).toEqual(before);
    expect(result).not.toBe(source);
    expect(filters).toEqual({
      status: 'new',
      priority: 'all',
      overdueOnly: false,
    });
  });
});
