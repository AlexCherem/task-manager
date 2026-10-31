'use client';

import { Button, Checkbox, Select } from 'antd';
import { useId } from 'react';

import {
  taskStatusLabels,
  taskPriorityLabels,
  type TaskFilters,
} from '@/entities/task';

import styles from './task-filters-bar.module.css';

export function TaskFiltersBar({
  value,
  onChange,
  onReset,
}: {
  value: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  onReset: () => void;
}) {
  const id = useId();
  const hasFilters =
    value.status !== 'all' || value.priority !== 'all' || value.overdueOnly;

  return (
    <section aria-label="Фильтры задач" className={styles.filters}>
      <div className={styles.field}>
        <label htmlFor={`${id}-status`}>Статус</label>
        <Select<TaskFilters['status']>
          id={`${id}-status`}
          value={value.status}
          virtual={false}
          onChange={(status) => onChange({ ...value, status })}
          options={[
            { value: 'all', label: 'Все статусы' },
            ...Object.entries(taskStatusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-priority`}>Приоритет</label>
        <Select<TaskFilters['priority']>
          id={`${id}-priority`}
          value={value.priority}
          virtual={false}
          onChange={(priority) => onChange({ ...value, priority })}
          options={[
            { value: 'all', label: 'Все приоритеты' },
            ...Object.entries(taskPriorityLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>
      <div className={styles.actions}>
        <Checkbox
          checked={value.overdueOnly}
          onChange={(event) =>
            onChange({ ...value, overdueOnly: event.target.checked })
          }
        >
          Только просроченные
        </Checkbox>
        <Button onClick={onReset} disabled={!hasFilters}>
          Сбросить
        </Button>
      </div>
    </section>
  );
}
