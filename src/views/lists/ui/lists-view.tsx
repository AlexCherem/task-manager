import { Button, Card } from 'antd';

import { logout } from '@/features/auth/api';

export function ListsView({ email }: { email: string }) {
  return (
    <main className="app-shell">
      <Card className="welcome-card">
        <h1>Task Manager</h1>
        <p>Вы вошли как {email}.</p>
        <form action={logout} style={{ marginTop: 24 }}>
          <Button htmlType="submit">Выйти</Button>
        </form>
      </Card>
    </main>
  );
}
