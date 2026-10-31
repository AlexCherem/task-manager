'use client';

import { Progress, Tag, theme } from 'antd';

import type { TaskStats } from '../model/task';
import styles from './task-stats-summary.module.css';

export function TaskStatsSummary({ stats }: { stats: TaskStats }) {
  const { token } = theme.useToken();

  return (
    <div className={styles.summary}>
      <p className={styles.total}>Всего задач: {stats.total}</p>
      <dl className={styles.counters}>
        <div>
          <dt>Новые</dt>
          <dd>{stats.new}</dd>
        </div>
        <div>
          <dt>В процессе</dt>
          <dd>{stats.inProgress}</dd>
        </div>
        <div>
          <dt>Выполнены</dt>
          <dd>{stats.done}</dd>
        </div>
        <div>
          <dt>Просрочены</dt>
          <dd>{stats.overdue}</dd>
        </div>
      </dl>
      <div className={styles.progress}>
        <span>Выполнено: {stats.progressPercent}%</span>
        <Progress
          percent={stats.progressPercent}
          showInfo={false}
          aria-label="Прогресс выполнения задач"
        />
      </div>
      <div className={styles.indicator}>
        {stats.deadlineIndicator === 'overdue' ? (
          <Tag color="red">Есть просроченные задачи</Tag>
        ) : stats.deadlineIndicator === 'due_soon' ? (
          <Tag color="gold">Дедлайн в ближайшие 48 часов</Tag>
        ) : (
          <span className={styles.noDeadline}>
            <span
              className={styles.dot}
              style={{ background: token.colorTextQuaternary }}
            />
            Нет срочных дедлайнов
          </span>
        )}
      </div>
    </div>
  );
}
