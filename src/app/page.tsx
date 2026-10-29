import { Card } from 'antd';

export default function Home() {
  return (
    <main className="app-shell">
      <Card className="welcome-card">
        <h1>Task Manager</h1>
        <p>Приложение для управления списками и задачами.</p>
      </Card>
    </main>
  );
}
