import { Card } from 'antd';

export function ListsView() {
  return (
    <section aria-labelledby="lists-title">
      <h1 id="lists-title" className="page-title">
        Списки задач
      </h1>
      <Card>
        <p className="page-description">
          Здесь будут отображаться ваши списки задач.
        </p>
      </Card>
    </section>
  );
}
