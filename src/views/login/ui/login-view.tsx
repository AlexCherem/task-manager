import { Card } from 'antd';

import { LoginForm } from '@/features/auth';
import { login } from '@/features/auth/api';

import styles from './login-view.module.css';

export function LoginView() {
  return (
    <main className="app-shell">
      <Card className={styles.card}>
        <p className={styles.brand}>Task Manager</p>
        <h1 className={styles.title}>Вход в аккаунт</h1>
        <p className={styles.description}>
          Войдите, чтобы управлять списками и задачами.
        </p>
        <LoginForm onSubmit={login} />
      </Card>
    </main>
  );
}
