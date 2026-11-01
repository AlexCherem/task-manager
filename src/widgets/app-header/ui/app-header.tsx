import Link from 'next/link';

import { Button } from '@/shared/ui/button';

import { logout } from '@/features/auth/api';
import { ThemeSwitcher } from '@/features/theme';

import styles from './app-header.module.css';

export function AppHeader({ email }: { email: string }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          href="/lists"
          className={styles.brand}
          aria-label="Task Manager — списки задач"
        >
          <span className={styles.mark} aria-hidden="true">
            ✓
          </span>
          Task Manager
        </Link>
        <div className={styles.controls}>
          <ThemeSwitcher />
          <div className={styles.account}>
            <span className={styles.email}>{email}</span>
            <form action={logout}>
              <Button htmlType="submit">Выйти</Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
